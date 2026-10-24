import { useParams } from 'react-router-dom';
import { getShared } from '../api/ieum';
import { PageTitle } from '../components/common/PageTitle';
import { AsyncView, EmptyState } from '../components/common/States';
import { pageWidth } from '../components/common/ui';
import { useAsync } from '../components/common/useAsync';
import { DocView } from '../components/documents/DocView';

export default function SharePage() {
  const { token = '' } = useParams();
  const { state, retry } = useAsync(() => getShared(token), [token]);

  return (
    <div className="min-h-screen bg-fx-background text-fx-text">
      <div className={`${pageWidth} space-y-5 py-8`}>
        <PageTitle title="공유된 문서" description="이음에서 보호자가 승인해 보낸 문서예요. 읽기만 할 수 있어요." />
        <AsyncView state={state} retry={retry}>
          {(doc) =>
            doc ? (
              <DocView doc={doc} showSources={false} />
            ) : (
              <EmptyState title="열 수 없는 링크예요" description="아직 공유가 승인되지 않았거나 주소가 달라요." />
            )
          }
        </AsyncView>
        <p className="text-center text-sm text-fx-text-muted">앱을 설치하지 않아도 볼 수 있어요 · 시연 데이터</p>
      </div>
    </div>
  );
}
