import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkApiKey, handlePreflight, sendError } from '../lib/http';
import { query, sql } from '../lib/db';
import { currentChildId } from '../lib/family';

// GET /documents → 서류함(화면의 DocumentRow에서 계산 값을 뺀 형태).
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (req.method !== 'GET') return sendError(res, 405, 'method not allowed');
  if (!checkApiKey(req, res)) return;
  try {
    const rows = await query(
      `SELECT CONCAT('doc-db-', id) AS id, doc_type AS docType,
              CONVERT(char(10), issued_on, 23) AS issuedOn,
              CONVERT(char(10), valid_until, 23) AS validUntil,
              COALESCE(file_ref, doc_type) AS fileName
         FROM dbo.document WHERE child_id = @childId ORDER BY issued_on DESC`,
      { childId: { type: sql.Int, value: await currentChildId() } },
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error('[documents]', err);
    sendError(res, 503, 'database unavailable, try again');
  }
}
