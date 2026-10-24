import { timingSafeEqual } from 'crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// 호출은 사용자 기기의 브라우저에서 오므로 IP가 아니라 Origin과 서버 키로 받는다(연동 계획 '보안').
const allowedOrigins = (process.env.CORS_ORIGINS ?? 'https://scenario.flextudio.com')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function applyCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  res.setHeader('Vary', 'Origin');
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Api-Key, Content-Type');
    res.setHeader('Access-Control-Max-Age', '600');
  }
}

/** CORS 헤더를 붙이고, OPTIONS 사전 요청이면 키 검사 없이 응답을 끝낸다. */
export function handlePreflight(req: VercelRequest, res: VercelResponse): boolean {
  applyCors(req, res);
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

/** X-Api-Key가 IEUM_API_KEY와 같은지 본다. 틀리면 401을 보내고 false. */
export function checkApiKey(req: VercelRequest, res: VercelResponse): boolean {
  const expected = process.env.IEUM_API_KEY;
  const received = req.headers['x-api-key'];
  if (!expected || typeof received !== 'string' || !sameText(received, expected)) {
    sendError(res, 401, 'invalid api key');
    return false;
  }
  return true;
}

export function sendError(res: VercelResponse, status: number, message: string) {
  res.status(status).json({ error: message });
}

function sameText(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
