import { useState } from 'react';
import { getSchedule } from '../api/ieum';
import { monthDay, WEEKDAYS, weekdayIndex } from '../api/dates';
import { Card } from '../components/common/Card';
import { Icon } from '../components/common/Icon';
import { orgColor } from '../components/common/orgColor';
import { PageTitle } from '../components/common/PageTitle';
import { AsyncView } from '../components/common/States';
import { circleBtn } from '../components/common/ui';
import { useAsync } from '../components/common/useAsync';
import { SessionItem } from '../components/schedule/SessionItem';

const legend = [
  { id: 'A' as const, name: 'A 언어센터' },
  { id: 'B' as const, name: 'B 감각통합센터' },
  { id: 'C' as const, name: 'C 놀이치료실' },
];

export default function SchedulePage() {
  const [week, setWeek] = useState<string | undefined>(undefined);
  const { state, retry } = useAsync(() => getSchedule(week), [week]);

  return (
    <div className="space-y-6">
      <PageTitle title="시간표" back backTo="/more" />
      <ul className="flex flex-wrap gap-3 px-1 text-sm text-fx-text-muted">
        {legend.map((l) => (
          <li key={l.id} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded-full ${orgColor[l.id].dot}`} />
            {l.name}
          </li>
        ))}
      </ul>
      <AsyncView state={state} retry={retry}>
        {(w) => (
          <>
            <div className="flex items-center justify-between gap-2">
              <button type="button" disabled={!w.prevWeek} onClick={() => setWeek(w.prevWeek ?? undefined)} className={circleBtn} aria-label="이전 주">
                <Icon name="back" className="h-5 w-5" />
              </button>
              <p className="text-center text-lg font-bold tabular-nums text-fx-text" aria-live="polite">
                {monthDay(w.weekStart)} – {monthDay(w.weekEnd)}
                {w.isThisWeek && <span className="ml-2 text-sm text-fx-primary">이번 주</span>}
              </p>
              <button type="button" disabled={!w.nextWeek} onClick={() => setWeek(w.nextWeek ?? undefined)} className={circleBtn} aria-label="다음 주">
                <Icon name="next" className="h-5 w-5" />
              </button>
            </div>
            <ul className="space-y-3">
              {w.days.map((d) => (
                <li key={d.date}>
                  <Card className={`space-y-2 ${d.date === w.today ? 'ring-2 ring-fx-primary' : ''}`}>
                    <h2 className="text-base font-bold tabular-nums text-fx-text">
                      {WEEKDAYS[weekdayIndex(d.date)]} {monthDay(d.date)}
                      {d.date === w.today && <span className="ml-2 text-sm text-fx-primary">오늘</span>}
                    </h2>
                    {d.sessions.length === 0 ? (
                      <p className="text-sm text-fx-text-muted">수업이 없어요</p>
                    ) : (
                      <ul className="space-y-2">
                        {d.sessions.map((s) => <SessionItem key={s.id} session={s} />)}
                      </ul>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          </>
        )}
      </AsyncView>
    </div>
  );
}
