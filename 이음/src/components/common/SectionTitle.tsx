import type { ReactNode } from 'react';

export function SectionTitle({ id, children, action }: { id?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-1">
      <h2 id={id} className="text-xl font-bold text-fx-text">{children}</h2>
      {action}
    </div>
  );
}
