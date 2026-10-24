import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getResume } from '../api/ieum';
import { shortDay } from '../api/dates';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { Icon } from '../components/common/Icon';
import { PageTitle } from '../components/common/PageTitle';
import { Segmented } from '../components/common/Segmented';
import { SectionTitle } from '../components/common/SectionTitle';
import { AsyncView, EmptyState } from '../components/common/States';
import { cardCls } from '../components/common/ui';
import { useAsync } from '../components/common/useAsync';

export default function ResumePage() {
  const { state, retry } = useAsync(() => getResume());
  const [tabKey, setTabKey] = useState('A');

  return (
    <div className="space-y-6">
      <PageTitle title="아이 이력서" back backTo="/more" description="기관별 목표와 기록을 한곳에" />
      <AsyncView state={state} retry={retry}>
        {(r) => {
          const tab = r.tabs.find((t) => t.key === tabKey) ?? r.tabs[0];
          return (
            <>
              <Segmented label="기관" panelId="resume-panel" items={r.tabs.map((t) => ({ key: t.key, label: t.name }))} value={tab.key} onChange={setTabKey} />

              <div id="resume-panel" role="tabpanel" aria-labelledby={`tab-${tab.key}`} className="space-y-4">
                {tab.goals.length > 0 && (
                  <Card className="space-y-3">
                    <h2 className="text-lg font-bold text-fx-text">목표</h2>
                    <ul className="divide-y divide-fx-border">
                      {tab.goals.map((g) => (
                        <li key={g.id} className="flex items-start justify-between gap-3 py-3">
                          <div>
                            <p className="font-semibold text-fx-text">{g.area}</p>
                            <p className="text-sm text-fx-text-muted">{g.description} · {g.startedOn} 시작</p>
                          </div>
                          <Badge tone="info">{g.status}</Badge>
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}
                {tab.periods.length === 0 ? (
                  <EmptyState title="아직 기록이 없어요" description="문자나 부모 한마디를 넘기면 기간별로 쌓여요." actionLabel="넘기기" to="/inbox" />
                ) : (
                  tab.periods.map((p, i) => (
                    <details key={p.label} open={i === 0} className={cardCls}>
                      <summary className="cursor-pointer text-base font-bold text-fx-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-fx-text">
                        {p.label} · {p.notes.length}건
                      </summary>
                      <ul className="mt-3 space-y-3">
                        {p.notes.map((n) => (
                          <li key={n.id} className="space-y-1 border-t border-fx-border pt-3">
                            <p className="flex flex-wrap items-center gap-2 text-sm tabular-nums text-fx-text-muted">
                              {shortDay(n.date)}
                              <Badge tone={n.author === '부모' ? 'success' : 'info'}>{n.author}</Badge>
                              {n.isFirst && <Badge tone="warning">처음 해낸 날</Badge>}
                            </p>
                            <p className="text-base text-fx-text">{n.text}</p>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ))
                )}
              </div>

              <section aria-labelledby="resume-firsts" className="space-y-3">
                <SectionTitle id="resume-firsts">처음 해낸 날</SectionTitle>
                {r.firsts.length === 0 ? (
                  <p className="px-1 text-fx-text-muted">부모 한마디에 “처음”이라고 쓰면 여기에 모여요.</p>
                ) : (
                  <ul className="space-y-2">
                    {r.firsts.map((n) => (
                      <li key={n.id}>
                        <Card className="py-4">
                          <p className="text-sm font-semibold tabular-nums text-fx-secondary">{shortDay(n.date)}</p>
                          <p className="text-base text-fx-text">{n.text}</p>
                        </Card>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section aria-labelledby="resume-docs" className="space-y-3">
                <SectionTitle id="resume-docs">용도별 문서 만들기</SectionTitle>
                <ul className="space-y-2">
                  {r.kinds.map((k) => (
                    <li key={k.id}>
                      <Link to={`/outputs/${k.id}`} className={`${cardCls} flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-fx-text`}>
                        <span className="min-w-0 flex-1">
                          <span className="block text-base font-bold text-fx-text">{k.label}</span>
                          <span className="block text-sm text-fx-text-muted">{k.description}</span>
                        </span>
                        <Icon name="next" className="h-4 w-4 text-fx-text-muted" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          );
        }}
      </AsyncView>
    </div>
  );
}
