import { addDays, addMinutes, ageOn, diffDays, koDate, monthDay, shortDay, startOfWeek, weekdayIndex } from './dates';
import * as seed from '../mocks/ieum';
import * as server from './server';
import type {
  Approval, ApprovalKind, ApplicationData, ApplicationStatus, ChecklistRow, Counter, DeadlineKind, DeadlineRow,
  DemoData, DocumentRow, HomeCard, HomeData, InboxItem, Note, OrgId, OutputDoc, ProfileView, Profile, ProgramRow,
  RadarData, Reason, RunResult, ResumeData, ResumeTab, SceneNo, SessionRow, SessionStatus, Source, Tone, UsageRow, VoucherData, WeekData,
} from './types';

const { TODAY, MONTH_END } = seed;
export const profileOptions = seed.profileOptions;

interface CardState { id: string; tone: Tone; title: string; body: string; refIds: string[]; actionLabel?: string; to?: string; approvalId?: string; dueOn?: string }
interface DeadlineState { id: string; title: string; dueOn: string; kind: DeadlineKind; to?: string }
interface DocState { id: string; docType: string; issuedOn: string; validUntil: string | null; fileName: string }
interface ApprovalState extends Omit<Approval, 'refs'> { refIds: string[]; docId?: string; makeupId?: string }
interface ApplicationState { id: string; programId: string; status: ApplicationStatus; approvalId?: string; submittedAt?: string }
interface State {
  profile: Profile;
  scenes: Record<SceneNo, boolean>;
  directDone: boolean;
  inbox: InboxItem[];
  overrides: seed.SessionOverride[];
  offers: { id: string; serviceId: string; date: string; start: string; requested: boolean }[];
  usage: { id: string; date: string; orgId: OrgId; amount: number }[];
  notes: Note[];
  documents: DocState[];
  deadlines: DeadlineState[];
  approvals: ApprovalState[];
  cards: CardState[];
  application: ApplicationState | null;
  docExtras: Record<string, string[]>;
  shares: Record<string, string>;
  collected: boolean;
  requests: string[];
}

let seq = 0;
const nextId = (prefix: string) => `${prefix}-${++seq}`;
const fmt = (v: number) => v.toLocaleString('ko-KR');
const orgName = (id: OrgId) => seed.organizations.find((o) => o.id === id)?.name ?? id;

// 시연을 시작할 때의 프로필·서류함. 서버가 있으면 DB 값으로 바뀐다(아래 hydrated).
let base: { profile: Profile; documents: DocState[] } = { profile: seed.profile, documents: seed.documents };

const initialState = (): State => {
  const diag = base.documents.find((d) => d.docType === '진단서');
  return {
    profile: structuredClone(base.profile),
    scenes: { 1: false, 2: false, 3: false },
    directDone: false,
    inbox: [],
    overrides: [],
    offers: [],
    usage: [],
    notes: structuredClone(seed.notes),
    documents: structuredClone(base.documents),
    deadlines: structuredClone(seed.deadlines),
    approvals: [],
    cards: diag?.validUntil
      ? [{
          id: 'card-diag', tone: 'warning', title: '진단서 유효기간이 곧 끝나요',
          body: `서류함의 진단서가 ${koDate(diag.validUntil)}까지 유효해요. 새로 발급이 필요한지 확인해 주세요.`,
          refIds: [`doc:${diag.id}`], actionLabel: '서류함 보기', to: '/documents', dueOn: diag.validUntil,
        }]
      : [],
    application: null,
    docExtras: {},
    shares: {},
    collected: false,
    requests: [],
  };
};

let state = initialState();
let version = 0;
const listeners = new Set<() => void>();
export const subscribeStore = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
export const getStoreVersion = () => version;
const commit = () => {
  version += 1;
  listeners.forEach((fn) => fn());
};

// 서버가 있으면 프로필과 서류함은 DB(Azure SQL)에서 시작한다. 가져오지 못하면 목업 값으로 시작한다.
const hydrated: Promise<void> = server.remote
  ? Promise.all([server.fetchProfile(), server.fetchDocuments()])
      .then(([profile, documents]) => {
        base = { profile, documents };
        state = initialState();
        commit();
      })
      .catch((err) => console.warn('[ieum] 서버에서 시작 데이터를 가져오지 못해 목업으로 시작해요', err))
  : Promise.resolve();

const wait = async (ms = 200) => {
  await hydrated;
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
};

/** 서버가 해석한 문자 한 건을 넘기기 목록의 결과 문장으로 바꾼다. */
function interpretedResult(r: server.Interpreted): string {
  if (!r.type) return '정리했어요';
  const parts = [r.date ? shortDay(r.date) : null, r.organization, r.time, r.amount !== null ? `${fmt(r.amount)}원` : null].filter(Boolean);
  const head = `${r.source === 'fallback' ? '규칙 기반 정리' : 'AI 해석'} · ${r.type}${parts.length ? ` → ${parts.join(' ')}` : ''}`;
  return r.quote ? `${head} · 근거 “${r.quote}”` : head;
}

/** 문자들을 서버에 넘겨 해석까지 받아 온다. 서버가 없거나 실패하면 null. */
async function interpretOnServer(texts: string[]): Promise<server.Interpreted[] | null> {
  if (!server.remote || texts.length === 0) return null;
  try {
    const { runId } = await server.postInbox(texts);
    return (await server.fetchRun(runId)).items;
  } catch (err) {
    console.warn('[ieum] 서버 해석에 실패해 준비된 결과를 써요', err);
    return null;
  }
}

// ---------- 근거 ----------
const noteLabel = (note: Note) =>
  `${note.orgId ? orgName(note.orgId) : '집'} ${note.author === '부모' ? '부모 한마디' : '치료 피드백'} · ${note.date}`;

function resolveSource(id: string): Source | null {
  if (id === 'profile') {
    const p = state.profile;
    return { id, label: '프로필', text: `${p.name} · ${ageOn(p.birthDate, TODAY)}세 · ${p.grade} ${p.schoolClass}` };
  }
  const item = state.inbox.find((i) => i.id === id);
  if (item) return { id, label: item.label, text: item.rawText };
  const note = state.notes.find((x) => x.id === id);
  if (note) return { id, label: noteLabel(note), text: note.text };
  if (id.startsWith('prog:')) {
    const p = seed.programs.find((x) => x.id === id.slice(5));
    return p ? { id, label: `공고 원문 · ${p.orgName}`, text: p.quote, url: p.sourceUrl } : null;
  }
  if (id.startsWith('doc:')) {
    const d = state.documents.find((x) => x.id === id.slice(4));
    return d ? { id, label: `서류함 · ${d.docType}`, text: `발급 ${d.issuedOn}${d.validUntil ? ` · 유효기간 ${d.validUntil}` : ''}` } : null;
  }
  return null;
}
const resolveAll = (ids: string[]) => ids.map(resolveSource).filter((s): s is Source => s !== null);

// ---------- 시간표 ----------
function buildSession(svc: seed.ServiceSeed, date: string): SessionRow {
  const ov = state.overrides.find((o) => o.serviceId === svc.id && o.date === date);
  const start = ov?.start ?? svc.start;
  return {
    id: `${svc.id}:${date}`, date, start, end: addMinutes(start, svc.minutes), orgId: svc.orgId, orgName: orgName(svc.orgId),
    therapy: svc.therapy, funding: svc.funding, status: ov?.status ?? (date < TODAY ? '출석' : '예정'), changedFrom: ov?.changedFrom,
  };
}

function offerRow(o: State['offers'][number]): SessionRow {
  const svc = seed.services.find((s) => s.id === o.serviceId)!;
  return {
    id: o.id, date: o.date, start: o.start, end: addMinutes(o.start, svc.minutes), orgId: svc.orgId, orgName: orgName(svc.orgId),
    therapy: svc.therapy, funding: svc.funding, status: o.requested ? '보강 요청' : '보강 제안',
  };
}

function sessionsOn(date: string): SessionRow[] {
  const regular = seed.services.filter((s) => s.weekday === weekdayIndex(date)).map((s) => buildSession(s, date));
  const extra = state.offers.filter((o) => o.date === date).map(offerRow);
  return [...regular, ...extra].sort((a, b) => a.start.localeCompare(b.start));
}

const MIN_WEEK = '2026-09-07';
const MAX_WEEK = '2026-11-30';

export async function getSchedule(week?: string): Promise<WeekData> {
  await wait();
  const weekStart = startOfWeek(week ?? TODAY);
  const prev = addDays(weekStart, -7);
  const next = addDays(weekStart, 7);
  return {
    today: TODAY,
    weekStart,
    weekEnd: addDays(weekStart, 4),
    prevWeek: prev >= MIN_WEEK ? prev : null,
    nextWeek: next <= MAX_WEEK ? next : null,
    isThisWeek: weekStart === startOfWeek(TODAY),
    days: [0, 1, 2, 3, 4].map((i) => {
      const date = addDays(weekStart, i);
      return { date, sessions: sessionsOn(date) };
    }),
  };
}

// ---------- 바우처 ----------
function voucherData(): VoucherData {
  const usage: UsageRow[] = state.usage.map((u) => {
    const svc = seed.services.find((s) => s.orgId === u.orgId && s.funding === '바우처');
    const session = svc && svc.weekday === weekdayIndex(u.date) ? buildSession(svc, u.date) : null;
    let match: UsageRow['match'] = '미확인';
    let reason: string | undefined;
    if (session) {
      if (session.status === '결석' || session.status === '취소') {
        match = '확인 필요';
        reason = `${shortDay(u.date)} 수업은 ${session.status} 처리됐는데 이용 내역이 있어요`;
      } else match = '일치';
    }
    return { id: u.id, date: u.date, orgId: u.orgId, orgName: orgName(u.orgId), amount: u.amount, match, reason };
  });
  usage.sort((a, b) => b.date.localeCompare(a.date));

  const used = state.usage.reduce((sum, u) => sum + u.amount, 0);
  let planned = 0;
  for (let d = addDays(TODAY, 1); d <= MONTH_END; d = addDays(d, 1)) {
    for (const svc of seed.services) {
      if (svc.funding === '바우처' && svc.weekday === weekdayIndex(d) && buildSession(svc, d).status === '예정') planned += svc.price;
    }
  }
  for (const o of state.offers) {
    if (o.requested && o.date <= MONTH_END) planned += seed.services.find((s) => s.id === o.serviceId)?.price ?? 0;
  }
  const remaining = seed.voucher.limit - used;
  const voucherAreas = seed.services.filter((s) => s.funding === '바우처').map((s) => s.therapy);
  const clash = seed.services.filter((s) => s.funding === '교육청' && voucherAreas.includes(s.therapy));
  const edu = seed.services.find((s) => s.funding === '교육청');
  return {
    month: seed.voucher.month,
    programName: seed.voucher.programName,
    limit: seed.voucher.limit,
    used,
    planned,
    remaining,
    expiring: usage.length ? Math.max(0, remaining - planned) : null,
    usage,
    overlap: clash.length
      ? { warning: true, text: `${clash.map((s) => s.therapy).join(', ')}이(가) 바우처와 교육청 지원에 함께 잡혀 있어요.` }
      : { warning: false, text: edu ? `교육청 치료지원(${orgName(edu.orgId)} ${edu.therapy})과 같은 영역의 바우처 이용은 없어요.` : '교육청 치료지원 내역이 없어요.' },
  };
}

export async function getVoucher(): Promise<VoucherData> {
  await wait();
  return voucherData();
}

// ---------- 공고·마감 ----------
function gradeNumber(g: string): number | null {
  if (g === '미취학') return 0;
  const m = g.match(/^초등 (\d)학년$/);
  if (m) return Number(m[1]);
  if (g === '중학생') return 8;
  if (g === '고등학생') return 11;
  return null;
}

function toProgramRow(p: seed.ProgramSeed): ProgramRow {
  const prof = state.profile;
  const g = gradeNumber(prof.grade);
  const reasons: Reason[] = [
    { label: `대상 학년: ${p.gradeLabel} · 우리 아이: ${prof.grade || '입력 전'}`, result: g === null ? 'unknown' : g >= p.gradeMin && g <= p.gradeMax ? 'ok' : 'no' },
    { label: `대상 장애: ${p.disability.join('·')} · 우리 아이: ${prof.disability || '입력 전'}`, result: !prof.disability ? 'unknown' : p.disability.includes(prof.disability) ? 'ok' : 'no' },
    { label: `대상 지역: ${p.region} · 사는 곳: ${prof.region || '입력 전'}`, result: !prof.region ? 'unknown' : prof.region === p.region ? 'ok' : 'no' },
  ];
  const eligible = reasons.some((r) => r.result === 'no') ? '비해당' : reasons.some((r) => r.result === 'unknown') ? '해당 가능' : '해당';
  return {
    id: p.id, title: p.title, orgName: p.orgName, deadline: p.deadline, channel: p.channel, requiredDocs: p.requiredDocs,
    sourceUrl: p.sourceUrl, quote: p.quote, eligible, reasons,
    applicationId: state.application?.programId === p.id ? state.application.id : undefined,
  };
}

const eligibleOrder = { '해당': 0, '해당 가능': 1, '비해당': 2 } as const;

function deadlineRows(): DeadlineRow[] {
  return state.deadlines
    .map((d) => ({ ...d, dday: diffDays(d.dueOn, TODAY) }))
    .sort((a, b) => a.dueOn.localeCompare(b.dueOn));
}

export async function getRadar(): Promise<RadarData> {
  await wait();
  const programs = state.collected
    ? seed.programs.map(toProgramRow).sort((a, b) => eligibleOrder[a.eligible] - eligibleOrder[b.eligible])
    : [];
  return { today: TODAY, collected: state.collected, programs, deadlines: deadlineRows() };
}

// ---------- 서류·신청 ----------
const latestDoc = (docType: string) =>
  state.documents.filter((d) => d.docType === docType).sort((a, b) => a.issuedOn.localeCompare(b.issuedOn)).at(-1);

function checklistFor(program: seed.ProgramSeed): ChecklistRow[] {
  return program.requiredDocs.map((docType) => {
    if (docType.endsWith('신청서')) return { docType, status: '있음', note: '이음이 초안을 썼어요' };
    const doc = latestDoc(docType);
    if (!doc) return { docType, status: '없음', note: '서류함에 없어요' };
    if (doc.validUntil && doc.validUntil < TODAY) return { docType, status: '만료', note: `유효기간이 ${doc.validUntil}에 끝났어요` };
    return { docType, status: '있음', note: `서류함의 ${doc.issuedOn} 발급본` };
  });
}

function documentRows(): DocumentRow[] {
  return [...state.documents]
    .sort((a, b) => b.issuedOn.localeCompare(a.issuedOn))
    .map((d) => ({
      ...d,
      dday: d.validUntil ? diffDays(d.validUntil, TODAY) : null,
      expired: d.validUntil ? d.validUntil < TODAY : false,
    }));
}

export async function getDocuments(): Promise<DocumentRow[]> {
  await wait();
  return documentRows();
}

export async function getApplication(id: string): Promise<ApplicationData | null> {
  await wait();
  const app = state.application;
  const program = app && app.id === id ? seed.programs.find((p) => p.id === app.programId) : undefined;
  if (!app || !program) return null;
  const checklist = checklistFor(program);
  const indexOf: Record<ApplicationStatus, number> = { '준비': 0, '승인 대기': 1, '제출': 2, '접수': 3, '보완 요청': 3, '선정': 4, '미선정': 4 };
  const prof = state.profile;
  const values = { name: prof.name, birthDate: prof.birthDate, grade: prof.grade, disability: prof.disability, region: prof.region, caregiverName: prof.caregiver.name, phone: prof.caregiver.phone };
  return {
    id: app.id,
    program: toProgramRow(program),
    status: app.status,
    steps: ['준비', '승인 대기', '제출', '접수', '결과'],
    stepIndex: indexOf[app.status],
    form: seed.applicationFields.map((f) => ({ label: f.label, value: values[f.key], filled: values[f.key].trim() !== '' })),
    checklist,
    missing: checklist.filter((c) => c.status !== '있음').map((c) => c.docType),
    submittedAt: app.submittedAt,
    resultOn: app.status === '제출' || app.status === '접수' ? seed.RESULT_ON : undefined,
    approvalId: app.approvalId,
    guide: seed.issueGuide,
  };
}

function syncApplication(uploadedForMissing: boolean) {
  const app = state.application;
  if (!app) return;
  const program = seed.programs.find((p) => p.id === app.programId);
  if (!program || app.status !== '준비') return;
  if (checklistFor(program).some((c) => c.status !== '있음')) return;
  if (uploadedForMissing) state.directDone = true;
  const approval = makeApproval({
    scene: 2, kind: '신청 제출', title: `${program.title} 신청서 제출`, recipient: `${program.orgName} (테스트 메일함)`,
    draftText: `${program.title}에 ${state.profile.name} 참가 신청서와 서류 ${program.requiredDocs.length - 1}건을 이메일로 제출해요.`,
    refIds: [`prog:${program.id}`], link: { label: '신청서 미리보기', to: `/applications/${app.id}` },
  });
  state.approvals.push(approval);
  app.status = '승인 대기';
  app.approvalId = approval.id;
  state.cards.unshift({
    id: nextId('card'), tone: 'info', title: '신청서를 제출할 준비가 됐어요',
    body: `${program.title} 신청서와 서류가 모두 갖춰졌어요. 승인하면 제출해요.`,
    refIds: [`prog:${program.id}`], actionLabel: '승인함 보기', to: '/approvals', approvalId: approval.id,
  });
}

export async function uploadDocument(input: { docType: string; fileName: string }): Promise<void> {
  await wait(300);
  const program = state.application ? seed.programs.find((p) => p.id === state.application!.programId) : undefined;
  const wasMissing = program ? checklistFor(program).some((c) => c.docType === input.docType && c.status !== '있음') : false;
  state.documents.push({
    id: nextId('doc'), docType: input.docType, issuedOn: TODAY,
    validUntil: input.docType === '복지카드 사본' ? null : addDays(TODAY, 90), fileName: input.fileName,
  });
  syncApplication(wasMissing);
  commit();
}

// ---------- 승인함 ----------
function makeApproval(p: {
  scene: SceneNo | 0; kind: ApprovalKind; title: string; recipient: string; draftText: string; refIds: string[];
  guide?: Approval['guide']; link?: Approval['link']; docId?: string; makeupId?: string;
}): ApprovalState {
  return { id: nextId('ap'), status: '/대기'.slice(1) as '대기', how: null, originalText: p.draftText, ...p };
}

function toApproval(a: ApprovalState): Approval {
  const { refIds, docId, makeupId, ...rest } = a;
  void makeupId;
  let sentLink: Approval['sentLink'];
  if (a.status === '보냄') {
    if (a.kind === '문서 공유' && docId && state.shares[docId]) sentLink = { label: '공유 페이지 열기', to: `/share/${state.shares[docId]}` };
    if (a.kind === '신청 제출' && state.application) sentLink = { label: '신청 진행 보기', to: `/applications/${state.application.id}` };
  }
  return { ...rest, refs: resolveAll(refIds), sentLink };
}

export async function getApprovals(): Promise<Approval[]> {
  await wait();
  const list = state.approvals.map(toApproval);
  return [...list.filter((a) => a.status === '대기'), ...list.filter((a) => a.status !== '대기')];
}

export async function getPendingCount(): Promise<number> {
  return state.approvals.filter((a) => a.status === '대기').length;
}

export async function decideApproval(
  id: string,
  action: 'approve' | 'edit' | 'hold' | 'reopen',
  opts: { text?: string; requestId?: string } = {},
): Promise<void> {
  await wait(250);
  const ap = state.approvals.find((a) => a.id === id);
  if (!ap) throw new Error('not found');
  if (opts.requestId && state.requests.includes(opts.requestId)) return;
  if (action === 'reopen') {
    if (ap.status === '보류') ap.status = '대기';
  } else if (action === 'hold') {
    if (ap.status === '대기') ap.status = '보류';
  } else if (ap.status !== '보냄') {
    if (action === 'edit') {
      if (!opts.text || !opts.text.trim()) throw new Error('empty');
      ap.draftText = opts.text.trim();
    }
    ap.status = '보냄';
    ap.how = action === 'edit' ? '고쳐서 승인' : '승인';
    if (ap.kind === '보강 요청') {
      const offer = state.offers.find((o) => o.id === ap.makeupId);
      if (offer) offer.requested = true;
    }
    if (ap.kind === '신청 제출' && state.application) {
      state.application.status = '제출';
      state.application.submittedAt = TODAY;
      state.deadlines.push({ id: 'dl-result', title: '주말 사회성 프로그램 결과 발표', dueOn: seed.RESULT_ON, kind: '신청', to: `/applications/${state.application.id}` });
    }
    if (ap.kind === '문서 공유' && ap.docId) state.shares[ap.docId] = `share-${ap.docId}`;
  }
  if (opts.requestId) state.requests.push(opts.requestId);
  commit();
}

const recipients: Record<string, string> = { iep: '특수교사', handover: 'B 감각통합센터 새 담당 선생님', intro: '신청 기관' };
const shareTexts: Record<string, string> = {
  iep: '협의 전에 참고하실 수 있도록 IEP 준비 한 장을 보내드립니다.',
  handover: '새 담당 선생님께서 참고하실 수 있도록 인계서를 보내드립니다.',
  intro: '신청서에 참고하실 수 있도록 아이 소개를 보내드립니다.',
};

export async function requestShare(docId: string): Promise<string> {
  await wait(250);
  const found = state.approvals.find((a) => a.kind === '문서 공유' && a.docId === docId && a.status !== '보류');
  if (found) return found.id;
  const tpl = seed.outputTemplates.find((t) => t.id === docId);
  if (!tpl) throw new Error('not found');
  const ap = makeApproval({
    scene: 0, kind: '문서 공유', title: `${tpl.title.replace('{name}', state.profile.name)} 공유`, recipient: recipients[docId] ?? '기관',
    draftText: `안녕하세요, ${state.profile.name} 어머니입니다. ${shareTexts[docId] ?? '문서를 보내드립니다.'} 확인 부탁드립니다.`,
    refIds: [], link: { label: '공유할 문서 보기', to: `/outputs/${docId}` }, docId,
  });
  state.approvals.push(ap);
  commit();
  return ap.id;
}

// ---------- 문서 ----------
function fill(text: string) {
  const p = state.profile;
  return text
    .replaceAll('{name}', p.name)
    .replaceAll('{age}', String(ageOn(p.birthDate, TODAY)))
    .replaceAll('{grade}', p.grade)
    .replaceAll('{schoolClass}', p.schoolClass);
}

export async function getOutputDoc(id: string): Promise<OutputDoc | null> {
  await wait();
  return buildDoc(id);
}

function buildDoc(id: string): OutputDoc | null {
  const tpl = seed.outputTemplates.find((t) => t.id === id);
  if (!tpl) return null;
  const numbers = new Map<string, number>();
  const sources: OutputDoc['sources'] = [];
  const sections = tpl.sections
    .map((sec) => ({
      heading: fill(sec.heading),
      lines: sec.lines.flatMap((line) => {
        const found = line.refs.map(resolveSource);
        if (found.some((s) => s === null)) return [];
        return [{
          text: fill(line.text),
          refs: (found as Source[]).map((s) => {
            if (!numbers.has(s.id)) {
              numbers.set(s.id, numbers.size + 1);
              sources.push({ n: numbers.size, label: s.label, text: s.text, url: s.url });
            }
            return numbers.get(s.id)!;
          }),
        }];
      }),
    }))
    .filter((sec) => sec.lines.length > 0);
  const approval = [...state.approvals].reverse().find((a) => a.kind === '문서 공유' && a.docId === id);
  return {
    id, title: fill(tpl.title), sections, sources, extraLines: state.docExtras[id] ?? [],
    shareToken: approval?.status === '보냄' ? state.shares[id] ?? null : null,
    shareStatus: approval ? approval.status : '없음',
  };
}

export async function addDocLine(id: string, text: string): Promise<void> {
  await wait(150);
  const line = text.trim();
  if (!line) throw new Error('empty');
  state.docExtras[id] = [...(state.docExtras[id] ?? []), line];
  commit();
}

export async function getShared(token: string): Promise<OutputDoc | null> {
  await wait();
  const docId = Object.keys(state.shares).find((k) => state.shares[k] === token);
  if (!docId) return null;
  const doc = buildDoc(docId);
  return doc && doc.shareToken === token ? { ...doc, sources: [] } : null;
}

// ---------- 이력서 ----------
export async function getResume(): Promise<ResumeData> {
  await wait();
  const periodsOf = (list: Note[]) => {
    const groups = new Map<string, Note[]>();
    [...list].sort((a, b) => b.date.localeCompare(a.date)).forEach((note) => {
      const label = `${note.date.slice(0, 4)}년 ${Number(note.date.slice(5, 7)) <= 6 ? '상반기' : '하반기'}`;
      groups.set(label, [...(groups.get(label) ?? []), note]);
    });
    return [...groups].map(([label, notes]) => ({ label, notes }));
  };
  const tabs: ResumeTab[] = seed.organizations.map((o) => ({
    key: o.id, name: o.name, goals: seed.goals.filter((g) => g.orgId === o.id), periods: periodsOf(state.notes.filter((x) => x.orgId === o.id)),
  }));
  tabs.push({ key: 'home', name: '집에서', goals: [], periods: periodsOf(state.notes.filter((x) => x.orgId === null)) });
  return {
    tabs,
    firsts: state.notes.filter((x) => x.isFirst).sort((a, b) => b.date.localeCompare(a.date)),
    kinds: seed.documentKinds,
  };
}

// ---------- 프로필 ----------
function profileView(): ProfileView {
  return { ...state.profile, age: ageOn(state.profile.birthDate, TODAY), organizations: seed.organizations };
}

export async function getProfile(): Promise<ProfileView> {
  await wait();
  return structuredClone(profileView());
}

export async function saveProfile(p: Profile): Promise<ProfileView> {
  await wait(250);
  let saved = p;
  if (server.remote) {
    try {
      saved = await server.storeProfile(p);
      base = { ...base, profile: saved };
    } catch (err) {
      console.warn('[ieum] 프로필을 서버에 저장하지 못해 이 화면에만 반영해요', err);
    }
  }
  state.profile = structuredClone(saved);
  commit();
  return profileView();
}

// ---------- 넘기기 ----------
export async function getInbox(): Promise<InboxItem[]> {
  await wait();
  return structuredClone(state.inbox);
}

export async function submitInbox(input: { texts: string; fileNames: string[]; note: string }): Promise<{ runId: string; items: number; pending: number; firsts: number }> {
  await wait(300);
  const texts = input.texts.split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean);
  // 서버가 있으면 문자는 서버에 접수하고(해석은 결과 보기에서), 실패하면 이 화면에서만 접수한다.
  let accepted: { runId: string; items: { id: string; rawText: string }[] } | null = null;
  if (server.remote && texts.length) {
    try {
      accepted = await server.postInbox(texts);
    } catch (err) {
      console.warn('[ieum] 서버에 접수하지 못해 이 화면에서만 접수해요', err);
    }
  }
  const runId = accepted ? `srv-${accepted.runId}` : nextId('run');
  const items: InboxItem[] = [];
  const stamp = `${TODAY} 오늘`;
  const waiting = '접수했어요 · 결과 보기를 눌러 정리 결과를 확인해요';
  texts.forEach((text, i) => {
    const id = accepted ? `in-srv-${accepted.items[i].id}` : nextId('in');
    items.push({ id, kind: 'text', label: '붙여넣은 문자', rawText: text, receivedAt: stamp, result: waiting, runId, pending: true });
  });
  input.fileNames.forEach((name) => {
    const isImage = /\.(png|jpe?g|gif|webp|heic)$/i.test(name);
    items.push({ id: nextId('in'), kind: isImage ? 'photo' : 'file', label: name, rawText: name, receivedAt: stamp, result: waiting, runId, pending: true });
  });
  const pending = items.length;
  let firsts = 0;
  const note = input.note.trim();
  if (note) {
    const isFirst = note.includes('처음');
    const noteId = nextId('pn');
    state.notes.push({ id: noteId, orgId: null, date: TODAY, author: '부모', text: note, isFirst });
    if (isFirst) firsts = 1;
    items.push({ id: nextId('in'), kind: 'note', label: '부모 한마디', rawText: note, receivedAt: stamp, result: isFirst ? "'처음'이 들어 있어서 처음 해낸 날에 담았어요" : '부모 한마디로 기록했어요' });
  }
  state.inbox.unshift(...items);
  commit();
  return { runId, items: items.length, pending, firsts };
}

export async function getRun(runId: string): Promise<RunResult> {
  await wait(400);
  let processed = 0;
  if (runId.startsWith('srv-') && server.remote) {
    try {
      const run = await server.fetchRun(runId.slice(4));
      run.items.forEach((r) => {
        const item = state.inbox.find((i) => i.id === `in-srv-${r.id}`);
        if (item && item.pending) {
          item.pending = false;
          item.result = interpretedResult(r);
          processed += 1;
        }
      });
    } catch (err) {
      console.warn('[ieum] 서버에서 해석 결과를 가져오지 못했어요', err);
      throw err;
    }
  }
  state.inbox.forEach((item) => {
    if (item.runId === runId && item.pending) {
      item.pending = false;
      item.result = '정리했어요 · 이 샘플 앱은 시연 제어의 장면 입력만 일정·장부에 반영해요';
      processed += 1;
    }
  });
  if (processed) commit();
  return { runId, status: '완료', processed };
}

// ---------- 홈 ----------
function buildHome(): HomeData {
  const cards: HomeCard[] = state.cards.map((c) => {
    const ap = c.approvalId ? state.approvals.find((a) => a.id === c.approvalId) : undefined;
    return {
      id: c.id, tone: c.tone, title: c.title, body: c.body, refs: resolveAll(c.refIds), actionLabel: c.actionLabel, to: c.to,
      resolved: ap ? ap.status === '보냄' : false, dday: c.dueOn ? diffDays(c.dueOn, TODAY) : null,
    };
  });
  const counters: Counter[] = ([1, 2, 3] as SceneNo[]).filter((s) => state.scenes[s]).map((s) => {
    const m = seed.sceneMeta[s];
    return {
      scene: s, title: m.title, manualSteps: m.manualSteps, approvals: m.approvals,
      decided: state.approvals.filter((a) => a.scene === s && a.status === '보냄').length,
      direct: m.direct, directDone: s === 2 && state.directDone,
    };
  });
  const upcoming: SessionRow[] = [];
  for (let i = 1; i <= 21 && upcoming.length < 5; i++) {
    sessionsOn(addDays(TODAY, i)).filter((s) => s.status === '예정' || s.status === '보강 요청').forEach((s) => upcoming.push(s));
  }
  return {
    childName: state.profile.name,
    today: TODAY,
    cards: [...cards.filter((c) => !c.resolved), ...cards.filter((c) => c.resolved)],
    counters,
    totals: counters.reduce((t, c) => ({ manual: t.manual + c.manualSteps.length, approvals: t.approvals + c.approvals, direct: t.direct + c.direct }), { manual: 0, approvals: 0, direct: 0 }),
    upcoming: upcoming.slice(0, 5),
    scenesDone: counters.length,
  };
}

export async function getHome(): Promise<HomeData> {
  await wait();
  return buildHome();
}

// ---------- 시연 ----------
// interpreted: 서버가 문자 12개를 해석한 결과(문자 순서대로). 없으면 준비된 결과 문장을 쓴다.
function applyScene1(interpreted: server.Interpreted[] | null) {
  state.inbox.unshift(
    ...seed.scene1Messages.map((m, i) => ({
      id: m.id, kind: 'text' as const, label: `${orgName(m.orgId)} 문자`, rawText: m.text, receivedAt: `${TODAY} 밤`,
      result: interpreted?.[i] ? interpretedResult(interpreted[i]) : m.result,
    })),
    { id: seed.scene1Photo.id, kind: 'photo', label: seed.scene1Photo.label, rawText: seed.scene1Photo.rawText, receivedAt: `${TODAY} 밤`, result: seed.scene1Photo.result },
  );
  state.overrides.push(...structuredClone(seed.scene1Overrides));
  state.offers.push(...structuredClone(seed.scene1Offers));
  state.usage.push(...seed.scene1Usage.map((u) => ({ id: nextId('us'), ...u })));
  state.notes.push(...structuredClone(seed.scene1Notes));

  const v = voucherData();
  const name = state.profile.name;
  const created: CardState[] = [];
  const bad = v.usage.find((u) => u.match === '확인 필요');
  if (bad) {
    const ap = makeApproval({
      scene: 1, kind: '확인 요청', title: `${bad.orgName}에 이용 내역 확인 요청`, recipient: bad.orgName,
      draftText: `안녕하세요, ${name} 어머니입니다. ${shortDay(bad.date)} 수업이 결석 처리되었는데 같은 날 이용 내역 ${fmt(bad.amount)}원이 확인됩니다. 어떻게 처리된 것인지 확인 부탁드립니다.`,
      refIds: ['m4', 'ph-usage'], guide: seed.consultGuide,
    });
    state.approvals.push(ap);
    created.push({
      id: nextId('card'), tone: 'warning', title: `확인이 필요한 이용 내역이 ${v.usage.filter((u) => u.match === '확인 필요').length}건 있어요`,
      body: `${shortDay(bad.date)} ${bad.orgName}은 결석으로 처리됐는데 이용 내역 ${fmt(bad.amount)}원이 있어요.`,
      refIds: ['m4', 'ph-usage'], actionLabel: '센터에 보낼 문자 보기', to: '/approvals', approvalId: ap.id,
    });
  }
  const absent = state.overrides.find((o) => o.status === '결석');
  const offer = state.offers[0];
  if (v.expiring && v.expiring > 0 && offer && absent) {
    const ap = makeApproval({
      scene: 1, kind: '보강 요청', title: `${orgName('A')}에 보강 요청`, recipient: orgName('A'),
      draftText: `안녕하세요, ${name} 어머니입니다. ${shortDay(absent.date)} 결석분 보강을 ${shortDay(offer.date)} ${offer.start}에 받고 싶습니다. 이번 달 바우처 잔액 ${fmt(v.expiring)}원으로 가능한지 확인 부탁드립니다.`,
      refIds: ['m5', 'm6', 'ph-usage'], makeupId: offer.id,
    });
    state.approvals.push(ap);
    created.push({
      id: nextId('card'), tone: 'info', title: `이번 달 바우처 ${fmt(v.expiring)}원이 월말에 사라져요`,
      body: `남은 예정 회기를 모두 써도 ${fmt(v.expiring)}원이 남아요. ${shortDay(offer.date)} ${offer.start} 보강을 제안해요.`,
      refIds: ['m5', 'ph-usage'], actionLabel: '보강 요청 문자 보기', to: '/approvals', approvalId: ap.id,
    });
  }
  const changes = seed.scene1Overrides.filter((o) => o.changedFrom);
  if (changes.length) {
    created.push({
      id: nextId('card'), tone: 'success', title: `일정이 ${changes.length}건 바뀌었어요`,
      body: changes.map((o) => {
        const svc = seed.services.find((s) => s.id === o.serviceId)!;
        return `${shortDay(o.date)} ${orgName(svc.orgId)} ${o.changedFrom} → ${o.start}`;
      }).join(' · '),
      refIds: ['m1', 'm2', 'm3'], actionLabel: '시간표 보기', to: '/schedule',
    });
  }
  state.cards.unshift(...created);
}

function applyScene2() {
  state.collected = true;
  const hit = seed.programs.map(toProgramRow).find((p) => p.eligible === '해당' || p.eligible === '해당 가능');
  const program = hit ? seed.programs.find((p) => p.id === hit.id) : undefined;
  if (!hit || !program) return;
  state.application = { id: 'app1', programId: program.id, status: '준비' };
  state.deadlines.push({ id: 'dl-prog1', title: `${program.title} 신청 마감`, dueOn: program.deadline, kind: '신청', to: '/applications/app1' });
  const missing = checklistFor(program).filter((c) => c.status !== '있음').map((c) => c.docType);
  state.cards.unshift({
    id: nextId('card'), tone: 'info', title: '확인해 볼 지원이 1건 있어요',
    body: `${program.title} · 신청 마감 ${koDate(program.deadline)}.${missing.length ? ` 서류함에 없는 서류가 ${missing.length}건 있어요: ${missing.join(', ')}.` : ''}`,
    refIds: [`prog:${program.id}`], actionLabel: '신청 진행 보기', to: '/applications/app1', dueOn: program.deadline,
  });
}

function applyScene3() {
  const f = seed.iepNotice;
  state.inbox.unshift({
    id: f.photo.id, kind: 'photo', label: f.photo.label, rawText: f.photo.rawText, receivedAt: `${TODAY} 새 학기`,
    result: `IEP 협의 ${shortDay(f.meetingOn)} ${f.meetingTime}, 의견서 회신 마감 ${shortDay(f.replyDue)}을 마감에 넣었어요`,
  });
  state.deadlines.push(
    { id: 'dl-iep-meet', title: `IEP 협의회 (${f.place} ${f.meetingTime})`, dueOn: f.meetingOn, kind: 'IEP', to: '/outputs/iep' },
    { id: 'dl-iep-reply', title: 'IEP 학부모 의견서 제출', dueOn: f.replyDue, kind: 'IEP' },
  );
  const ap = makeApproval({
    scene: 3, kind: '문서 공유', title: `${state.profile.name}의 IEP 준비 한 장 공유`, recipient: '특수교사',
    draftText: `안녕하세요, ${state.profile.name} 어머니입니다. 협의 전에 참고하실 수 있도록 IEP 준비 한 장을 보내드립니다. 확인 부탁드립니다.`,
    refIds: ['ph-iep'], link: { label: '공유할 문서 보기', to: '/outputs/iep' }, docId: 'iep',
  });
  state.approvals.push(ap);
  state.cards.unshift(
    {
      id: nextId('card'), tone: 'info', title: `IEP 협의가 ${koDate(f.meetingOn)}에 잡혀 있어요`,
      body: `${f.meetingTime} ${f.place}. 학부모 의견서는 ${koDate(f.replyDue)}까지예요. 기록을 모아 IEP 준비 한 장을 만들어 뒀어요.`,
      refIds: ['ph-iep'], actionLabel: 'IEP 준비 한 장 보기', to: '/outputs/iep', dueOn: f.meetingOn,
    },
    {
      id: nextId('card'), tone: 'warning', title: '특수교사에게 보낼 문서를 확인해 주세요',
      body: '승인하면 읽기 전용 페이지로 공유돼요.', refIds: ['ph-iep'], actionLabel: '승인함 보기', to: '/approvals', approvalId: ap.id,
    },
  );
}

export async function runScene(n: SceneNo): Promise<HomeData> {
  await wait(500);
  if (!state.scenes[n]) {
    if (n === 1) applyScene1(await interpretOnServer(seed.scene1Messages.map((m) => m.text)));
    if (n === 2) applyScene2();
    if (n === 3) applyScene3();
    state.scenes[n] = true;
    commit();
  }
  return buildHome();
}

export async function resetDemo(): Promise<void> {
  await wait(300);
  state = initialState();
  commit();
}

export async function getDemo(): Promise<DemoData> {
  await wait(100);
  return {
    scenes: ([1, 2, 3] as SceneNo[]).map((s) => ({ scene: s, title: seed.sceneMeta[s].title, inputs: seed.sceneMeta[s].inputs, done: state.scenes[s] })),
  };
}
