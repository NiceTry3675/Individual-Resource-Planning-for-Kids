import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { addDocLine, getOutputDoc, requestShare } from '../api/ieum';
import { writeClipboard } from '../lib/flextudio-bridge';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { PageTitle } from '../components/common/PageTitle';
import { AsyncView, EmptyState } from '../components/common/States';
import { useToast } from '../components/common/Toast';
import { btnPrimary, btnSecondary, inputCls, labelCls, linkCls } from '../components/common/ui';
import { useAsync } from '../components/common/useAsync';
import { DocView } from '../components/documents/DocView';

export default function OutputPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { state, retry } = useAsync(() => getOutputDoc(id), [id]);
  const say = useToast();
  const [line, setLine] = useState('');
  const [busy, setBusy] = useState(false);

  const addLine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!line.trim()) return;
    setBusy(true);
    try {
      await addDocLine(id, line);
      setLine('');
      say('한 줄을 저장하고 미리보기를 새로 만들었어요. 바뀐 내용을 확인해 주세요.');
    } catch {
      say('덧붙이지 못했어요. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    setBusy(true);
    try {
      await requestShare(id);
      say('공유 승인을 승인함에 올렸어요.');
      navigate('/approvals');
    } catch {
      say('공유를 요청하지 못했어요. 다시 시도해 주세요.');
      setBusy(false);
    }
  };

  const copy = async (token: string) => {
    const url = `${window.location.origin}${window.location.pathname}#/share/${token}`;
    try {
      await writeClipboard(url);
      say('링크를 복사했어요.');
    } catch {
      say('복사하지 못했어요. 공유 페이지를 열어 주소를 복사해 주세요.');
    }
  };

  return (
    <div className="space-y-5">
      <PageTitle title="문서 미리보기" back backTo="/resume" />
      <AsyncView state={state} retry={retry}>
        {(doc) => {
          if (!doc) return <EmptyState title="문서를 찾지 못했어요" actionLabel="아이 이력서" to="/resume" />;
          return (
            <>
              <div className="space-y-2">
                <p className="text-sm tabular-nums text-fx-text-muted">현재 버전 {doc.extraLines.length + 1}</p>
                {id === 'iep' && <p className="text-sm font-semibold text-fx-warning">학교의 공식 IEP를 대체하지 않아요</p>}
                <DocView doc={doc} showSources />
              </div>

              <form onSubmit={addLine}>
                <Card className="space-y-3">
                  <label htmlFor="doc-line" className={labelCls}>한 줄 덧붙이기</label>
                  <input id="doc-line" value={line} onChange={(e) => setLine(e.target.value)} placeholder="부모가 직접 덧붙일 말" className={inputCls} />
                  <button type="submit" disabled={busy || !line.trim()} className={btnSecondary}>덧붙이기</button>
                </Card>
              </form>

              <Card className="space-y-3">
                <h2 className="text-lg font-bold text-fx-text">공유</h2>
                {doc.shareStatus === '보냄' && doc.shareToken ? (
                  <>
                    <Badge tone="success">공유했어요</Badge>
                    <div className="flex flex-wrap items-center gap-3">
                      <Link to={`/share/${doc.shareToken}`} className={linkCls}>공유 페이지 열기</Link>
                      <button type="button" onClick={() => copy(doc.shareToken as string)} className={btnSecondary}>링크 복사</button>
                    </div>
                  </>
                ) : doc.shareStatus === '대기' ? (
                  <>
                    <Badge tone="warning">승인 대기 중</Badge>
                    <Link to="/approvals" className={btnPrimary}>승인함에서 확인하기</Link>
                  </>
                ) : (
                  <>
                    <p className="text-base text-fx-text-muted">공유 범위는 이 문서 한 장, 읽기 전용이에요. 서류함 원문이나 다른 문서는 열리지 않아요. 바뀐 내용을 확인한 뒤 요청해 주세요.</p>
                    <button type="button" disabled={busy} onClick={share} className={btnPrimary}>이 버전으로 공유 승인 요청</button>
                  </>
                )}
              </Card>
            </>
          );
        }}
      </AsyncView>
    </div>
  );
}
