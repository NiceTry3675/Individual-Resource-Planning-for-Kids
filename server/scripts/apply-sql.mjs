// sql/ 아래 파일을 순서대로 Azure SQL에 적용한다. 'GO' 줄로 배치를 나눈다.
// 사용: DB_SERVER=... DB_NAME=... DB_USER=ieumadmin DB_PASSWORD=... node scripts/apply-sql.mjs [파일 ...]
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import sql from 'mssql';

const sqlDir = new URL('../sql/', import.meta.url).pathname;
const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(sqlDir).filter((f) => f.endsWith('.sql')).sort().map((f) => join(sqlDir, f));

const pool = await new sql.ConnectionPool({
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: { encrypt: true },
  connectionTimeout: 60_000,
  requestTimeout: 60_000,
}).connect();

try {
  for (const file of files) {
    const batches = readFileSync(file, 'utf8')
      .split(/^\s*GO\s*$/im)
      .map((batch) => batch.trim())
      .filter(Boolean);
    for (const batch of batches) await pool.request().batch(batch);
    console.log(`applied ${file} (${batches.length} batch)`);
  }
} finally {
  await pool.close();
}
