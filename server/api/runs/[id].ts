import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkApiKey, handlePreflight, sendError } from '../../lib/http';
import { query, sql } from '../../lib/db';
import { currentChildId, organizationNames } from '../../lib/family';
import { interpretTexts } from '../../lib/interpret';

// 시연 날짜는 2026-10-24로 고정한다(MVP 스펙 '장면별 요구사항').
const TODAY = process.env.DEMO_TODAY ?? '2026-10-24';

interface ItemRow {
  id: number;
  raw_text: string;
  processed: boolean;
  event_type: string | null;
  org_name: string | null;
  occurs_on: string | null;
  amount: number | null;
  quote: string | null;
  confidence: number | null;
}

const readItems = (ids: number[]) =>
  query<ItemRow>(
    `SELECT i.id, i.raw_text, i.processed, i.event_type, o.name AS org_name,
            CONVERT(char(10), i.occurs_on, 23) AS occurs_on, i.amount, i.quote, i.confidence
       FROM dbo.inbox_item i LEFT JOIN dbo.organization o ON o.id = i.organization_id
      WHERE i.id IN (SELECT TRY_CAST(value AS int) FROM STRING_SPLIT(@ids, ','))
      ORDER BY i.id`,
    { ids: { type: sql.NVarChar(400), value: ids.join(',') } },
  );

// GET /runs/{id} → 아직 해석 전이면 LLM으로 해석해 inbox_item에 반영하고, 결과를 돌려준다.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== 'GET') return sendError(res, 405, 'method not allowed');
  if (!checkApiKey(req, res)) return;

  const runId = String(req.query.id);
  if (!/^\d+$/.test(runId)) return sendError(res, 400, 'run id must be an integer');

  try {
    const [run] = await query<{ input_ids: string; status: string; steps: string | null }>(
      `SELECT input_ids, status, steps FROM dbo.agent_run WHERE id = @id AND [trigger] = N'inbox'`,
      { id: { type: sql.Int, value: Number(runId) } },
    );
    if (!run) return sendError(res, 404, 'run not found');
    const ids = run.input_ids.split(',').map(Number);

    let steps = run.steps ? JSON.parse(run.steps) : null;
    if (run.status !== '완료') {
      const items = await readItems(ids);
      const orgs = await organizationNames(await currentChildId());
      const result = await interpretTexts(items.map((i) => i.raw_text), { today: TODAY, organizations: orgs.map((o) => o.name) });
      for (const [i, item] of items.entries()) {
        const r = result.items[i];
        await query(
          `UPDATE dbo.inbox_item SET processed = 1, event_type = @type, organization_id = @orgId, occurs_on = @date,
                  amount = @amount, quote = @quote, confidence = @confidence
            WHERE id = @id`,
          {
            id: { type: sql.Int, value: item.id },
            type: { type: sql.NVarChar(10), value: r.type },
            orgId: { type: sql.Int, value: orgs.find((o) => o.name === r.organization)?.id ?? null },
            date: { type: sql.Date, value: r.date },
            amount: { type: sql.Int, value: r.amount },
            quote: { type: sql.NVarChar(sql.MAX), value: r.quote },
            confidence: { type: sql.Decimal(4, 3), value: r.confidence },
          },
        );
      }
      steps = {
        interpreter: result.interpreter,
        model: result.model,
        ms: result.ms,
        error: result.error,
        times: result.items.map((r) => r.time),
        sources: result.items.map((r) => r.source),
      };
      await query(
        `UPDATE dbo.agent_run SET status = N'완료', steps = @steps, finished_at = SYSDATETIME() WHERE id = @id`,
        { id: { type: sql.Int, value: Number(runId) }, steps: { type: sql.NVarChar(sql.MAX), value: JSON.stringify(steps) } },
      );
    }

    const items = await readItems(ids);
    res.status(200).json({
      runId,
      status: '완료',
      interpreter: steps?.interpreter ?? null,
      model: steps?.model ?? null,
      ms: steps?.ms ?? null,
      items: items.map((i, n) => ({
        id: String(i.id),
        rawText: i.raw_text,
        type: i.event_type,
        organization: i.org_name,
        date: i.occurs_on,
        time: steps?.times?.[n] ?? null,
        amount: i.amount,
        quote: i.quote,
        confidence: i.confidence === null ? null : Number(i.confidence),
        source: steps?.sources?.[n] ?? null,
      })),
    });
  } catch (err) {
    console.error('[runs]', err);
    sendError(res, 503, 'database unavailable, try again');
  }
}
