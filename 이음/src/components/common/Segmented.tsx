export function Segmented({ label, items, value, onChange, panelId }: {
  label: string;
  items: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
  panelId: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1 overflow-x-auto rounded-full bg-fx-border p-1">
      {items.map((it) => {
        const selected = it.key === value;
        return (
          <button
            key={it.key}
            type="button"
            role="tab"
            id={`tab-${it.key}`}
            aria-selected={selected}
            aria-controls={panelId}
            onClick={() => onChange(it.key)}
            className={`min-h-11 flex-1 whitespace-nowrap rounded-full px-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-fx-text ${
              selected ? 'bg-fx-surface text-fx-text shadow-sm' : 'text-fx-text-muted'
            }`}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
