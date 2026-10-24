import type { ReactNode } from 'react';

const tones = {
  success: 'border-fx-success text-fx-success',
  warning: 'border-fx-warning text-fx-warning',
  error: 'border-fx-error text-fx-error',
  info: 'border-fx-info text-fx-info',
  primary: 'border-fx-primary text-fx-primary',
  muted: 'border-fx-border text-fx-text-muted',
};

export type BadgeTone = keyof typeof tones;

export function Badge({ tone = 'muted', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}
