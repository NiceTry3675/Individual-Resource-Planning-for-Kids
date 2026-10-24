import { useEffect, useState } from 'react';
import { getInbox, getRun, submitInbox } from '../api/ieum';
import { Badge, type BadgeTone } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { PageTitle } from '../components/common/PageTitle';
import { ProfileButton } from '../components/common/ProfileButton';
import { SectionTitle } from '../components/common/SectionTitle';
import { AsyncView, EmptyState } from '../components/common/States';
import { useToast } from '../components/common/Toast';
import { btnPrimary, btnSecondary, btnGhost, inputCls, labelCls } from '../components/common/ui';
import { useAsync } from '../components/common/useAsync';

const kindLabel = { text: '문자', photo: '사진', file: '파일', note: '부모 한마디' } as const;
const kindTone: Record<keyof typeof kindLabel, BadgeTone> = { text: 'info', photo: 'primary', file: 'muted', note: 'success' };

const MAX_FILES = 5;
const MAX_MB = 10;

interface Picked { key: string; file: File; error?: string }

// 다른 화면에 다녀와도 입력이 남도록 서버 접수 전까지 여기에 보관한다
const draft = { texts: '', note: '', picked: [] as Picked[] };

const check = (f: File): string | undefined => {
  const okType = f.type.startsWith('image/') || f.type === 'application/pdf' || /\.(pdf|png|jpe?g|gif|webp|heic)$/i.test(f.name);
  if (!okType) return '사진이나 PDF만 올릴 수 있어요';
  if (f.size > MAX_MB * 1024 * 1024) return `${MAX_MB}MB를 넘어요`;
  return undefined;
};

const sizeLabel = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(n / 1024))}KB`);

export default function InboxPage() {
  const { state, retry } = useAsync(() => getInbox());
  const say = useToast();
  const [texts, setTexts] = useState(draft.texts);
  const [note, setNote] = useState(draft.note);
  const [picked, setPicked] = useState<Picked[]>(draft.picked);
  const [fileKey, setFileKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState<string | null>(null);

  useEffect(() => {
    draft.texts = texts;
    draft.note = note;
    draft.picked = picked;
  }, [texts, note, picked]);

  const valid = picked.filter((p) => !p.error);
  const textCount = texts.split(/\n\s*\n/).filter((t) => t.trim()).length;
  const empty = !texts.trim() && !note.trim() && valid.length === 0;

  const addFiles = (list: FileList | null) => {
    const next = [...picked];
    let validCount = next.filter((p) => !p.error).length;
    Array.from(list ?? []).forEach((file) => {
      const key = `${file.name}-${file.size}-${file.lastModified}`;
      if (next.some((p) => p.key === key)) return;
      let error = check(file);
      if (!error) {
        if (validCount >= MAX_FILES) error = `한 번에 ${MAX_FILES}개까지예요`;
        else validCount += 1;
      }
      next.push({ key, file, error });
    });
    setPicked(next);
    setFileKey((k) => k + 1);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (empty || busy) return;
    setBusy(true);
    try {
      const r = await submitInbox({ texts, fileNames: valid.map((p) => p.file.name), note });
      say(r.pending > 0 ? `${r.items}건을 접수했어요. 결과 보기로 정리 결과를 확인해 주세요.` : r.firsts ? '부모 한마디를 처음 해낸 날에 담았어요.' : '부모 한마디를 기록했어요.');
      setTexts('');
      setNote('');
      setPicked((prev) => prev.filter((p) => p.error));
    } catch {
      say('접수하지 못했어요. 입력한 내용은 그대로 두었어요. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  const showResult = async (runId: string) => {
    setChecking(runId);
    try {
      const r = await getRun(runId);
      say(`${r.processed}건의 정리 결과를 가져왔어요.`);
    } catch {
      say('결과를 가져오지 못했어요. 입력은 접수된 상태예요. 다시 눌러 주세요.');
    } finally {
      setChecking(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageTitle title="넘기기" back action={<ProfileButton />} />
      <form onSubmit={submit} className="space-y-4">
        <Card className="space-y-4">
          <div>
            <label htmlFor="in-texts" className={labelCls}>문자 붙여넣기</label>
            <textarea id="in-texts" rows={5} value={texts} onChange={(e) => setTexts(e.target.value)} placeholder="문자와 문자 사이를 한 줄 비워 주세요" className={inputCls} />
            <p className="mt-1 text-sm tabular-nums text-fx-text-muted" aria-live="polite">{textCount > 0 ? `문자 ${textCount}개로 읽었어요` : '여러 개를 한 번에 붙여넣어도 돼요'}</p>
          </div>
          <div>
            <label htmlFor="in-files" className={labelCls}>사진·파일 올리기</label>
            <input
              key={fileKey}
              id="in-files"
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={(e) => addFiles(e.target.files)}
              className="peer sr-only"
            />
            <label
              htmlFor="in-files"
              aria-hidden="true"
              className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-fx-border bg-fx-background px-4 py-5 text-center transition-colors hover:border-fx-primary peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-fx-text"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-fx-primary-soft text-fx-primary">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 16V4" />
                  <path d="m7 9 5-5 5 5" />
                  <path d="M5 20h14" />
                </svg>
              </span>
              <span className="text-base font-semibold text-fx-primary">사진·파일 고르기</span>
            </label>
            <p className="mt-1 text-sm text-fx-text-muted">사진·PDF, 파일당 {MAX_MB}MB까지, 한 번에 {MAX_FILES}개까지</p>
            {picked.length > 0 && (
              <ul className="mt-3 space-y-2" aria-label="고른 파일">
                {picked.map((p) => (
                  <li key={p.key} className="flex items-center justify-between gap-3 rounded-2xl border border-fx-border bg-fx-background px-4 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-base text-fx-text">{p.file.name}</p>
                      <p className={`text-sm ${p.error ? 'text-fx-error' : 'text-fx-text-muted'}`}>
                        {p.error ? `보낼 수 없어요 · ${p.error}` : `보낼 준비 · ${sizeLabel(p.file.size)}`}
                      </p>
                    </div>
                    <button type="button" onClick={() => setPicked((prev) => prev.filter((x) => x.key !== p.key))} aria-label={`${p.file.name} 빼기`} className={btnGhost}>
                      빼기
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label htmlFor="in-note" className={labelCls}>부모 한마디</label>
            <input id="in-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="오늘 있었던 일을 한 줄로" className={inputCls} />
          </div>
          <button type="submit" disabled={busy || empty} className={`${btnPrimary} w-full`}>{busy ? '접수하는 중…' : '넘기기'}</button>
          {empty && <p className="text-sm text-fx-text-muted">넘길 문자나 파일이 있어야 보낼 수 있어요.</p>}
        </Card>
      </form>

      <section aria-labelledby="inbox-list" className="space-y-3">
        <SectionTitle id="inbox-list">넘긴 것</SectionTitle>
        <AsyncView state={state} retry={retry}>
          {(items) => {
            const runs = [...new Set(items.filter((i) => i.pending && i.runId).map((i) => i.runId as string))];
            return items.length === 0 ? (
              <EmptyState title="아직 넘긴 게 없어요" description="문자나 사진을 넘기면 정리 결과가 여기에 나와요." />
            ) : (
              <>
                {runs.map((runId) => (
                  <Card key={runId} className="flex flex-wrap items-center justify-between gap-3 ring-2 ring-fx-warning">
                    <div>
                      <p className="text-base font-bold text-fx-text">정리 결과를 기다리고 있어요</p>
                      <p className="text-sm text-fx-text-muted">접수한 {items.filter((i) => i.runId === runId && i.pending).length}건이 아직 정리 전이에요.</p>
                    </div>
                    <button type="button" disabled={checking !== null} onClick={() => showResult(runId)} className={btnSecondary}>
                      {checking === runId ? '확인하는 중…' : '결과 보기'}
                    </button>
                  </Card>
                ))}
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li key={item.id}>
                      <Card className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={kindTone[item.kind]}>{kindLabel[item.kind]}</Badge>
                          {item.pending ? <Badge tone="warning">접수 · 정리 전</Badge> : item.kind !== 'note' && <Badge tone="success">정리 완료</Badge>}
                          <span className="text-sm text-fx-text-muted">{item.label} · {item.receivedAt}</span>
                        </div>
                        {item.kind === 'photo' ? (
                          <details className="rounded-2xl border border-fx-border bg-fx-background p-3 text-sm">
                            <summary className="cursor-pointer font-semibold text-fx-text-muted">읽어낸 내용 보기</summary>
                            <p className="mt-2 whitespace-pre-line text-fx-text">{item.rawText}</p>
                          </details>
                        ) : (
                          <p className="whitespace-pre-line text-base text-fx-text">{item.rawText}</p>
                        )}
                        <p className={`text-sm font-semibold ${item.pending ? 'text-fx-warning' : 'text-fx-success'}`}>{item.result}</p>
                      </Card>
                    </li>
                  ))}
                </ul>
              </>
            );
          }}
        </AsyncView>
      </section>
    </div>
  );
}
