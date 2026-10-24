import type { SessionRow } from '../../api/types';
import { Badge, type BadgeTone } from '../common/Badge';
import { orgColor } from '../common/orgColor';

const statusTone: Record<SessionRow['status'], BadgeTone> = {
  '예정': 'muted',
  '출석': 'success',
  '결석': 'error',
  '취소': 'error',
  '보강 제안': 'info',
  '보강 요청': 'warning',
};

export function SessionItem({ session }: { session: SessionRow }) {
  return (
    <li className={`flex items-center justify-between gap-3 rounded-2xl border-l-4 bg-fx-background py-3 pl-4 pr-3 ${orgColor[session.orgId].bar}`}>
      <div className="min-w-0">
        <p className="font-semibold text-fx-text">{session.orgName}</p>
        <p className="text-sm tabular-nums text-fx-text-muted">
          {session.start}–{session.end} · {session.therapy}
          {session.changedFrom && <span className="text-fx-warning"> · {session.changedFrom}에서 변경</span>}
        </p>
      </div>
      <Badge tone={statusTone[session.status]}>{session.status}</Badge>
    </li>
  );
}
