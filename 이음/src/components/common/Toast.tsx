import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

const ToastContext = createContext<(message: string) => void>(() => {});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const timer = useRef<number | undefined>(undefined);

  const say = useCallback((text: string) => {
    setMessage(text);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(''), 5000);
  }, []);

  return (
    <ToastContext.Provider value={say}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-28 z-40 flex justify-center px-4">
        {message && (
          <p className="max-w-md rounded-2xl border border-fx-border bg-fx-surface px-4 py-3 text-center text-sm font-semibold text-fx-text shadow-lg">
            {message}
          </p>
        )}
      </div>
    </ToastContext.Provider>
  );
}
