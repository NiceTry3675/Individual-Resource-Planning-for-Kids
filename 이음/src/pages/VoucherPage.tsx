import { getVoucher } from '../api/ieum';
import { monthDay, shortDay } from '../api/dates';
import { Badge, type BadgeTone } from '../components/common/Badge';
import { BarChart } from '../components/common/BarChart';
import { Card } from '../components/common/Card';
import { fmtWon, monthLabel } from '../components/common/format';
import { PageTitle } from '../components/common/PageTitle';
import { SectionTitle } from '../components/common/SectionTitle';
import { AsyncView, EmptyState } from '../components/common/States';
import { useAsync } from '../components/common/useAsync';

const matchTone: Record<'일치' | '확인 필요' | '미확인', BadgeTone> = { '일치': 'success', '확인 필요': 'warning', '미확인': 'muted' };

const won = new Intl.NumberFormat('ko-KR');
const compact = new Intl.NumberFormat('ko-KR', { notation: 'compact' });

export default function VoucherPage() {
  const { state, retry } = useAsync(() => getVoucher());

  return (
    <div className="space-y-6">
      <PageTitle title="바우처 장부" back backTo="/more" />
      <AsyncView state={state} retry={retry}>
        {(v) => {
          const usedPct = Math.min(100, (v.used / v.limit) * 100);
          const plannedPct = Math.min(100 - usedPct, (v.planned / v.limit) * 100);
          const rows = [
            { label: '한도', value: fmtWon(v.limit), dot: '', warn: false },
            { label: '사용', value: fmtWon(v.used), dot: 'bg-fx-secondary', warn: false },
            { label: '월말까지 예정', value: fmtWon(v.planned), dot: 'bg-fx-data-4', warn: false },
            { label: '월말 소멸 예정', value: v.expiring === null ? '–' : fmtWon(v.expiring), dot: '', warn: Boolean(v.expiring) },
          ];
          return (
            <>
              <section className="space-y-1 px-1" aria-label="남은 금액">
                <p className="text-xs font-semibold tracking-wide text-fx-text-muted">남은 금액</p>
                <p className="text-4xl font-bold tabular-nums text-fx-text">
                  {won.format(v.remaining)}
                  <span className="ml-1.5 text-lg font-semibold text-fx-text-muted">원</span>
                </p>
                <p className="text-base text-fx-text-muted">{monthLabel(v.month)} · {v.programName}</p>
              </section>

              {v.usage.length > 0 && (
                <BarChart
                  caption="이용 내역 금액 막대 그래프"
                  format={(n) => compact.format(n)}
                  bars={v.usage.map((u) => ({ label: monthDay(u.date), value: u.amount, flag: u.match === '확인 필요' }))}
                />
              )}

              <Card className="space-y-4">
                <div className="flex h-3 overflow-hidden rounded-full bg-fx-background" role="img" aria-label={`한도의 ${Math.round(usedPct)}% 사용, ${Math.round(plannedPct)}% 예정`}>
                  <div className="bg-fx-secondary" style={{ width: `${usedPct}%` }} />
                  <div className="bg-fx-data-4" style={{ width: `${plannedPct}%` }} />
                </div>
                <dl className="divide-y divide-fx-border">
                  {rows.map((r) => (
                    <div key={r.label} className="flex items-center justify-between gap-3 py-3">
                      <dt className="flex items-center gap-2 text-base text-fx-text-muted">
                        {r.dot && <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${r.dot}`} />}
                        {r.label}
                      </dt>
                      <dd className={`text-base font-bold tabular-nums ${r.warn ? 'text-fx-warning' : 'text-fx-text'}`}>{r.value}</dd>
                    </div>
                  ))}
                </dl>
                {v.expiring === null && <p className="text-sm text-fx-text-muted">이용 내역을 넘기면 소멸 예정액을 계산해요.</p>}
              </Card>

              <section aria-labelledby="overlap" className="space-y-3">
                <SectionTitle id="overlap">교육청 지원과 겹치는지</SectionTitle>
                <Card className={v.overlap.warning ? 'ring-2 ring-fx-warning' : ''}>
                  <p className="text-base text-fx-text">{v.overlap.text}</p>
                </Card>
              </section>

              <section aria-labelledby="usage-list" className="space-y-3">
                <SectionTitle id="usage-list">이용 내역과 출석 대조</SectionTitle>
                {v.usage.length === 0 ? (
                  <EmptyState title="이용 내역이 아직 없어요" description="이용 내역 캡처를 넘기면 출석과 맞춰 볼게요." actionLabel="넘기기" to="/inbox" />
                ) : (
                  <ul className="space-y-2">
                    {v.usage.map((u) => (
                      <li key={u.id}>
                        <Card className="flex items-start justify-between gap-3 py-4">
                          <div className="min-w-0">
                            <p className="font-semibold text-fx-text">{u.orgName}</p>
                            <p className="text-sm tabular-nums text-fx-text-muted">{shortDay(u.date)} · {fmtWon(u.amount)}</p>
                            {u.reason && <p className="mt-1 text-sm text-fx-warning">확인이 필요한 이용 내역이에요. {u.reason}.</p>}
                          </div>
                          <Badge tone={matchTone[u.match]}>{u.match}</Badge>
                        </Card>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          );
        }}
      </AsyncView>
    </div>
  );
}
