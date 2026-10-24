export function MiniBars({ values, label }: { values: number[]; label: string }) {
  if (values.length === 0) return null;
  const max = Math.max(...values, 1);
  return (
    <span role="img" aria-label={label} className="flex h-12 items-end gap-1.5">
      {values.map((v, i) => (
        <span
          key={i}
          className={`w-1.5 rounded-full ${i === values.length - 1 ? 'bg-fx-secondary' : 'bg-fx-border'}`}
          style={{ height: `${Math.max(14, (v / max) * 100)}%` }}
        />
      ))}
    </span>
  );
}
