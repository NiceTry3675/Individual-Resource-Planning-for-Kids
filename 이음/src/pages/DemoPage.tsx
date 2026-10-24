import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getDemo, resetDemo, runScene } from '../api/ieum';
import type { SceneNo } from '../api/types';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { PageTitle } from '../components/common/PageTitle';
import { Sheet } from '../components/common/Sheet';
import { AsyncView } from '../components/common/States';
import { useToast } from '../components/common/Toast';
import { btnPrimary, btnSecondary, linkCls } from '../components/common/ui';
import { useAsync } from '../components/common/useAsync';

export default function DemoPage() {
  const { state, retry } = useAsync(() => getDemo());
  const say = useToast();
  const [busy, setBusy] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const run = async (scene: SceneNo) => {
    setBusy(scene);
    try {
      await runScene(scene);
      say(`장면 ${scene}을 넣었어요. 홈과 승인함을 확인해 보세요.`);
    } catch {
      say('장면을 넣지 못했어요. 다시 시도해 주세요.');
    } finally {
      setBusy(null);
    }
  };

  const reset = async () => {
    setBusy(0);
    try {
      await resetDemo();
      setConfirmOpen(false);
      say('처음 상태로 되돌렸어요.');
    } catch {
      say('되돌리지 못했어요. 다시 시도해 주세요.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageTitle title="시연 제어" back backTo="/more" description="발표 중 장면을 순서대로 넘겨요" />
      <Link to="/scenarios" className={btnPrimary}>새 발표 시나리오 보기 →</Link>
      <AsyncView state={state} retry={retry}>
        {(d) => (
          <>
            <ul className="space-y-3">
              {d.scenes.map((s) => (
                <li key={s.scene}>
                  <Card className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="primary">장면 {s.scene}</Badge>
                      {s.done && <Badge tone="success">넣었어요</Badge>}
                    </div>
                    <h2 className="text-lg font-bold text-fx-text">{s.title}</h2>
                    <div>
                      <p className="text-sm font-semibold text-fx-text-muted">넣는 입력</p>
                      <ul className="list-disc pl-5 text-base text-fx-text">
                        {s.inputs.map((i) => <li key={i}>{i}</li>)}
                      </ul>
                    </div>
                    <button type="button" disabled={s.done || busy !== null} onClick={() => run(s.scene)} className={btnPrimary}>
                      {busy === s.scene ? '넣는 중…' : s.scene === 2 ? '공고 수집 실행' : `장면 ${s.scene} 입력 넣기`}
                    </button>
                  </Card>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" disabled={busy !== null} onClick={() => setConfirmOpen(true)} className={btnSecondary}>처음으로 초기화</button>
              <Link to="/summary" className={linkCls}>마무리 화면 보기</Link>
            </div>
            <p className="text-sm text-fx-text-muted">기관에 보내는 문자, 신청서 제출, 정부24 발급은 시연이라 실제로 나가지 않아요.</p>
          </>
        )}
      </AsyncView>

      <Sheet open={confirmOpen} onClose={() => setConfirmOpen(false)} title="처음 상태로 돌릴까요?">
        <p className="text-base text-fx-text-muted">넣은 장면과 승인한 내용, 올린 서류가 모두 지워져요.</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={busy !== null} onClick={reset} className={btnPrimary}>초기화</button>
          <button type="button" onClick={() => setConfirmOpen(false)} className={btnSecondary}>취소</button>
        </div>
      </Sheet>
    </div>
  );
}
