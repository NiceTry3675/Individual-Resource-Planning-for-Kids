import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Approval } from '../../api/types';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';
import { Sheet } from '../common/Sheet';
import { SourceRefs } from '../common/SourceRefs';
import { btnGhost, btnPrimary, btnSecondary, inputCls, labelCls, linkCls } from '../common/ui';

const sendLabel: Record<Approval['kind'], string> = {
  '확인 요청': '확인 요청 문자 보내기',
  '보강 요청': '보강 요청 문자 보내기',
  '신청 제출': '테스트 메일함으로 신청서 제출',
  '문서 공유': '선생님께 문서 공유',
};

const scopeNote: Record<Approval['kind'], string> = {
  '확인 요청': '문자는 받는 곳에만 가요. 신고·상담 안내를 여는 것은 자동 신고가 아니에요.',
  '보강 요청': '예약이 확정되는 게 아니라 센터에 요청 문자를 보내는 거예요.',
  '신청 제출': '제출 대상은 테스트 메일함(시연용)이에요. 접수 확인은 기관이 한 뒤에 표시돼요.',
  '문서 공유': '공유 범위는 이 문서 한 장, 읽기 전용이에요. 서류함 원문이나 다른 문서는 열리지 않아요.',
};

const sentNote: Record<Approval['kind'], string> = {
  '확인 요청': '승인했어요. 시연이라 문자는 실제로 나가지 않아요.',
  '보강 요청': '승인했어요. 보강은 예약 확정이 아니라 요청이고, 시연이라 문자는 나가지 않아요.',
  '신청 제출': '테스트 메일함으로 제출했어요. 기관의 접수 확인 전이라 접수 완료는 아니에요.',
  '문서 공유': '승인한 문서만 읽기 전용 페이지로 공유했어요(시연용).',
};

export function ApprovalItem({ approval, onApprove, onEdit, onHold, onReopen }: {
  approval: Approval;
  onApprove: (requestId: string) => Promise<void>;
  onEdit: (text: string, requestId: string) => Promise<void>;
  onHold: (requestId: string) => Promise<void>;
  onReopen: (requestId: string) => Promise<void>;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [text, setText] = useState(approval.draftText);
  const [busy, setBusy] = useState(false);
  const reqId = useRef<string | null>(null);

  // 실패해서 다시 누르면 같은 요청 ID를 써서 서버가 중복 실행을 막게 한다
  const run = async (fn: (requestId: string) => Promise<void>) => {
    setBusy(true);
    reqId.current ??= `${approval.id}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      await fn(reqId.current);
      reqId.current = null;
      return true;
    } catch {
      return false;
    } finally {
      setBusy(false);
    }
  };

  const pending = approval.status === '대기';
  const label = sendLabel[approval.kind];

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="primary">{approval.kind}</Badge>
        {pending && <Badge tone="warning">승인 대기</Badge>}
        {approval.status === '보냄' && <Badge tone="success">{approval.how === '고쳐서 승인' ? '고쳐서 승인 완료' : '승인 완료'}</Badge>}
        {approval.status === '보류' && <Badge tone="muted">보류</Badge>}
      </div>
      <div>
        <h3 className="text-lg font-bold text-fx-text">{approval.title}</h3>
        <p className="text-sm text-fx-text-muted">받는 곳 · {approval.recipient}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {approval.refs.length > 0 && (
          <div>
            <p className="mb-1 text-sm font-semibold text-fx-text-muted">근거 원문</p>
            <SourceRefs refs={approval.refs} defaultOpen={pending} />
          </div>
        )}
        <div className={approval.refs.length ? '' : 'md:col-span-2'}>
          <p className="mb-1 text-sm font-semibold text-fx-text-muted">초안</p>
          <p className="whitespace-pre-line rounded-2xl border border-fx-border bg-fx-background p-4 text-base text-fx-text">{approval.draftText}</p>
        </div>
      </div>

      {approval.link && <Link to={approval.link.to} className={linkCls}>{approval.link.label}</Link>}

      {pending && (
        <div className="space-y-3">
          <p className="text-sm text-fx-text-muted">{scopeNote[approval.kind]}</p>
          <button type="button" disabled={busy} onClick={() => run(onApprove)} className={`${btnPrimary} w-full`}>
            {busy ? '처리 중…' : label}
          </button>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => { setText(approval.draftText); setEditOpen(true); }} className={btnSecondary}>고쳐서 승인</button>
            <button type="button" disabled={busy} onClick={() => run(onHold)} className={btnGhost}>보류</button>
            {approval.guide && <button type="button" onClick={() => setGuideOpen(true)} className={btnGhost}>{approval.guide.title}</button>}
          </div>
        </div>
      )}

      {approval.status === '보냄' && (
        <div className="space-y-2">
          <p className="text-sm text-fx-text-muted">{sentNote[approval.kind]}</p>
          {approval.sentLink && <Link to={approval.sentLink.to} className={linkCls}>{approval.sentLink.label}</Link>}
        </div>
      )}

      {approval.status === '보류' && (
        <button type="button" disabled={busy} onClick={() => run(onReopen)} className={btnSecondary}>다시 승인함에 올리기</button>
      )}

      <Sheet open={editOpen} onClose={() => setEditOpen(false)} title="고쳐서 승인">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!text.trim()) return;
            const ok = await run((rid) => onEdit(text, rid));
            if (ok) setEditOpen(false);
          }}
        >
          <div>
            <label htmlFor={`edit-${approval.id}`} className={labelCls}>보낼 내용</label>
            <textarea id={`edit-${approval.id}`} required rows={5} value={text} onChange={(e) => setText(e.target.value)} className={inputCls} />
          </div>
          <p className="text-sm text-fx-text-muted">{label} · 고친 내용으로 보내요.</p>
          <button type="submit" disabled={busy || !text.trim()} className={`${btnPrimary} w-full`}>{busy ? '처리 중…' : '이대로 승인'}</button>
        </form>
      </Sheet>

      {approval.guide && (
        <Sheet open={guideOpen} onClose={() => setGuideOpen(false)} title={approval.guide.title}>
          <p className="text-sm text-fx-text-muted">안내를 여는 것만으로는 아무것도 신고되거나 전달되지 않아요.</p>
          <ul className="list-disc space-y-2 pl-5 text-base text-fx-text">
            {approval.guide.lines.map((l) => <li key={l}>{l}</li>)}
          </ul>
          <button type="button" onClick={() => setGuideOpen(false)} className={btnSecondary}>확인했어요</button>
        </Sheet>
      )}
    </Card>
  );
}
