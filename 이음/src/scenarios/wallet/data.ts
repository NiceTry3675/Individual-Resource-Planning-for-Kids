// 발표용 가상 자료. 지자체/기관 연동과 결제는 외부로 전송하지 않는다.
export const walletScenario = {
  id: 'wallet', title: '이음 지갑', month: '2026년 10월', today: 24,
  authority: '거주지 지자체', program: '발달재활서비스', child: '지우',
  limit: 250000,
  sessions: [
    { day: 5, time: '15:00', title: '언어 치료', org: '이음 아동발달센터', voucher: 30000, copay: 10000, status: 'paid' },
    { day: 8, time: '16:00', title: '감각통합 치료', org: '자람 발달센터', voucher: 30000, copay: 10000, status: 'paid' },
    { day: 12, time: '15:00', title: '언어 치료', org: '이음 아동발달센터', voucher: 30000, copay: 10000, status: 'paid' },
    { day: 15, time: '16:00', title: '감각통합 치료', org: '자람 발달센터', voucher: 30000, copay: 10000, status: 'paid' },
    { day: 19, time: '15:00', title: '언어 치료', org: '이음 아동발달센터', voucher: 30000, copay: 10000, status: 'paid' },
    { day: 22, time: '16:00', title: '감각통합 치료', org: '자람 발달센터', voucher: 30000, copay: 10000, status: 'paid' },
    { day: 26, time: '15:00', title: '언어 치료', org: '이음 아동발달센터', voucher: 30000, copay: 10000, status: 'planned' },
  ],
  recommendations: [
    { id: 'social', title: '또래와 함께하는 사회성 교실', org: '이음 아동발달센터', date: '10월 29일(목) · 16:00', voucher: 40000, copay: 10000, reason: '지우의 사회적 의사소통 목표와 연결돼요', tag: '남는 잔액에 맞아요' },
    { id: 'language', title: '놀이로 배우는 언어 교실', org: '자람 발달센터', date: '10월 30일(금) · 15:00', voucher: 30000, copay: 10000, reason: '기존 언어 치료와 함께 이어갈 수 있어요', tag: '언어 발달 관심사' },
  ],
} as const;
export const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;
export const walletTotals = {
  used: walletScenario.sessions.filter(s => s.status === 'paid').reduce((a,s) => a+s.voucher,0),
  planned: walletScenario.sessions.filter(s => s.status === 'planned').reduce((a,s) => a+s.voucher,0),
  copayPaid: walletScenario.sessions.filter(s => s.status === 'paid').reduce((a,s) => a+s.copay,0),
  copayPlanned: walletScenario.sessions.filter(s => s.status === 'planned').reduce((a,s) => a+s.copay,0),
};
