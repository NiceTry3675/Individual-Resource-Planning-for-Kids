import type { OutputDoc } from '../../api/types';

export function DocView({ doc, showSources }: { doc: OutputDoc; showSources: boolean }) {
  return (
    <article className="space-y-6 rounded-3xl bg-fx-surface p-6">
      <h2 className="text-xl font-bold text-fx-text">{doc.title}</h2>
      {doc.sections.length === 0 && <p className="text-fx-text-muted">아직 이 문서에 쓸 기록이 없어요.</p>}
      {doc.sections.map((sec) => (
        <section key={sec.heading} className="space-y-2">
          <h3 className="text-base font-bold text-fx-secondary">{sec.heading}</h3>
          <ul className="space-y-2">
            {sec.lines.map((line) => (
              <li key={line.text} className="text-base text-fx-text">
                {line.text}
                {showSources && line.refs.map((n) => <sup key={n} className="ml-0.5 text-xs font-bold text-fx-info">[{n}]</sup>)}
              </li>
            ))}
          </ul>
        </section>
      ))}
      {doc.extraLines.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-base font-bold text-fx-secondary">부모가 덧붙인 말</h3>
          <ul className="space-y-2">
            {doc.extraLines.map((l, i) => <li key={`${i}-${l}`} className="text-base text-fx-text">{l}</li>)}
          </ul>
        </section>
      )}
      {showSources && doc.sources.length > 0 && (
        <section className="space-y-2 border-t border-fx-border pt-4">
          <h3 className="text-sm font-bold text-fx-text-muted">근거</h3>
          <ol className="space-y-2 text-sm text-fx-text-muted">
            {doc.sources.map((s) => (
              <li key={s.n}>
                <span className="font-bold text-fx-info">[{s.n}]</span> {s.label} — {s.text}
              </li>
            ))}
          </ol>
        </section>
      )}
    </article>
  );
}
