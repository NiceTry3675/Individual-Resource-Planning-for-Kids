import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkApiKey, handlePreflight, sendError } from '../lib/http';
import { query, sql } from '../lib/db';
import { currentChildId } from '../lib/family';

const MAX_TEXTS = 20;
const MAX_LENGTH = 1000;

// POST /inbox {texts: string[]} → 문자를 inbox_item에 저장하고 run id를 돌려준다.
// 해석은 '결과 보기'가 부르는 GET /runs/{id}에서 한다(MVP 스펙 '처리 순서' 1단계).
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== 'POST') return sendError(res, 405, 'method not allowed');
  if (!checkApiKey(req, res)) return;

  const texts: string[] = Array.isArray(req.body?.texts)
    ? req.body.texts.filter((t: unknown): t is string => typeof t === 'string' && t.trim() !== '').map((t: string) => t.trim())
    : [];
  if (!texts.length) return sendError(res, 400, 'texts must be a non-empty array of strings');
  if (texts.length > MAX_TEXTS || texts.some((t) => t.length > MAX_LENGTH)) {
    return sendError(res, 413, `up to ${MAX_TEXTS} texts, ${MAX_LENGTH} characters each`);
  }

  try {
    const childId = await currentChildId();
    const ids: number[] = [];
    for (const text of texts) {
      const [row] = await query<{ id: number }>(
        `INSERT dbo.inbox_item (child_id, kind, raw_text) OUTPUT INSERTED.id VALUES (@childId, N'text', @text)`,
        { childId: { type: sql.Int, value: childId }, text: { type: sql.NVarChar(sql.MAX), value: text } },
      );
      ids.push(row.id);
    }
    const [run] = await query<{ id: number }>(
      `INSERT dbo.agent_run ([trigger], input_ids, status) OUTPUT INSERTED.id VALUES (N'inbox', @ids, N'접수')`,
      { ids: { type: sql.NVarChar(400), value: ids.join(',') } },
    );
    res.status(200).json({ runId: String(run.id), items: ids.map((id, i) => ({ id: String(id), rawText: texts[i] })) });
  } catch (err) {
    console.error('[inbox]', err);
    sendError(res, 503, 'database unavailable, try again');
  }
}
