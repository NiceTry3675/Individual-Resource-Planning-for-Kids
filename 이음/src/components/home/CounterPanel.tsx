import type { Counter, Totals } from '../../api/types';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';

export function CounterPanel({ counters, totals }: { counters: Counter[]; totals: Totals }) {
  return (
    <Card className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-fx-text-muted">손 작업 카운터</p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-fx-text">
          손 작업 {totals.manual}단계 → 승인 {totals.approvals}번
        </p>
        {totals.direct > 0 && <p className="mt-1 text-sm text-fx-text-muted">직접 하는 일 {totals.direct}번이 더 있어요</p>}
      </div>
      <ul className="space-y-3">
        {counters.map((c) => (
          <li key={c.scene}>
            <details className="rounded-2xl border border-fx-border bg-fx-background p-3">
              <summary className="cursor-pointer text-sm font-semibold text-fx-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-fx-text">
                장면 {c.scene} · {c.title}
                <span className="ml-2 inline-flex flex-wrap gap-1.5 align-middle">
                  <Badge tone="info">{c.manualSteps.length}단계 → 승인 {c.approvals}번</Badge>
                  <Badge tone={c.decided === c.approvals ? 'success' : 'warning'}>승인 {c.decided}/{c.approvals}</Badge>
                  {c.direct > 0 && <Badge tone={c.directDone ? 'success' : 'warning'}>직접 {c.directDone ? '완료' : `${c.direct}번 남음`}</Badge>}
                </span>
              </summary>
              <p className="mt-3 text-xs font-semibold text-fx-text-muted">손으로 하던 일</p>
              <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-fx-text">
                {c.manualSteps.map((s) => <li key={s}>{s}</li>)}
              </ol>
            </details>
          </li>
        ))}
      </ul>
    </Card>
  );
}
