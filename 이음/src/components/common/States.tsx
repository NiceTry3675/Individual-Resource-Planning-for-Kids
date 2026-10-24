import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Mascot } from './Mascot';
import { btnPrimary, btnSecondary, cardCls } from './ui';
import type { AsyncState } from './useAsync';

export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="불러오는 중">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={`${cardCls} animate-pulse space-y-3`}>
          <div className="h-4 w-1/3 rounded-full bg-fx-border" />
          <div className="h-5 w-3/4 rounded-full bg-fx-border" />
          <div className="h-4 w-1/2 rounded-full bg-fx-border" />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className={`${cardCls} space-y-3 text-center`}>
      <p className="text-lg font-bold text-fx-text">내용을 불러오지 못했어요</p>
      <p className="text-fx-text-muted">잠시 뒤에 다시 시도해 주세요.</p>
      <button type="button" onClick={onRetry} className={btnSecondary}>다시 불러오기</button>
    </div>
  );
}

function CheckCircle({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} text-fx-primary`} aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <path d="M7.8 12.4l3 3 5.6-6" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EmptyState({ title, description, actionLabel, to, icon = 'heart' }: { title: string; description?: string; actionLabel?: string; to?: string; icon?: 'heart' | 'check' }) {
  return (
    <div className={`${cardCls} flex flex-col items-center gap-3 text-center`}>
      {icon === 'check' ? <CheckCircle className="h-16 w-16" /> : <Mascot className="h-16 w-16" />}
      <p className="text-lg font-bold text-fx-text">{title}</p>
      {description && <p className="text-fx-text-muted">{description}</p>}
      {actionLabel && to && <Link to={to} className={btnPrimary}>{actionLabel}</Link>}
    </div>
  );
}

export function AsyncView<T>({ state, retry, skeleton, children }: {
  state: AsyncState<T>;
  retry: () => void;
  skeleton?: ReactNode;
  children: (data: T) => ReactNode;
}) {
  if (state.status === 'loading') return <>{skeleton ?? <ListSkeleton />}</>;
  if (state.status === 'error') return <ErrorState onRetry={retry} />;
  return <>{children(state.data)}</>;
}
