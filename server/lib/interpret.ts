// 문자 해석(MVP 스펙 '처리 순서' 2단계). LLM은 해석·추출만 하고, 결과는 코드로 검사한다.
// LLM 호출이 시간 안에 끝나지 않거나 형식·검사를 통과하지 못하면 규칙 기반 대체 결과를 쓴다.

export const EVENT_TYPES = ['일정 변경', '결석', '이용 내역', '보강', '공지', '치료 피드백', '서류', '담당자 변경'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export interface Interpretation {
  type: EventType;
  organization: string | null;
  date: string | null;
  time: string | null;
  amount: number | null;
  quote: string;
  confidence: number;
  source: 'llm' | 'fallback';
}

export interface InterpretContext {
  today: string;
  organizations: string[];
}

export interface InterpretRun {
  items: Interpretation[];
  interpreter: 'openai' | 'fallback';
  model: string | null;
  ms: number;
  error?: string;
}

const LLM_TIMEOUT_MS = 25_000;

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['items'],
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['index', 'type', 'organization', 'date', 'time', 'amount', 'quote', 'confidence'],
        properties: {
          index: { type: 'integer' },
          type: { type: 'string', enum: [...EVENT_TYPES] },
          organization: { type: ['string', 'null'] },
          date: { type: ['string', 'null'], description: 'YYYY-MM-DD. 사건이 일어나는 날' },
          time: { type: ['string', 'null'], description: 'HH:MM. 문자에 나온 시각(바뀐 시각, 보강 시각 등)' },
          amount: { type: ['integer', 'null'], description: '원 단위 금액' },
          quote: { type: 'string', description: '판단 근거가 된 문자 속 구절을 그대로' },
          confidence: { type: 'number', description: '0~1' },
        },
      },
    },
  },
} as const;

function instructions(ctx: InterpretContext): string {
  return [
    '너는 발달장애 아동의 부모가 받은 치료 기관·학교 문자를 정리하는 도우미야.',
    '문자 하나는 사건 하나로 보고, 사건 종류와 기관·날짜·시각·금액을 뽑아.',
    `오늘은 ${ctx.today}이야. 연도가 없는 날짜는 오늘과 가장 가까운 날로 연도를 채워.`,
    `기관은 다음 중 하나로 맞추고, 없으면 null: ${ctx.organizations.join(', ')}.`,
    '문자에 없는 내용은 추측하지 말고 null로 둬. quote는 문자 속 구절을 고치지 말고 그대로 옮겨.',
    '진단, 치료 방향, 기관·치료사 평가, 부정수급 여부는 판단하지 마.',
  ].join('\n');
}

async function callOpenAI(texts: string[], ctx: InterpretContext): Promise<{ items: unknown[]; model: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? 'gpt-6.1-sol';
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
  try {
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        instructions: instructions(ctx),
        input: JSON.stringify(texts.map((text, index) => ({ index, text }))),
        text: { format: { type: 'json_schema', name: 'interpretations', strict: true, schema: SCHEMA } },
      }),
    });
    if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const body = (await res.json()) as { output?: { type: string; content?: { type: string; text?: string }[] }[] };
    const text = body.output
      ?.find((o) => o.type === 'message')
      ?.content?.find((c) => c.type === 'output_text')?.text;
    if (!text) throw new Error('OpenAI response has no output_text');
    return { items: (JSON.parse(text) as { items: unknown[] }).items, model };
  } finally {
    clearTimeout(timer);
  }
}

const squash = (s: string) => s.replace(/\s+/g, '');

function matchOrganization(name: string | null, ctx: InterpretContext): string | null {
  if (!name) return null;
  return ctx.organizations.find((o) => squash(o) === squash(name)) ?? null;
}

function validDate(s: unknown): string | null {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) ? s : null;
}

function validTime(s: unknown): string | null {
  return typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s) ? s : null;
}

/** LLM 결과 한 건을 코드로 검사한다. 근거 구절이 원문에 없으면 원문 앞부분으로 바꾸고 신뢰도를 낮춘다. */
function check(raw: Record<string, unknown>, text: string, ctx: InterpretContext): Interpretation {
  const type = EVENT_TYPES.includes(raw.type as EventType) ? (raw.type as EventType) : fallbackOne(text, ctx).type;
  let quote = typeof raw.quote === 'string' ? raw.quote.trim() : '';
  let confidence = typeof raw.confidence === 'number' ? Math.min(1, Math.max(0, raw.confidence)) : 0.5;
  if (!quote || !squash(text).includes(squash(quote))) {
    quote = text.slice(0, 60);
    confidence = Math.min(confidence, 0.5);
  }
  return {
    type,
    organization: matchOrganization(typeof raw.organization === 'string' ? raw.organization : null, ctx),
    date: validDate(raw.date),
    time: validTime(raw.time),
    amount: Number.isInteger(raw.amount) && (raw.amount as number) >= 0 ? (raw.amount as number) : null,
    quote,
    confidence: Math.round(confidence * 1000) / 1000,
    source: 'llm',
  };
}

/** 규칙 기반 대체 결과. 키워드로 사건 종류를 고르고, 기관·날짜·금액은 정규식으로 뽑는다. */
export function fallbackOne(text: string, ctx: InterpretContext): Interpretation {
  const has = (...words: string[]) => words.some((w) => text.includes(w));
  const type: EventType =
    has('담당') && has('변경', '바뀌') ? '담당자 변경'
    : has('결석') ? '결석'
    : has('보강') ? '보강'
    : has('변경', '늦춰', '옮겨', '바뀌') ? '일정 변경'
    : /\d[\d,]*\s*원/.test(text) ? '이용 내역'
    : has('휴원', '휴무', '주차', '안내', '공지') ? '공지'
    : has('증명서', '진단서', '서류', '발급') ? '서류'
    : '치료 피드백';
  const md = text.match(/(\d{1,2})\/(\d{1,2})/);
  const year = ctx.today.slice(0, 4);
  const date = md ? validDate(`${year}-${md[1].padStart(2, '0')}-${md[2].padStart(2, '0')}`) : null;
  const tm = text.match(/(\d{1,2}):(\d{2})/g);
  const amount = text.match(/(\d[\d,]*)\s*원/);
  return {
    type,
    organization: ctx.organizations.find((o) => squash(text).includes(squash(o))) ?? null,
    date,
    time: tm ? validTime(tm[tm.length - 1].padStart(5, '0')) : null,
    amount: amount ? Number(amount[1].replace(/,/g, '')) : null,
    quote: text.slice(0, 60),
    confidence: 0.3,
    source: 'fallback',
  };
}

export async function interpretTexts(texts: string[], ctx: InterpretContext): Promise<InterpretRun> {
  const started = Date.now();
  try {
    const { items, model } = await callOpenAI(texts, ctx);
    const byIndex = new Map<number, Record<string, unknown>>();
    for (const item of items as Record<string, unknown>[]) {
      if (typeof item?.index === 'number') byIndex.set(item.index, item);
    }
    return {
      items: texts.map((text, i) => (byIndex.has(i) ? check(byIndex.get(i)!, text, ctx) : fallbackOne(text, ctx))),
      interpreter: 'openai',
      model,
      ms: Date.now() - started,
    };
  } catch (err) {
    return {
      items: texts.map((text) => fallbackOne(text, ctx)),
      interpreter: 'fallback',
      model: null,
      ms: Date.now() - started,
      error: String((err as Error).message ?? err).slice(0, 300),
    };
  }
}
