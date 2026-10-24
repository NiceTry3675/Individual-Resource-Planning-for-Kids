import { cardCls } from './ui';

export interface Bar {
  label: string;
  value: number;
  flag?: boolean;
}

const niceTop = (max: number) => {
  if (max <= 0) return 3;
  const raw = max / 3;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
  return step * 3;
};

export function BarChart({ bars, format, caption }: { bars: Bar[]; format: (n: number) => string; caption: string }) {
  const top = niceTop(Math.max(0, ...bars.map((b) => b.value)));
  return (
    <figure role="img" aria-label={caption} className={cardCls}>
      <div aria-hidden="true">
        <div className="relative h-48">
          {[3, 2, 1, 0].map((i) => (
            <div key={i} className="absolute inset-x-0 flex items-center" style={{ bottom: `${(i / 3) * 100}%`, transform: 'translateY(50%)' }}>
              <span className="flex-1 border-t border-dashed border-fx-border" />
              <span className="w-14 pl-2 text-right text-xs tabular-nums text-fx-text-muted">{format((top * i) / 3)}</span>
            </div>
          ))}
          <div className="absolute inset-y-0 left-0 right-14 flex">
            {bars.map((b, i) => (
              <div key={`${i}-${b.label}`} className="flex flex-1 items-end justify-center">
                <div className={`w-6 rounded-t-md ${b.flag ? 'bg-fx-error' : 'bg-fx-secondary'}`} style={{ height: `${(b.value / top) * 100}%` }} />
              </div>
            ))}
          </div>
        </div>
        <div className="mr-14 mt-2 flex">
          {bars.map((b, i) => (
            <div key={`${i}-${b.label}`} className="flex-1 text-center text-xs tabular-nums text-fx-text-muted">
              {b.label}
              {b.flag && <span className="block font-bold text-fx-error">확인</span>}
            </div>
          ))}
        </div>
      </div>
    </figure>
  );
}
