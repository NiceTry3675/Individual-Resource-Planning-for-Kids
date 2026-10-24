import { useState } from 'react';
import { daysInMonth, weekdayIndex, WEEKDAYS } from '../../api/dates';
import type { DeadlineRow } from '../../api/types';
import { monthLabel } from '../common/format';

const dotCls: Record<DeadlineRow['kind'], string> = { '서류': 'bg-fx-warning', 'IEP': 'bg-fx-data-4', '신청': 'bg-fx-primary' };
const pad = (n: number) => String(n).padStart(2, '0');

export function MonthCalendar({ today, deadlines }: { today: string; deadlines: DeadlineRow[] }) {
  const [ym, setYm] = useState(today.slice(0, 7));
  const [y, m] = ym.split('-').map(Number);
  const cells: (number | null)[] = [
    ...Array.from({ length: weekdayIndex(`${ym}-01`) }, () => null),
    ...Array.from({ length: daysInMonth(ym) }, (_, i) => i + 1),
  ];
  const shift = (d: number) => {
    const t = new Date(Date.UTC(y, m - 1 + d, 1));
    setYm(`${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}`);
  };
  const btn = 'flex h-12 w-12 items-center justify-center rounded-full text-fx-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-fx-text';

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button type="button" onClick={() => shift(-1)} aria-label="이전 달" className={btn}>‹</button>
        <p className="font-bold text-fx-text" aria-live="polite">{monthLabel(ym)}</p>
        <button type="button" onClick={() => shift(1)} aria-label="다음 달" className={btn}>›</button>
      </div>
      <ul className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-fx-text-muted">
        {WEEKDAYS.map((w) => <li key={w}>{w}</li>)}
      </ul>
      <ul className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <li key={`e${i}`} />;
          const iso = `${ym}-${pad(day)}`;
          const items = deadlines.filter((d) => d.dueOn === iso);
          return (
            <li
              key={iso}
              aria-label={items.length ? `${day}일 ${items.map((d) => d.title).join(', ')}` : undefined}
              className={`flex min-h-12 flex-col items-center justify-start rounded-xl py-1 text-sm tabular-nums ${iso === today ? 'border border-fx-primary text-fx-text' : 'text-fx-text-muted'} ${items.length ? 'bg-fx-background font-bold text-fx-text' : ''}`}
            >
              {day}
              <span className="mt-1 flex gap-0.5">
                {items.map((d) => <span key={d.id} className={`h-1.5 w-1.5 rounded-full ${dotCls[d.kind]}`} />)}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 flex flex-wrap gap-3 text-xs text-fx-text-muted">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-fx-warning" />서류</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-fx-data-4" />IEP</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-fx-primary" />신청</span>
      </p>
    </div>
  );
}
