import { useState } from 'react';
import { Link } from 'react-router-dom';
import { walletScenario as d, walletTotals as t, won } from './data';
import './wallet.css';

export default function WalletScenario() {
  const [phase, setPhase] = useState<'idle'|'loading'|'ready'>('idle');
  const [screen, setScreen] = useState<'calendar'|'balance'>('calendar');
  const [day, setDay] = useState(22);
  const [selected, setSelected] = useState<string | null>(null);
  const imported = phase === 'ready';
  const remaining = d.limit-t.used;
  const spare = remaining-t.planned;
  const session = d.sessions.find(s => s.day === day);
  const recommendation = d.recommendations.find(r=>r.id===selected);
  const load = async () => {
    setPhase('loading');
    await new Promise(r=>setTimeout(r,1200));
    setPhase('ready');
  };
  return <div className="wallet-demo">
    <header className="wallet-header"><Link to="/" aria-label="홈으로">‹</Link><span>IEUM / WALLET</span><span className="wallet-demo-tag">시연</span></header>
    <div className="wallet-heading"><h1>이음 지갑</h1><p>바우처 · 일정 · 결제를 한 지갑으로</p></div>
    <div className="wallet-tabs" aria-label="지갑 화면">
      <button aria-pressed={screen==='calendar'} onClick={()=>setScreen('calendar')}>이용 캘린더</button>
      <button aria-pressed={screen==='balance'} onClick={()=>setScreen('balance')}>잔액과 추천</button>
    </div>
    {!imported ? <>
      <section className="wallet-connect"><div className="wallet-connect-icon">↙</div><span className="wallet-eyebrow">{d.child}의 {d.program}</span><h2>흩어진 이용 내역을<br/>한 번에 모아요</h2><p>지자체 바우처 이용 내역을 불러와<br/>치료 일정과 결제 금액을 맞춰드려요.</p><div className="wallet-source"><span>불러올 정보</span><b>이번 달 이용 내역 · 바우처 결제액</b></div><button className="wallet-primary" disabled={phase==='loading'} onClick={load}>{phase==='loading'?'이용 내역을 불러오는 중…':'바우처 이용 내역 불러오기'}</button><small>지자체 연결을 가정한 발표용 가상 데이터예요.</small></section>
    </> : <>
      <div className="wallet-sync"><span>✓ {d.authority} 이용 내역 6건 불러옴</span><span>10.24 기준</span></div>
      {screen === 'calendar' ? <>
        <section className="wallet-usage"><div><span>이번 달 바우처 사용률</span><strong>72<small>%</small></strong></div><div className="wallet-track"><i style={{width:'72%'}}/><i className="planned" style={{width:'12%'}}/></div><div className="wallet-caption"><span>사용 {won(t.used)}</span><span>월 한도 {won(d.limit)}</span></div></section>
        <section className="wallet-card wallet-calendar"><div className="wallet-section-head"><h2>{d.month}</h2><span>오늘 24일</span></div><div className="wallet-week">{'일월화수목금토'.split('').map(w=><span key={w}>{w}</span>)}</div><div className="wallet-days">{Array.from({length:35},(_,i)=>{const n=i-3;const item=d.sessions.find(s=>s.day===n);return n<1||n>31?<span key={i}/>:<button key={i} aria-label={`10월 ${n}일${item?` ${item.title} ${item.status==='paid'?'결제 완료':'예정'}`:''}`} aria-pressed={day===n} className={`${n===24?'today ':''}${day===n?'selected':''}`} onClick={()=>setDay(n)}><span>{n}</span><i className={item?.status??'empty'}/></button>})}</div><div className="wallet-legend"><span><i/>이용·결제 완료</span><span><i/>진행 예정</span></div></section>
        <section className="wallet-day-detail"><div className="wallet-section-head"><h2>10월 {day}일</h2><span>{session?.status==='planned'?'아직 진행하지 않은 일정':'이용 내역'}</span></div>{session?<div className="wallet-session"><div><b>{session.title}</b><p>{session.time} · {session.org}</p><p>바우처 {won(session.voucher)} · 본인 {won(session.copay)}</p></div><span className={`wallet-status ${session.status}`}>{session.status==='paid'?'결제 완료':'진행 예정'}</span></div>:<p className="wallet-muted">등록된 일정이 없어요.</p>}</section>
        <button className="wallet-primary" onClick={()=>setScreen('balance')}>잔액과 맞춤 교육 확인하기 →</button>
      </> : <>
        <section className="wallet-balance"><span>지우의 바우처 잔액</span><strong>{won(remaining)}</strong><div><span>월 한도 {won(d.limit)}</span><span>사용 {won(t.used)}</span></div></section>
        <section className="wallet-card wallet-ledger"><div><span>앞으로 예정된 바우처</span><b>− {won(t.planned)}</b></div><div className="wallet-highlight"><span>월말까지 남는 바우처</span><b>{won(spare)}</b></div><div><span>본인부담 · 결제 완료</span><b>{won(t.copayPaid)}</b></div><div><span>본인부담 · 결제 예정</span><b>{won(t.copayPlanned)}</b></div><p>이번 달 본인부담 합계 <b>{won(t.copayPaid+t.copayPlanned)}</b></p></section>
        <div className="wallet-section-head wallet-recommend-head"><h2>남은 잔액으로 이어가요</h2><span>추천 교육 2개</span></div>
        <p className="wallet-recommend-copy">예정 수업 이후 남는 {won(spare)}에 맞췄어요.</p>
        {d.recommendations.map(r=><button key={r.id} className="wallet-card wallet-recommend" onClick={()=>setSelected(r.id)}><span className="wallet-pill">{r.tag}</span><h3>{r.title}</h3><p>{r.date} · {r.org}</p><p className="wallet-reason">{r.reason}</p><div><b>바우처 {won(r.voucher)}</b><span>본인 {won(r.copay)}　›</span></div></button>)}
        <p className="wallet-footnote">가상 기관·교육 정보예요. 추천 항목은 대안이며,<br/>실제 이용 가능 여부는 기관 확인이 필요해요.</p>
      </>}
    </>}
    <footer className="wallet-footer"><Link to="/scenarios">시나리오 목록</Link><button onClick={()=>{setPhase('idle');setScreen('calendar');setDay(22);setSelected(null)}}>이 시연 다시 시작</button></footer>
    {recommendation && <div className="wallet-modal" role="dialog" aria-modal="true" aria-label="추천 교육 상세"><div className="wallet-modal-card"><span className="wallet-eyebrow">지우에게 추천하는 교육</span><h2>{recommendation.title}</h2><p>{recommendation.date}</p><p>{recommendation.org}</p><div className="wallet-modal-ledger"><p>바우처 사용 <b>{won(recommendation.voucher)}</b></p><p>추가 본인부담 <b>{won(recommendation.copay)}</b></p><p>이용 후 월말 예상 잔액 <b>{won(spare-recommendation.voucher)}</b></p></div><p className="wallet-muted">기존 예정 수업을 유지하고 이용할 경우예요.</p><button className="wallet-primary" onClick={()=>setSelected(null)}>확인했어요</button></div></div>}
  </div>;
}
