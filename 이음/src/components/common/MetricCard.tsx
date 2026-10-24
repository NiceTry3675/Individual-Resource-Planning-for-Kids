import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon, type IconName } from './Icon';
import { cardCls } from './ui';

const colors = {
  orange: 'text-fx-secondary',
  purple: 'text-fx-data-1',
  blue: 'text-fx-primary',
  teal: 'text-fx-data-3',
};

export type MetricColor = keyof typeof colors;

export function MetricCard({ to, icon, label, meta, value, unit, note, chart, color = 'orange' }: {
  to?: string;
  icon: IconName;
  label: string;
  meta?: ReactNode;
  value?: string;
  unit?: string;
  note?: string;
  chart?: ReactNode;
  color?: MetricColor;
}) {
  const body = (
    <>
      <span className="flex items-center justify-between gap-3">
        <span className={`flex items-center gap-1.5 text-base font-semibold ${colors[color]}`}>
          <Icon name={icon} className="h-5 w-5" />
          {label}
        </span>
        <span className="flex items-center gap-1 text-sm text-fx-text-muted">
          {meta}
          {to && <Icon name="next" className="h-4 w-4" />}
        </span>
      </span>
      <span className="mt-6 flex items-end justify-between gap-3">
        <span className="block min-w-0">
          {value !== undefined ? (
            <>
              <span className="block text-3xl font-bold tabular-nums text-fx-text">
                {value}
                {unit && <span className="ml-1.5 text-base font-semibold text-fx-text-muted">{unit}</span>}
              </span>
              {note && <span className="mt-1 block text-sm text-fx-text-muted">{note}</span>}
            </>
          ) : (
            <span className="block text-lg font-semibold text-fx-text">{note}</span>
          )}
        </span>
        {chart}
      </span>
    </>
  );

  const layout = `flex min-h-40 w-full flex-col justify-between ${cardCls}`;

  if (to) {
    return (
      <Link to={to} className={`${layout} focus-visible:outline focus-visible:outline-2 focus-visible:outline-fx-text`}>
        {body}
      </Link>
    );
  }
  return <div className={layout}>{body}</div>;
}
