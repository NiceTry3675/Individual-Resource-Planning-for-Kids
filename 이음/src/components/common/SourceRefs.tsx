import type { Source } from '../../api/types';

export function SourceRefs({ refs, defaultOpen = false }: { refs: Source[]; defaultOpen?: boolean }) {
  if (!refs.length) return null;
  return (
    <details open={defaultOpen} className="rounded-2xl border border-fx-border bg-fx-background p-3 text-sm">
      <summary className="cursor-pointer font-semibold text-fx-text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-fx-text">
        근거 {refs.length}건 보기
      </summary>
      <ul className="mt-3 space-y-3">
        {refs.map((r) => (
          <li key={r.id}>
            <p className="text-xs font-semibold text-fx-secondary">{r.label}</p>
            <p className="mt-1 whitespace-pre-line text-fx-text">{r.text}</p>
            {r.url && (
              <a href={r.url} target="_blank" rel="noreferrer" className="mt-1 inline-block font-semibold text-fx-info underline underline-offset-4">
                원문 공고 열기 ↗
              </a>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}
