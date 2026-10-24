import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handlePreflight } from '../lib/http';

// DB를 건드리지 않는다. 헬스 체크가 DB를 깨우면 자동 일시 정지가 안 돼 무료 한도를 쓴다.
export default function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  res.status(200).json({ ok: true });
}
