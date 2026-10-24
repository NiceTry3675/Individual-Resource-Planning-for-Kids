import type { ReactNode } from 'react';
import { cardCls } from './ui';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`${cardCls} ${className}`}>{children}</section>;
}
