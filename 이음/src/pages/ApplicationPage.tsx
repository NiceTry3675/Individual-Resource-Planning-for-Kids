import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getApplication, uploadDocument } from '../api/ieum';
import { koDate } from '../api/dates';
import { Badge, type BadgeTone } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { PageTitle } from '../components/common/PageTitle';
import { AsyncView, EmptyState } from '../components/common/States';
import { Sheet } from '../components/common/Sheet';
import { useToast } from '../components/common/Toast';
import { btnPrimary, btnSecondary, inputCls, labelCls } from '../components/common/ui';
import { useAsync } from '../components/common/useAsync';

const checkTone: Record<'있음' | '없음' | '만료', BadgeTone> = { '있음': 'success', '없음': 'error', '만료': 'warning' };

export default function ApplicationPage() {
  const { id = '' } = useParams();
  const { state, retry } = useAsync(() => getApplication(id), [id]);
  const say = useToast();
  const [guideOpen, setGuideOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-5">
      <PageTitle title="신청 진행" back backTo="/radar" />
      <AsyncView state={state} retry={retry}>
        {(app) => {
          if (!app) {
            return <EmptyState title="신청 내역을 찾지 못했어요" description="지원 레이더에서 다시 열어 주세요." actionLabel="지원 레이더" to="/radar" />;
          }
          const missingType = app.missing[0];
          const upload = async (e: React.FormEvent) => {
            e.preventDefault();
            if (!file || !missingType) return;
            setBusy(true);
            try {
              await uploadDocument({ docType: missingType, fileName: file.name });
              say(`${missingType}을(를) 서류함에 넣었어요. 제출 승인이 승인함에 올라왔어요.`);
              setFile(null);
              setFileKey((k) => k + 1);
            } catch {
              say('올리지 못했어요. 다시 시도해 주세요.');
            } finally {
              setBusy(false);
            }
          };
          return (
            <>
              <Card className="space-y-3">
                <h2 className="text-lg font-bold text-fx-text">{app.program.title}</h2>
                <p className="text-sm text-fx-text-muted">{app.program.orgName} · {app.program.channel} · 마감 {koDate(app.program.deadline)}</p>
                <ol className="flex items-center gap-1" aria-label="진행 단계">
                  {app.steps.map((s, i) => (
                    <li key={s} className="flex-1 text-center" aria-current={i === app.stepIndex ? 'step' : undefined}>
                      <span className={`block h-1.5 rounded-full ${i <= app.stepIndex ? 'bg-fx-primary' : 'bg-fx-border'}`} />
                      <span className={`mt-1 block text-xs font-semibold ${i === app.stepIndex ? 'text-fx-text' : 'text-fx-text-muted'}`}>{s}</span>
                    </li>
                  ))}
                </ol>
                <p className="text-sm text-fx-text-muted" aria-live="polite">
                  {app.status === '준비' && '서류를 갖추는 중이에요.'}
                  {app.status === '승인 대기' && '서류가 모두 갖춰졌어요. 승인함에서 제출을 승인해 주세요.'}
                  {app.status === '제출' && `${app.submittedAt ?? ''} 테스트 메일함으로 제출했어요(시연용). 기관의 접수 확인 전이라 접수 완료는 아니에요. 결과 발표 예정일은 ${app.resultOn ? koDate(app.resultOn) : '아직 몰라요'}.`}
                </p>
                {app.status === '승인 대기' && <Link to="/approvals" className={btnPrimary}>승인함으로 가기</Link>}
              </Card>

              <Card className="space-y-3">
                <h2 className="text-lg font-bold text-fx-text">신청서 미리보기</h2>
                <p className="text-sm text-fx-text-muted">공고가 요구하는 항목만 채웠어요. 프로필에 없는 정보는 비워 둬요.</p>
                <dl className="divide-y divide-fx-border">
                  {app.form.map((f) => (
                    <div key={f.label} className="flex justify-between gap-4 py-2">
                      <dt className="text-sm text-fx-text-muted">{f.label}</dt>
                      <dd className={`text-right text-base ${f.filled ? 'text-fx-text' : 'text-fx-warning'}`}>{f.filled ? f.value : '비어 있어요'}</dd>
                    </div>
                  ))}
                </dl>
              </Card>

              <Card className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold text-fx-text">서류 체크리스트</h2>
                  <Link to="/documents" className="font-semibold text-fx-info underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-fx-text">서류함 보기</Link>
                </div>
                <ul className="divide-y divide-fx-border">
                  {app.checklist.map((c) => (
                    <li key={c.docType} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-fx-text">{c.docType}</p>
                        <p className="text-sm text-fx-text-muted">{c.note}</p>
                      </div>
                      <Badge tone={checkTone[c.status]}>{c.status}</Badge>
                    </li>
                  ))}
                </ul>
              </Card>

              {missingType && (
                <Card className="space-y-4 ring-2 ring-fx-warning">
                  <div className="flex items-center gap-2">
                    <Badge tone="warning">직접 해 주세요</Badge>
                  </div>
                  <h2 className="text-lg font-bold text-fx-text">{missingType}이(가) 서류함에 없어요</h2>
                  <p className="text-base text-fx-text-muted">발급은 본인 인증이 필요해서 직접 해 주셔야 해요. 발급받은 파일을 올리면 제출 승인이 올라와요.</p>
                  <button type="button" onClick={() => setGuideOpen(true)} className={btnSecondary}>발급 방법 보기</button>
                  <form onSubmit={upload} className="space-y-3">
                    <div>
                      <label htmlFor="app-file" className={labelCls}>{missingType} 파일</label>
                      <input key={fileKey} id="app-file" type="file" required accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className={inputCls} />
                    </div>
                    <button type="submit" disabled={busy || !file} className={btnPrimary}>{busy ? '올리는 중…' : '서류함에 올리기'}</button>
                  </form>
                  <Sheet open={guideOpen} onClose={() => setGuideOpen(false)} title={`${app.guide.docType} 발급 방법`}>
                    <p className="text-sm text-fx-text-muted">시연에서는 안내 화면만 보여 드려요.</p>
                    <ol className="list-decimal space-y-2 pl-5 text-base text-fx-text">
                      {app.guide.steps.map((s) => <li key={s}>{s}</li>)}
                    </ol>
                    <button type="button" onClick={() => setGuideOpen(false)} className={btnSecondary}>확인했어요</button>
                  </Sheet>
                </Card>
              )}
            </>
          );
        }}
      </AsyncView>
    </div>
  );
}
