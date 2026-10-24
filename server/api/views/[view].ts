import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkApiKey, handlePreflight, sendError } from '../../lib/http';
import { query, sql, type Param } from '../../lib/db';
import { VIEWS } from '../../lib/views';

// GET /views/{뷰}?조건=값 → 뷰의 행을 평평한 객체 배열로 돌려준다(MVP 스펙 'API').
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== 'GET') return sendError(res, 405, 'method not allowed');
  if (!checkApiKey(req, res)) return;

  const name = String(req.query.view);
  const spec = VIEWS[name];
  if (!spec) return sendError(res, 404, `unknown view: ${name}`);

  const conditions: string[] = [];
  const params: Record<string, Param> = {};
  for (const [key, raw] of Object.entries(req.query)) {
    if (key === 'view') continue;
    const type = spec.filters[key];
    if (!type) return sendError(res, 400, `unknown filter for ${name}: ${key}`);
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (type === 'int') {
      if (!/^\d+$/.test(value)) return sendError(res, 400, `${key} must be an integer`);
      params[key] = { type: sql.Int, value: Number(value) };
    } else {
      params[key] = { type: sql.NVarChar(200), value };
    }
    conditions.push(`[${key}] = @${key}`);
  }

  const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
  try {
    const rows = await query(`SELECT * FROM dbo.${name}${where} ORDER BY ${spec.orderBy}`, params);
    res.status(200).json(rows);
  } catch (err) {
    console.error('[views]', name, err);
    sendError(res, 503, 'database unavailable, try again');
  }
}
