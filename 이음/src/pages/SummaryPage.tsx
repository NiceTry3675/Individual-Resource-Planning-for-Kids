import { Link } from 'react-router-dom';
import { getApplication, getHome, getProfile, getResume, getVoucher } from '../api/ieum';
import { shortDay } from '../api/dates';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { fmtWon } from '../components/common/format';
import { Mascot } from '../components/common/Mascot';
import { PageTitle } from '../components/common/PageTitle';
import { AsyncView } from '../components/common/States';
import { linkCls } from '../components/common/ui';
import { useAsync } from '../components/common/useAsync';

async function load() {
  const [home, voucher, resume, profile, app] = await Promise.all([getHome(), getVoucher(), getResume(), getProfile(), getApplication('app1')]);
  return { home, voucher, resume, profile, app };
}

export default function SummaryPage() {
  const { state, retry } = useAsync(() => load());

  return (
    <div className="space-y-5">
      <PageTitle title="마무리" back backTo="/more" />
      <AsyncView state={state} retry={retry}>
        {({ home, voucher, resume, profile, app }) => (
          <>
            <Card className="flex items-center gap-4">
              <Mascot />
              <div>
                <h2 className="text-xl font-bold text-fx-text">{profile.name}의 한 장</h2>
                <p className="text-fx-text-muted">{profile.age}세 · {profile.grade} {profile.schoolClass}</p>
              </div>
            </Card>

            <Card className="space-y-2">
              <p className="text-sm font-semibold text-fx-text-muted">합계 · 장면 {home.scenesDone}/3</p>
              <p className="text-2xl font-bold tabular-nums text-fx-text">손 작업 {home.totals.manual}단계 → 승인 {home.totals.approvals}번</p>
              {home.totals.direct > 0 && <p className="text-sm text-fx-text-muted">직접 한 일 {home.totals.direct}번</p>}
              {home.scenesDone < 3 && <Link to="/demo" className={linkCls}>시연 제어에서 장면 넣기</Link>}
            </Card>

            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-fx-text">이번 달 장부</h2>
                <Link to="/voucher" className={linkCls}>자세히</Link>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-fx-text-muted">한도</dt><dd className="text-base font-bold tabular-nums text-fx-text">{fmtWon(voucher.limit)}</dd></div>
                <div><dt className="text-fx-text-muted">사용</dt><dd className="text-base font-bold tabular-nums text-fx-text">{fmtWon(voucher.used)}</dd></div>
                <div><dt className="text-fx-text-muted">남은 금액</dt><dd className="text-base font-bold tabular-nums text-fx-text">{fmtWon(voucher.remaining)}</dd></div>
                <div><dt className="text-fx-text-muted">월말 소멸 예정</dt><dd className="text-base font-bold tabular-nums text-fx-text">{voucher.expiring === null ? '–' : fmtWon(voucher.expiring)}</dd></div>
              </dl>
            </Card>

            <Card className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-fx-text">지원 신청</h2>
                <Link to="/radar" className={linkCls}>지원 레이더</Link>
              </div>
              {app ? (
                <>
                  <p className="text-base text-fx-text">{app.program.title}</p>
                  <Badge tone={app.status === '제출' ? 'success' : 'warning'}>{app.status}</Badge>
                </>
              ) : (
                <p className="text-fx-text-muted">아직 진행 중인 신청이 없어요.</p>
              )}
            </Card>

            <Card className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-fx-text">처음 해낸 날</h2>
                <Link to="/outputs/iep" className={linkCls}>IEP 준비 한 장</Link>
              </div>
              {resume.firsts.length === 0 ? (
                <p className="text-fx-text-muted">아직 모인 기록이 없어요.</p>
              ) : (
                <ul className="space-y-2">
                  {resume.firsts.map((n) => (
                    <li key={n.id}>
                      <p className="text-sm tabular-nums text-fx-secondary">{shortDay(n.date)}</p>
                      <p className="text-base text-fx-text">{n.text}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        )}
      </AsyncView>
    </div>
  );
}
