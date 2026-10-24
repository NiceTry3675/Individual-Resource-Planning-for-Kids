import sql from 'mssql';

const config: sql.config = {
  server: process.env.DB_SERVER ?? '',
  database: process.env.DB_NAME ?? '',
  user: process.env.DB_USER ?? '',
  password: process.env.DB_PASSWORD ?? '',
  options: { encrypt: true },
  // 유휴 연결을 남기면 서버리스 DB가 자동 일시 정지하지 못해 무료 한도를 다 쓴다. 최소 0개, 30초 뒤 닫는다.
  pool: { max: 5, min: 0, idleTimeoutMillis: 30_000 },
  connectionTimeout: 15_000,
  requestTimeout: 15_000,
};

let poolPromise: Promise<sql.ConnectionPool> | null = null;

function getPool(): Promise<sql.ConnectionPool> {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config).connect().catch((err) => {
      poolPromise = null;
      throw err;
    });
  }
  return poolPromise;
}

// 일시 정지된 DB가 깨어나는 동안 나는 오류(40613 등)와 연결 오류는 다시 시도한다.
const RETRYABLE_NUMBERS = new Set([40613, 40501, 40197, 49918, 49919, 49920, 4060]);
const RETRYABLE_CODES = new Set(['ETIMEOUT', 'ESOCKET', 'ECONNCLOSED', 'ECONNRESET']);

function isRetryable(err: unknown): boolean {
  const e = err as { number?: number; code?: string; originalError?: { number?: number; code?: string } };
  const number = e.number ?? e.originalError?.number;
  const code = e.code ?? e.originalError?.code;
  return (number !== undefined && RETRYABLE_NUMBERS.has(number)) || (code !== undefined && RETRYABLE_CODES.has(code));
}

export type Param = { type: sql.ISqlType | (() => sql.ISqlType); value: unknown };

export async function query<T = Record<string, unknown>>(text: string, params: Record<string, Param> = {}): Promise<T[]> {
  const maxAttempts = 3;
  for (let attempt = 1; ; attempt++) {
    try {
      const request = (await getPool()).request();
      for (const [name, param] of Object.entries(params)) {
        request.input(name, param.type, param.value);
      }
      const result = await request.query<T>(text);
      return result.recordset;
    } catch (err) {
      if (attempt >= maxAttempts || !isRetryable(err)) throw err;
      poolPromise = null;
      await new Promise((resolve) => setTimeout(resolve, attempt * 3_000));
    }
  }
}

export { sql };
