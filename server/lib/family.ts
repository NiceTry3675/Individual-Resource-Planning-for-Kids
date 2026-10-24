import { query, sql } from './db';

// 시연은 한 가정(지우)만 다룬다. 로그인과 여러 가정은 이번 범위가 아니다(MVP 스펙 '목표와 범위').
export async function currentChildId(): Promise<number> {
  const rows = await query<{ id: number }>('SELECT TOP 1 id FROM dbo.child ORDER BY id');
  if (!rows.length) throw new Error('no child row; apply sql/003_seed.sql');
  return rows[0].id;
}

export async function organizationNames(childId: number): Promise<{ id: number; name: string }[]> {
  return query('SELECT id, name FROM dbo.organization WHERE child_id = @childId ORDER BY id', {
    childId: { type: sql.Int, value: childId },
  });
}

// 화면은 학년을 '초등 1학년' 같은 글자로 다루고, DB는 숫자로 둔다(0 미취학, 1~6 초등, 8 중학생, 11 고등학생).
export function gradeLabel(grade: number | null): string {
  if (grade === null) return '';
  if (grade === 0) return '미취학';
  if (grade >= 1 && grade <= 6) return `초등 ${grade}학년`;
  if (grade >= 7 && grade <= 9) return '중학생';
  return '고등학생';
}

export function gradeNumber(label: string): number | null {
  if (label === '미취학') return 0;
  const m = label.match(/^초등 (\d)학년$/);
  if (m) return Number(m[1]);
  if (label === '중학생') return 8;
  if (label === '고등학생') return 11;
  return null;
}
