import { Link } from 'react-router-dom';
import { getHome, getRadar, getResume, getVoucher } from '../api/ieum';
import { koDate } from '../api/dates';
import { Card } from '../components/common/Card';
import { ddayLabel, fmtWon, monthLabel } from '../components/common/format';
import { Icon } from '../components/common/Icon';
import { Mascot } from '../components/common/Mascot';
import { MetricCard } from '../components/common/MetricCard';
import { MiniBars } from '../components/common/MiniBars';
import { PageTitle } from '../components/common/PageTitle';
import { ProfileButton } from '../components/common/ProfileButton';
import { SectionTitle } from '../components/common/SectionTitle';
import { EmptyState, AsyncView } from '../components/common/States';
import { btnPrimary, btnSecondary, cardCls } from '../components/common/ui';
import { useAsync } from '../components/common/useAsync';
import { CounterPanel } from '../components/home/CounterPanel';
import { HomeCardItem } from '../components/home/HomeCardItem';

const num = new Intl.NumberFormat('ko-KR');

async function loadFeatures() {
  const [voucher, radar, resume] = await Promise.all([getVoucher(), getRadar(), getResume()]);
  return { voucher, radar, resume };
}

export default function HomePage() {
  const { state, retry } = useAsync(() => getHome());
  const { state: featState } = useAsync(() => loadFeatures());
  const f = featState.status === 'ok' ? featState.data : null;
  const fitCount = f ? f.radar.programs.filter((p) => p.eligible !== '비해당').length : 0;
  const nextDeadline = f ? f.radar.deadlines.filter((d) => d.dday >= 0).sort((a, b) => a.dday - b.dday)[0] : undefined;

  return (
    <div className="space-y-6">
      <PageTitle title="오늘 확인할 것" action={<ProfileButton />} />
      <Link to="/scenarios" className="block rounded-2xl bg-fx-primary px-5 py-4 font-bold text-white">발표 시나리오 · 이음 지갑 →</Link>
      <AsyncView state={state} retry={retry}>
        {(d) => {
          const open = d.cards.filter((c) => !c.resolved).length;
          const finished = d.scenesDone === 3 && d.counters.every((c) => c.decided === c.approvals);
          return (
            <>
              <Card className="space-y-4">
                <div className="flex items-center gap-4">
                  <Mascot />
                  <div className="min-w-0 space-y-2">
                    <p className="text-lg font-bold text-fx-text">{d.childName}의 하루를 이어 드려요</p>
                    <p className="text-sm tabular-nums text-fx-text-muted">기준일 {koDate(d.today)}</p>
                    {finished ? (
                      <>
                        <p className="text-fx-text" aria-live="polite">세 장면을 모두 마쳤어요. 승인 {d.totals.approvals}번을 끝냈어요.</p>
                        <Link to="/summary" className={btnSecondary}>{d.childName}의 한 장 보기</Link>
                      </>
                    ) : d.scenesDone === 0 ? (
                      <p className="text-fx-text-muted">문자와 사진을 입력하면 이음이 정리해드려요.</p>
                    ) : (
                      <p className="text-fx-text-muted" aria-live="polite">확인할 카드가 {open}건 남아 있어요.</p>
                    )}
                  </div>
                </div>
                <Link to="/inbox" className={`${btnPrimary} btn-continue w-full justify-center text-center`}>입력하기</Link>
              </Card>

              <section aria-labelledby="home-features" className="space-y-3">
                <SectionTitle id="home-features">바로 가기</SectionTitle>
                <ul className="grid auto-rows-fr gap-3">
                  <li className="flex">
                    <MetricCard
                      to="/voucher"
                      icon="wallet"
                      color="orange"
                      label="한 장 장부"
                      meta={f ? monthLabel(f.voucher.month) : undefined}
                      value={f ? num.format(f.voucher.remaining) : undefined}
                      unit="원 남음"
                      note={f && f.voucher.expiring ? `월말 소멸 예정 ${fmtWon(f.voucher.expiring)}` : '이번 달 돈과 출석 대조'}
                      chart={f ? <MiniBars values={f.voucher.usage.map((u) => u.amount)} label="이용 내역 금액" /> : undefined}
                    />
                  </li>
                  <li className="flex">
                    <MetricCard
                      to="/radar"
                      icon="radar"
                      color="blue"
                      label="지원 레이더"
                      meta={nextDeadline ? `다음 마감 ${ddayLabel(nextDeadline.dday)}` : undefined}
                      value={f && f.radar.collected ? String(fitCount) : undefined}
                      unit="건"
                      note={f && f.radar.collected ? '확인해 볼 지원' : '받을 수 있는 지원과 마감'}
                    />
                  </li>
                  <li className="flex">
                    <MetricCard
                      to="/resume"
                      icon="book"
                      color="purple"
                      label="아이 이력서"
                      value={f ? String(f.resume.firsts.length) : undefined}
                      unit="번"
                      note="기관별 기록과 처음 해낸 날"
                    />
                  </li>
                </ul>
              </section>

              {d.counters.length > 0 && <CounterPanel counters={d.counters} totals={d.totals} />}

              <section aria-labelledby="home-cards" className="space-y-3">
                <SectionTitle id="home-cards">확인 카드</SectionTitle>
                {d.cards.length === 0 ? (
                  <EmptyState title="확인할 카드가 없어요" description="문자나 사진을 넘기면 여기에 쌓여요." actionLabel="넘기기" to="/inbox" />
                ) : (
                  <ul className="space-y-3">
                    {d.cards.map((c) => <li key={c.id}><HomeCardItem card={c} /></li>)}
                  </ul>
                )}
              </section>

              <section aria-label="시간표">
                <Link to="/schedule" className={`${cardCls} !rounded-full !py-2.5 flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-fx-text`}>
                  <svg viewBox="0 0 36 36" className="h-9 w-9 shrink-0" aria-hidden="true">
                    <rect x="3.5" y="3.5" width="29" height="29" rx="9" fill="#ffffff" stroke="#bcbcc0" strokeWidth="3.5" />
                    <path
                      fill="#e4566b"
                      transform="translate(14.2 7) scale(0.52)"
                      d="M12 21.2l-1.4-1.27C5.5 15.3 2.2 12.3 2.2 8.6 2.2 5.58 4.58 3.2 7.6 3.2c1.7 0 3.34.8 4.4 2.05 1.06-1.25 2.7-2.05 4.4-2.05 3.02 0 5.4 2.38 5.4 5.4 0 3.7-3.3 6.7-8.4 11.33z"
                    />
                  </svg>
                  <span className="flex-1 text-lg text-fx-text">시간표 전체 보기</span>
                  <Icon name="next" className="h-4 w-4 text-fx-text-muted" />
                </Link>
              </section>
            </>
          );
        }}
      </AsyncView>
    </div>
  );
}
