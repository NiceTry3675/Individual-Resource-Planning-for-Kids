import { createContext, useContext, useRef, useSyncExternalStore, type CSSProperties, type RefObject } from 'react';
import { Outlet } from 'react-router-dom';
import { ToastProvider } from './Toast';

const ScreenContext = createContext<RefObject<HTMLDivElement | null> | null>(null);

// 바텀시트처럼 화면 최상단 레이어에 뜨는 요소가 폰 화면 안에 맞춰지도록 폰 화면 요소를 알려 준다.
export const useScreenRef = () => useContext(ScreenContext);

const wideQuery = '(min-width: 640px)';

function subscribe(onChange: () => void) {
  const media = window.matchMedia(wideQuery);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

const useWide = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(wideQuery).matches,
    () => false,
  );

const bezelStyle: CSSProperties = {
  width: 414,
  height: 'min(868px, calc(100vh - 48px))',
  borderRadius: 48,
};
const screenStyle: CSSProperties = { borderRadius: 36 };
// --status-h: 폰 상단 상태 표시줄이 차지하는 높이. 화면 내용이 그 아래에서 시작한다.
const scrollerStyle = { '--screen-h': '100%', '--status-h': '2.5rem' } as CSSProperties;

// 폰 상단 상태 표시줄: 통신 상태(막대), 5G, 배터리 100%.
function StatusBar() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-50 flex h-10 items-center justify-between px-8 text-fx-text">
      <div className="flex items-center gap-1.5">
        <svg viewBox="0 0 18 12" className="h-3 w-[18px]" fill="currentColor">
          <rect x="0" y="8" width="3" height="4" rx="0.8" />
          <rect x="5" y="5.5" width="3" height="6.5" rx="0.8" />
          <rect x="10" y="3" width="3" height="9" rx="0.8" />
          <rect x="15" y="0" width="3" height="12" rx="0.8" />
        </svg>
        <span className="text-xs font-bold">5G</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-bold tabular-nums">100%</span>
        <svg viewBox="0 0 27 13" className="h-3 w-[27px]" fill="currentColor">
          <rect x="0.5" y="0.5" width="22" height="12" rx="3.5" fill="none" stroke="currentColor" className="opacity-40" />
          <rect x="2" y="2" width="19" height="9" rx="2" />
          <path d="M24.5 4.5v4a2 2 0 000-4z" className="opacity-40" />
        </svg>
      </div>
    </div>
  );
}

export default function PhoneFrame() {
  const wide = useWide();
  const screenRef = useRef<HTMLDivElement>(null);

  if (!wide) {
    return (
      <ToastProvider>
        <Outlet />
      </ToastProvider>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-fx-border p-6">
      <div className="shrink-0 bg-fx-text p-3 shadow-2xl ring-1 ring-fx-text-muted" style={bezelStyle}>
        <div ref={screenRef} className="relative h-full transform-gpu overflow-hidden bg-fx-background text-fx-text" style={screenStyle}>
          <ScreenContext.Provider value={screenRef}>
            <ToastProvider>
              <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-2 z-50 h-6 w-20 -translate-x-1/2 rounded-full bg-fx-text" />
              <StatusBar />
              <div className="h-full overflow-y-auto overscroll-contain hide-scrollbar" style={scrollerStyle}>
                <Outlet />
              </div>
            </ToastProvider>
          </ScreenContext.Provider>
        </div>
      </div>
    </div>
  );
}
