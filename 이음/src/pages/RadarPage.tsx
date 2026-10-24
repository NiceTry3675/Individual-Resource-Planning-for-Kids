import { getRadar } from '../api/ieum';
import { koDate } from '../api/dates';
import { Badge, type BadgeTone } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { ddayLabel } from '../components/common/format';
import { PageTitle } from '../components/common/PageTitle';
import { SectionTitle } from '../components/common/SectionTitle';
import { AsyncView, EmptyState } from '../components/common/States';
import { cardCls, linkCls } from '../components/common/ui';
import { useAsync } from '../components/common/useAsync';
import { MonthCalendar } from '../components/radar/MonthCalendar';
import { ProgramCard } from '../components/radar/ProgramCard';
import { Link } from 'react-router-dom';

const kindTone: Record<'서류' | 'IEP' | '신청', BadgeTone> = { '서류': 'warning', 'IEP': 'info', '신청': 'primary' };

export default function RadarPage() {
  const { state, retry } = useAsync(() => getRadar());

  return (
    <div className="space-y-6">
      <PageTitle title="지원 레이더" back backTo="/more" description="시연용 가상 공고예요" />
      <AsyncView state={state} retry={retry}>
        {(r) => {
          const fit = r.programs.filter((p) => p.eligible !== '비해당');
          const other = r.programs.filter((p) => p.eligible === '비해당');
          return (
            <>
              <section aria-labelledby="radar-fit" className="space-y-3">
                <SectionTitle id="radar-fit">확인해 볼 지원</SectionTitle>
                {!r.collected ? (
                  <EmptyState title="아직 모은 공고가 없어요" description="공고를 모으면 우리 아이에게 맞는 지원이 여기에 올라와요." actionLabel="시연 제어에서 공고 모으기" to="/demo" />
                ) : fit.length === 0 ? (
                  <EmptyState title="맞는 지원이 아직 없어요" description="찾지 못한 것이지 대상이 아니라는 뜻은 아니에요. 프로필을 확인해 주세요." actionLabel="프로필 보기" to="/profile" />
                ) : (
                  <ul className="space-y-3">{fit.map((p) => <li key={p.id}><ProgramCard program={p} /></li>)}</ul>
                )}
              </section>

              <section aria-labelledby="radar-cal" className="space-y-3">
                <SectionTitle id="radar-cal">마감 달력</SectionTitle>
                <Card><MonthCalendar today={r.today} deadlines={r.deadlines} /></Card>
                <ul className="space-y-2">
                  {r.deadlines.map((d) => (
                    <li key={d.id}>
                      <Card className="flex items-center justify-between gap-3 py-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-fx-text">{d.title}</p>
                          <p className="text-sm tabular-nums text-fx-text-muted">{koDate(d.dueOn)}</p>
                          {d.to && <Link to={d.to} className={`text-sm ${linkCls}`}>보러 가기</Link>}
                        </div>
                        <span className="flex flex-col items-end gap-1">
                          <Badge tone={kindTone[d.kind]}>{d.kind}</Badge>
                          <Badge tone={d.dday < 0 ? 'muted' : d.dday <= 14 ? 'warning' : 'info'}>{ddayLabel(d.dday)}</Badge>
                        </span>
                      </Card>
                    </li>
                  ))}
                </ul>
              </section>

              {other.length > 0 && (
                <details className={cardCls}>
                  <summary className="cursor-pointer text-base font-bold text-fx-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-fx-text">
                    조건이 맞지 않는 공고 {other.length}건
                  </summary>
                  <ul className="mt-4 space-y-3">{other.map((p) => <li key={p.id}><ProgramCard program={p} /></li>)}</ul>
                </details>
              )}
            </>
          );
        }}
      </AsyncView>
    </div>
  );
}
