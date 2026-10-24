import type { VercelRequest, VercelResponse } from '@vercel/node';
import { checkApiKey, handlePreflight, sendError } from '../lib/http';
import { query, sql } from '../lib/db';
import { currentChildId, gradeLabel, gradeNumber } from '../lib/family';

interface ChildRow {
  name: string;
  birth_date: string;
  grade: number | null;
  school_class: string | null;
  disability_type: string | null;
  region: string | null;
  income_bracket: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_email: string | null;
}

async function readProfile(childId: number) {
  const [c] = await query<ChildRow>(
    `SELECT name, CONVERT(char(10), birth_date, 23) AS birth_date, grade, school_class, disability_type, region,
            income_bracket, guardian_name, guardian_phone, guardian_email
       FROM dbo.child WHERE id = @childId`,
    { childId: { type: sql.Int, value: childId } },
  );
  return {
    name: c.name,
    birthDate: c.birth_date,
    grade: gradeLabel(c.grade),
    schoolClass: c.school_class ?? '',
    disability: c.disability_type ?? '',
    region: c.region ?? '',
    incomeBracket: c.income_bracket ?? '',
    caregiver: { name: c.guardian_name ?? '', role: '주양육자', phone: c.guardian_phone ?? '', email: c.guardian_email ?? '' },
  };
}

// GET /profile → 아이 프로필, POST /profile → 고친 프로필을 저장하고 다시 돌려준다.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handlePreflight(req, res)) return;
  if (!checkApiKey(req, res)) return;
  try {
    const childId = await currentChildId();
    if (req.method === 'GET') return res.status(200).json(await readProfile(childId));
    if (req.method !== 'POST') return sendError(res, 405, 'method not allowed');

    const p = req.body ?? {};
    const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
    if (!text(p.name, 50) || !/^\d{4}-\d{2}-\d{2}$/.test(text(p.birthDate, 10))) {
      return sendError(res, 400, 'name and birthDate (YYYY-MM-DD) are required');
    }
    await query(
      `UPDATE dbo.child SET name = @name, birth_date = @birthDate, grade = @grade, school_class = @schoolClass,
              disability_type = @disability, region = @region, income_bracket = @income,
              guardian_name = @guardianName, guardian_phone = @guardianPhone, guardian_email = @guardianEmail
        WHERE id = @childId`,
      {
        childId: { type: sql.Int, value: childId },
        name: { type: sql.NVarChar(50), value: text(p.name, 50) },
        birthDate: { type: sql.Date, value: text(p.birthDate, 10) },
        grade: { type: sql.TinyInt, value: gradeNumber(text(p.grade, 20)) },
        schoolClass: { type: sql.NVarChar(50), value: text(p.schoolClass, 50) || null },
        disability: { type: sql.NVarChar(50), value: text(p.disability, 50) || null },
        region: { type: sql.NVarChar(50), value: text(p.region, 50) || null },
        income: { type: sql.NVarChar(50), value: text(p.incomeBracket, 50) || null },
        guardianName: { type: sql.NVarChar(50), value: text(p.caregiver?.name, 50) || null },
        guardianPhone: { type: sql.NVarChar(20), value: text(p.caregiver?.phone, 20) || null },
        guardianEmail: { type: sql.NVarChar(200), value: text(p.caregiver?.email, 200) || null },
      },
    );
    res.status(200).json(await readProfile(childId));
  } catch (err) {
    console.error('[profile]', err);
    sendError(res, 503, 'database unavailable, try again');
  }
}
