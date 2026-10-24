import type { ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { getPendingCount } from '../../api/ieum';
import { pageWidth } from './ui';
import { useAsync } from './useAsync';

// 하단 탭 아이콘은 사진처럼 속이 찬 모양이다.
const glyphs = {
  heart: (
    <path d="M12 21.2l-1.4-1.27C5.5 15.3 2.2 12.3 2.2 8.6 2.2 5.58 4.58 3.2 7.6 3.2c1.7 0 3.34.8 4.4 2.05 1.06-1.25 2.7-2.05 4.4-2.05 3.02 0 5.4 2.38 5.4 5.4 0 3.7-3.3 6.7-8.4 11.33z" />
  ),
  check: (
    <path
      fillRule="evenodd"
      d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.3 7.7l-5 5a1 1 0 01-1.4 0l-2.2-2.2a1 1 0 111.4-1.4l1.5 1.5 4.3-4.3a1 1 0 111.4 1.4z"
    />
  ),
} satisfies Record<string, ReactNode>;

type GlyphName = keyof typeof glyphs;

const tabs: { to: string; label: string; icon: GlyphName; end?: boolean }[] = [
  { to: '/', label: '홈', icon: 'heart', end: true },
  { to: '/approvals', label: '승인함', icon: 'check' },
];

const rootPaths = tabs.map((t) => t.to);

const focusCls = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-fx-text';

export default function AppShell() {
  const { pathname } = useLocation();
  const isRoot = rootPaths.includes(pathname);
  const { state } = useAsync(() => getPendingCount());
  const pending = state.status === 'ok' ? state.data : 0;

  return (
    <div
      className="relative min-h-[var(--screen-h,100vh)] overflow-x-clip bg-fx-background text-fx-text"
      style={{ paddingTop: 'var(--status-h, 0px)' }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-fx-secondary-soft to-fx-background" />
      {isRoot && (
        <div className={`${pageWidth} relative flex h-12 items-center gap-2`}>
          <span className="text-sm font-bold text-fx-text">이음</span>
        </div>
      )}
      <main className={`${pageWidth} relative pb-32 ${isRoot ? 'pt-1' : 'pt-4'}`}>
        <Outlet />
      </main>
      <nav aria-label="주요 메뉴" className="fixed inset-x-0 z-30 flex justify-start px-5" style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <div className="relative">
          <div aria-hidden="true" className="absolute inset-0 rounded-full bg-fx-surface opacity-75 shadow-lg ring-1 ring-fx-surface backdrop-blur-xl" />
          <ul className="relative flex items-center gap-1 p-1.5">
            {tabs.map((t) => (
              <li key={t.to} className="w-24">
                <NavLink
                  to={t.to}
                  end={t.end}
                  className={({ isActive }) =>
                    `relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-full px-2 text-xs font-bold ${focusCls} ${
                      isActive || (t.to === '/' && pathname === '/inbox') ? 'bg-fx-background text-fx-primary' : 'text-fx-text'
                    }`
                  }
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden="true">
                    {glyphs[t.icon]}
                  </svg>
                  {t.label}
                  {t.to === '/approvals' && pending > 0 && (
                    <span className="absolute right-4 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-fx-error px-1 text-xs font-bold text-fx-on-primary">
                      <span className="sr-only">대기 </span>
                      {pending}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </div>
  );
}
