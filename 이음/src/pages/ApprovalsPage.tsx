import { decideApproval, getApprovals } from '../api/ieum';
import { ApprovalItem } from '../components/approvals/ApprovalItem';
import { PageTitle } from '../components/common/PageTitle';
import { ProfileButton } from '../components/common/ProfileButton';
import { AsyncView, EmptyState } from '../components/common/States';
import { useToast } from '../components/common/Toast';
import { useAsync } from '../components/common/useAsync';

export default function ApprovalsPage() {
  const { state, retry } = useAsync(() => getApprovals());
  const say = useToast();

  const decide = (id: string, action: 'approve' | 'edit' | 'hold' | 'reopen', message: string, text?: string) => async (requestId: string) => {
    try {
      await decideApproval(id, action, { text, requestId });
      say(message);
    } catch (e) {
      say('처리 결과를 확인하지 못했어요. 목록을 다시 불러왔어요. 상태를 확인한 뒤 다시 눌러 주세요.');
      retry();
      throw e;
    }
  };

  return (
    <div className="space-y-5">
      <PageTitle title="승인함" description="바깥으로 나가는 것은 모두 여기서 확인해요" action={<ProfileButton />} />
      <AsyncView state={state} retry={retry}>
        {(list) => {
          if (list.length === 0) {
            return <EmptyState icon="check" title="승인할 것이 없어요" description="문자나 사진을 넘기면 보낼 초안이 여기에 올라와요." actionLabel="넘기기" to="/inbox" />;
          }
          const pending = list.filter((a) => a.status === '대기');
          const done = list.filter((a) => a.status !== '대기');
          return (
            <>
              <p className="text-fx-text-muted" aria-live="polite">승인을 기다리는 것이 {pending.length}건이에요.</p>
              <ul className="space-y-4">
                {[...pending, ...done].map((a) => (
                  <li key={a.id}>
                    <ApprovalItem
                      approval={a}
                      onApprove={decide(a.id, 'approve', '승인했어요. 시연이라 실제로는 보내지 않아요.')}
                      onEdit={(text, requestId) => decide(a.id, 'edit', '고쳐서 승인했어요. 시연이라 실제로는 보내지 않아요.', text)(requestId)}
                      onHold={decide(a.id, 'hold', '보류했어요.')}
                      onReopen={decide(a.id, 'reopen', '다시 승인함에 올렸어요.')}
                    />
                  </li>
                ))}
              </ul>
            </>
          );
        }}
      </AsyncView>
    </div>
  );
}
