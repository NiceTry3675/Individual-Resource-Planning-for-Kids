import { useState } from 'react';
import { getDocuments, uploadDocument } from '../api/ieum';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { ddayLabel } from '../components/common/format';
import { Icon } from '../components/common/Icon';
import { PageTitle } from '../components/common/PageTitle';
import { AsyncView, EmptyState } from '../components/common/States';
import { useToast } from '../components/common/Toast';
import { btnPrimary, inputCls, labelCls } from '../components/common/ui';
import { useAsync } from '../components/common/useAsync';

const docTypes = [
  '장애인증명서',
  '복지카드 사본',
  '진단서',
  '장애인등록증(복지카드)',
  '장애인 등록 및 서비스 신청서',
  '장애 정도 심사용 진단서',
  '검사결과지·진료기록지',
  '사회보장급여 신청(변경)서',
  '발달재활서비스 의뢰서',
  '특수교육대상자 진단·평가 의뢰서',
  '특수교육대상자 배치 결과통지서',
  '장애아동수당 수급자 확인서',
  '기타',
];

export default function DocumentsPage() {
  const { state, retry } = useAsync(() => getDocuments());
  const say = useToast();
  const [docType, setDocType] = useState(docTypes[0]);
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    try {
      await uploadDocument({ docType, fileName: file.name });
      say(`${docType}을(를) 서류함에 넣었어요.`);
      setFile(null);
      setFileKey((k) => k + 1);
    } catch {
      say('올리지 못했어요. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageTitle title="서류함" back backTo="/more" description="가진 서류와 유효기간을 한눈에" />
      <AsyncView state={state} retry={retry}>
        {(docs) =>
          docs.length === 0 ? (
            <EmptyState title="서류함이 비어 있어요" description="아래에서 첫 서류를 올려 보세요." />
          ) : (
            <ul className="space-y-3">
              {docs.map((d) => (
                <li key={d.id}>
                  <Card className="flex items-center gap-4">
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-fx-background text-fx-text-muted">
                      <Icon name="file" className="h-8 w-8" />
                    </span>
                    <div className="min-w-0 space-y-1">
                      <p className="text-base font-bold text-fx-text">{d.docType}</p>
                      <p className="truncate text-sm text-fx-text-muted">{d.fileName}</p>
                      <p className="text-sm tabular-nums text-fx-text-muted">
                        발급 {d.issuedOn}{d.validUntil ? ` · 유효 ${d.validUntil}` : ' · 유효기간 없음'}
                      </p>
                      {d.dday !== null && (
                        <Badge tone={d.expired ? 'error' : d.dday <= 30 ? 'warning' : 'success'}>
                          {d.expired ? '유효기간 지남' : `유효기간 ${ddayLabel(d.dday)}`}
                        </Badge>
                      )}
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )
        }
      </AsyncView>

      <form onSubmit={submit}>
        <Card className="space-y-4">
          <h2 className="text-lg font-bold text-fx-text">서류 올리기</h2>
          <div>
            <label htmlFor="doc-type" className={labelCls}>서류 종류</label>
            <select id="doc-type" value={docType} onChange={(e) => setDocType(e.target.value)} className={inputCls}>
              {docTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="doc-file" className={labelCls}>파일</label>
            <label className={`${inputCls} flex cursor-pointer items-center focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-fx-text`}>
              <span className={`truncate ${file ? 'text-fx-text' : 'text-fx-text-muted'}`}>{file ? file.name : '눌러서 파일 고르기'}</span>
              <input key={fileKey} id="doc-file" type="file" required accept="image/*,.pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="sr-only" />
            </label>
          </div>
          <button type="submit" disabled={busy || !file} className={`${btnPrimary} w-full`}>{busy ? '올리는 중…' : '서류함에 올리기'}</button>
        </Card>
      </form>
    </div>
  );
}
