import { useEffect, useRef, type ReactNode } from 'react';
import { useScreenRef } from './PhoneFrame';

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const screenRef = useScreenRef();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      const screen = screenRef?.current;
      if (screen) {
        // 폰 틀 안에서는 시트가 폰 화면 영역에만 열리도록 맞춘다.
        const r = screen.getBoundingClientRect();
        dialog.style.left = `${r.left}px`;
        dialog.style.right = 'auto';
        dialog.style.width = `${r.width}px`;
        dialog.style.top = `${r.top}px`;
        dialog.style.bottom = `${window.innerHeight - r.bottom}px`;
        dialog.style.maxHeight = `${r.height - 24}px`;
        dialog.style.borderRadius = '0 0 36px 36px';
      } else {
        dialog.removeAttribute('style');
      }
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, screenRef]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-0 mb-0 mt-auto w-full max-w-none bg-transparent p-0 backdrop:bg-fx-overlay"
    >
      <div className="mx-auto w-full max-w-2xl space-y-4 rounded-t-3xl bg-fx-surface p-6 text-fx-text shadow-lg">
        <div aria-hidden="true" className="mx-auto h-1.5 w-10 rounded-full bg-fx-border" />
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-fx-background text-xl text-fx-text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-fx-text"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
