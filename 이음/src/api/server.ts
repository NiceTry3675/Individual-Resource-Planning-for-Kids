// 에이전트 서버 호출. 서버 주소가 없으면 remote가 false이고, ieum.ts는 목업으로만 돈다.
// 서버 호출이 실패해도 시연이 멈추지 않도록, 부르는 쪽에서 목업 결과로 돌아간다.
import type { Profile } from './types';

const BASE = import.meta.env.VITE_IEUM_API_BASE?.replace(/\/$/, '') ?? '';
const KEY = import.meta.env.VITE_IEUM_API_KEY ?? '';

export const remote = BASE !== '' && KEY !== '';

async function call<T>(path: string, init: RequestInit = {}, timeoutMs = 15_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { 'X-Api-Key': KEY, ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
    });
    if (!res.ok) throw new Error(`${path} HTTP ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export interface ServerDocument {
  id: string;
  docType: string;
  issuedOn: string;
  validUntil: string | null;
  fileName: string;
}

/** 서버가 문자 하나를 해석한 결과(MVP 스펙 '해석 결과 형식') */
export interface Interpreted {
  id: string;
  rawText: string;
  type: string | null;
  organization: string | null;
  date: string | null;
  time: string | null;
  amount: number | null;
  quote: string | null;
  confidence: number | null;
  source: 'llm' | 'fallback' | null;
}

export interface ServerRun {
  runId: string;
  status: string;
  interpreter: 'openai' | 'fallback' | null;
  model: string | null;
  items: Interpreted[];
}

export const fetchProfile = () => call<Profile>('/profile');
export const storeProfile = (p: Profile) => call<Profile>('/profile', { method: 'POST', body: JSON.stringify(p) });
export const fetchDocuments = () => call<ServerDocument[]>('/documents');
export const postInbox = (texts: string[]) =>
  call<{ runId: string; items: { id: string; rawText: string }[] }>('/inbox', { method: 'POST', body: JSON.stringify({ texts }) });
// 해석은 LLM을 부르므로 오래 걸릴 수 있다(서버는 25초 뒤 규칙 기반 대체 결과로 넘어간다).
export const fetchRun = (runId: string) => call<ServerRun>(`/runs/${runId}`, {}, 45_000);
