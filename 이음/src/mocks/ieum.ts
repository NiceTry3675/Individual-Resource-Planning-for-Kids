import type { Goal, Note, OrgId, Organization, Profile, ProfileOptions, SceneNo, SessionStatus } from '../api/types';

export const TODAY = '2026-10-24';
export const MONTH_END = '2026-10-31';
export const RESULT_ON = '2026-11-20';

export const organizations: Organization[] = [
  { id: 'A', name: 'A 언어센터', kind: '발달센터' },
  { id: 'B', name: 'B 감각통합센터', kind: '발달센터' },
  { id: 'C', name: 'C 놀이치료실', kind: '발달센터' },
  { id: 'S', name: '학교 특수학급', kind: '학교' },
];

export interface ServiceSeed {
  id: string;
  orgId: OrgId;
  therapy: string;
  weekday: number;
  start: string;
  minutes: number;
  price: number;
  funding: '바우처' | '교육청' | '자부담';
}

export const services: ServiceSeed[] = [
  { id: 'svcA', orgId: 'A', therapy: '언어치료', weekday: 2, start: '16:30', minutes: 40, price: 30000, funding: '바우처' },
  { id: 'svcB', orgId: 'B', therapy: '감각통합', weekday: 1, start: '16:00', minutes: 40, price: 50000, funding: '바우처' },
  { id: 'svcC', orgId: 'C', therapy: '놀이치료', weekday: 4, start: '15:30', minutes: 40, price: 0, funding: '교육청' },
];

export const voucher = { month: '2026-10', programName: '발달재활 바우처', limit: 350000 };

export const profileOptions: ProfileOptions = {
  grades: ['미취학', '초등 1학년', '초등 2학년', '초등 3학년', '초등 4학년', '초등 5학년', '초등 6학년', '중학생', '고등학생'],
  disabilities: ['발달장애', '지체장애', '청각장애', '시각장애', '기타'],
  regions: ['시범구', '이웃구', '그 외 지역'],
  incomes: ['1구간', '2구간', '3구간', '잘 모르겠어요'],
};

export const profile: Profile = {
  name: '지우',
  birthDate: '2019-05-14',
  grade: '초등 1학년',
  schoolClass: '특수학급',
  disability: '발달장애',
  region: '시범구',
  incomeBracket: '2구간',
  caregiver: { name: '지우 엄마', role: '주양육자', phone: '010-1234-5678', email: '' },
};

export const documents = [
  { id: 'doc-card', docType: '복지카드 사본', issuedOn: '2026-03-12', validUntil: null as string | null, fileName: '복지카드_사본.jpg' },
  { id: 'doc-diag', docType: '진단서', issuedOn: '2025-11-11', validUntil: '2026-11-10' as string | null, fileName: '진단서.pdf' },
];

export const deadlines = [
  { id: 'dl-diag', title: '진단서 유효기간 끝', dueOn: '2026-11-10', kind: '서류' as const, to: '/documents' },
];

export const goals: Goal[] = [
  { id: 'gA1', orgId: 'A', area: '표현 언어', description: '두 낱말 이어 말하기', startedOn: '2026-03-10', status: '진행 중' },
  { id: 'gB1', orgId: 'B', area: '몸 조절', description: '순서를 기다리며 활동하기', startedOn: '2026-03-09', status: '진행 중' },
  { id: 'gC1', orgId: 'C', area: '또래 놀이', description: '인형·친구와 놀이 이어가기', startedOn: '2026-03-12', status: '진행 중' },
  { id: 'gS1', orgId: 'S', area: '학교 적응', description: '교실 활동 순서 따르기', startedOn: '2026-03-02', status: '진행 중' },
];

const n = (id: string, orgId: OrgId | null, date: string, author: '치료사' | '부모', text: string, goalId?: string, isFirst = false): Note => ({
  id, orgId, date, author, text, goalId, isFirst,
});

export const notes: Note[] = [
  n('a1', 'A', '2026-04-14', '치료사', '그림 카드를 보고 한두 낱말로 말했어요.', 'gA1'),
  n('a2', 'A', '2026-06-23', '치료사', '두 낱말을 이어서 말하는 횟수가 늘었어요.', 'gA1'),
  n('b1', 'B', '2024-11-12', '치료사', '처음 방문한 달이에요. 낯선 기구 앞에서는 보호자 곁에 머무는 시간이 길었어요.'),
  n('b2', 'B', '2025-02-10', '치료사', '트램펄린에서 두 발로 뛰는 활동을 시작했어요.'),
  n('b3', 'B', '2025-05-12', '치료사', '그네에 타는 동안 몸을 곧게 세우고 있는 시간이 길어졌어요.'),
  n('b4', 'B', '2025-08-11', '치료사', '평균대 위를 한 발씩 걸어가는 연습을 했어요.'),
  n('b5', 'B', '2025-11-10', '치료사', '활동 도구를 스스로 골라 오는 일이 생겼어요.'),
  n('b6', 'B', '2026-02-09', '치료사', '도구를 정리 상자에 넣는 활동을 함께했어요.'),
  n('b7', 'B', '2026-04-20', '치료사', '그네 활동에서 균형을 잡는 시간이 길어졌어요.', 'gB1'),
  n('b8', 'B', '2026-07-06', '치료사', '활동 순서를 기다리는 연습을 시작했어요.', 'gB1'),
  n('c1', 'C', '2026-05-14', '치료사', '역할놀이에서 인형을 가지고 놀이에 참여했어요.', 'gC1'),
  n('c2', 'C', '2026-07-02', '치료사', '다른 아이 인형에게 말을 거는 모습이 보였어요.', 'gC1'),
  n('p1', null, '2026-05-30', '부모', '처음으로 마트에서 직접 "이거 주세요" 하고 말했어요.', undefined, true),
  n('p2', null, '2026-07-19', '부모', '처음으로 혼자 신발을 신고 현관문 앞에서 기다렸어요.', undefined, true),
  n('p3', null, '2026-09-27', '부모', '처음으로 친구 이름을 부르며 같이 놀자고 했어요.', undefined, true),
  n('p4', null, '2026-09-02', '부모', '집에서 그림책을 보며 두 낱말씩 이어 말해요.'),
];

export const sceneMeta: Record<SceneNo, { title: string; manualSteps: string[]; approvals: number; direct: number; inputs: string[] }> = {
  1: {
    title: '월말 밤 · 한 장 장부',
    manualSteps: [
      '센터 문자 12개를 읽고 일정 옮기기',
      '결석·보강 안내 찾아 표시하기',
      '이용 내역 캡처에서 금액 옮겨 적기',
      '이용 내역과 출석 하나씩 맞춰 보기',
      '바우처 잔액과 소멸 예정액 계산하기',
      '센터에 보낼 문자 쓰기',
    ],
    approvals: 2,
    direct: 0,
    inputs: ['센터 문자 12개', '이용 내역 캡처 1장'],
  },
  2: {
    title: '오후 · 맞춤 지원 레이더',
    manualSteps: [
      '새 공고 찾아보기',
      '대상 조건을 읽고 우리 아이와 맞춰 보기',
      '신청서 쓰기',
      '필요 서류와 서류함 맞춰 보기',
      '빠진 서류 발급 방법 찾기',
      '마감일과 결과 발표일 챙기기',
    ],
    approvals: 1,
    direct: 1,
    inputs: ['구청·복지관 공고 5건 자동 수집', '엄마가 발급한 서류 파일 1개 (신청 진행 화면에서 올려요)'],
  },
  3: {
    title: '새 학기 · 아이 이력서',
    manualSteps: [
      '안내문에서 날짜 옮겨 적기',
      '세 기관의 지난 기록 모으기',
      '가정에서 본 모습과 함께 한 장으로 쓰기',
      '특수교사에게 보내기',
    ],
    approvals: 1,
    direct: 0,
    inputs: ['IEP 협의 안내문 사진 1장'],
  },
};

export interface MessageSeed { id: string; orgId: OrgId; text: string; result: string }

export const scene1Messages: MessageSeed[] = [
  { id: 'm1', orgId: 'B', text: '[B 감각통합센터] 10/26(월) 수업이 17:00로 변경되었습니다. 확인 부탁드립니다.', result: '일정 변경 → 10/26(월) B 감각통합센터를 17:00으로 바꿨어요' },
  { id: 'm2', orgId: 'C', text: '[C 놀이치료실] 10/29(목) 수업이 15:30에서 16:00로 변경됩니다. 양해 부탁드립니다.', result: '일정 변경 → 10/29(목) C 놀이치료실을 16:00으로 바꿨어요' },
  { id: 'm3', orgId: 'A', text: '[A 언어센터] 11/3(화) 수업 시간이 16:30에서 17:00으로 변경되었습니다.', result: '일정 변경 → 11/3(화) A 언어센터를 17:00으로 바꿨어요' },
  { id: 'm4', orgId: 'A', text: '[A 언어센터] 지우 10/20(화) 수업은 결석 처리되었습니다.', result: '결석 → 10/20(화) A 언어센터를 결석으로 표시했어요' },
  { id: 'm5', orgId: 'A', text: '[A 언어센터] 결석 수업 보강은 10/30(금) 16:30에 가능합니다. 필요하시면 말씀해 주세요.', result: '보강 안내 → 10/30(금) 16:30을 보강 가능 시간으로 담았어요' },
  { id: 'm6', orgId: 'A', text: '[A 언어센터] 보강 가능 시간 추가 안내드립니다. 11/5(목) 16:30도 가능합니다.', result: '보강 안내 → 11/5(목) 16:30을 보강 가능 시간으로 담았어요' },
  { id: 'm7', orgId: 'B', text: '[B 감각통합센터] 11월부터 센터 주차장 공사로 인근 공영주차장을 이용해 주세요.', result: '공지 → 주차 안내로 기록했어요' },
  { id: 'm8', orgId: 'C', text: '[C 놀이치료실] 11/9(월)~11/13(금) 정기 휴원입니다. 해당 주 수업은 별도 안내드립니다.', result: '공지 → 11/9~11/13 정기 휴원으로 기록했어요' },
  { id: 'm9', orgId: 'A', text: "[A 언어센터] 오늘 지우가 '물 주세요'를 먼저 말로 요청했어요. 두 낱말 이어 말하기 연습을 이어가요.", result: '치료 피드백 → A 언어센터 기록에 담았어요' },
  { id: 'm10', orgId: 'B', text: '[B 감각통합센터] 그네 활동에서 끝까지 기다리는 시간이 길어졌어요. 다음 시간에는 순서 기다리기를 이어서 해볼게요.', result: '치료 피드백 → B 감각통합센터 기록에 담았어요' },
  { id: 'm11', orgId: 'C', text: '[C 놀이치료실] 역할놀이에서 친구 인형에게 먼저 인사하는 모습이 있었어요.', result: '치료 피드백 → C 놀이치료실 기록에 담았어요' },
  { id: 'm12', orgId: 'A', text: '[A 언어센터] 그림 카드를 보고 3어절 문장으로 말한 횟수가 늘었어요.', result: '치료 피드백 → A 언어센터 기록에 담았어요' },
];

export const scene1Photo = {
  id: 'ph-usage',
  label: '이용 내역 캡처 사진',
  rawText: [
    '발달재활 바우처 이용 내역 (10월)',
    '10/05 B 감각통합센터 50,000원',
    '10/06 A 언어센터 30,000원',
    '10/12 B 감각통합센터 50,000원',
    '10/13 A 언어센터 30,000원',
    '10/19 B 감각통합센터 50,000원',
    '10/20 A 언어센터 30,000원',
  ].join('\n'),
  result: '이용 내역 6건을 읽어 장부에 넣었어요',
};

export const scene1Usage: { date: string; orgId: OrgId; amount: number }[] = [
  { date: '2026-10-05', orgId: 'B', amount: 50000 },
  { date: '2026-10-06', orgId: 'A', amount: 30000 },
  { date: '2026-10-12', orgId: 'B', amount: 50000 },
  { date: '2026-10-13', orgId: 'A', amount: 30000 },
  { date: '2026-10-19', orgId: 'B', amount: 50000 },
  { date: '2026-10-20', orgId: 'A', amount: 30000 },
];

export interface SessionOverride {
  serviceId: string;
  date: string;
  status?: SessionStatus;
  start?: string;
  changedFrom?: string;
}

export const scene1Overrides: SessionOverride[] = [
  { serviceId: 'svcB', date: '2026-10-26', start: '17:00', changedFrom: '16:00' },
  { serviceId: 'svcC', date: '2026-10-29', start: '16:00', changedFrom: '15:30' },
  { serviceId: 'svcA', date: '2026-11-03', start: '17:00', changedFrom: '16:30' },
  { serviceId: 'svcA', date: '2026-10-20', status: '결석' },
];

export const scene1Offers = [
  { id: 'mk1', serviceId: 'svcA', date: '2026-10-30', start: '16:30', requested: false },
  { id: 'mk2', serviceId: 'svcA', date: '2026-11-05', start: '16:30', requested: false },
];

export const scene1Notes: Note[] = [
  n('s9', 'A', '2026-10-06', '치료사', "'물 주세요'를 먼저 말로 요청했어요. 두 낱말 이어 말하기 연습을 이어가요.", 'gA1'),
  n('s10', 'B', '2026-10-19', '치료사', '그네 활동에서 끝까지 기다리는 시간이 길어졌어요. 다음 시간에는 순서 기다리기를 이어서 해볼게요.', 'gB1'),
  n('s11', 'C', '2026-10-22', '치료사', '역할놀이에서 친구 인형에게 먼저 인사하는 모습이 있었어요.', 'gC1'),
  n('s12', 'A', '2026-10-13', '치료사', '그림 카드를 보고 3어절 문장으로 말한 횟수가 늘었어요.', 'gA1'),
];

export const consultGuide = {
  title: '신고 상담 안내',
  lines: [
    '이용 내역이 맞는지는 센터에 먼저 확인해 보는 것이 좋아요.',
    '센터 답변을 받은 뒤에도 궁금한 점이 있으면 관할 주민센터의 바우처 담당에게 문의할 수 있어요.',
    '이음은 이용 내역이 잘못됐는지 판단하지 않아요. 확인에 필요한 기록만 정리해 드려요.',
  ],
};

export interface ProgramSeed {
  id: string;
  title: string;
  orgName: string;
  deadline: string;
  channel: string;
  requiredDocs: string[];
  sourceUrl: string;
  quote: string;
  gradeMin: number;
  gradeMax: number;
  gradeLabel: string;
  disability: string[];
  region: string;
}

export const programs: ProgramSeed[] = [
  {
    id: 'p1', title: '주말 사회성 프로그램 참여자 모집', orgName: '시범구청 복지과', deadline: '2026-11-06', channel: '이메일 접수',
    requiredDocs: ['참가 신청서', '복지카드 사본', '장애인증명서'], sourceUrl: 'https://example.org/ieum-sample/notice-1',
    quote: '관내 거주 초등 1~3학년 발달장애 아동', gradeMin: 1, gradeMax: 3, gradeLabel: '초등 1~3학년', disability: ['발달장애'], region: '시범구',
  },
  {
    id: 'p2', title: '중학생 진로 체험 캠프', orgName: '시범구 장애인복지관', deadline: '2026-11-13', channel: '온라인 접수',
    requiredDocs: ['참가 신청서'], sourceUrl: 'https://example.org/ieum-sample/notice-2',
    quote: '관내 거주 중학생 장애 청소년', gradeMin: 7, gradeMax: 9, gradeLabel: '중학생', disability: ['발달장애', '지체장애'], region: '시범구',
  },
  {
    id: 'p3', title: '영유아 부모교육 프로그램', orgName: '시범구 건강가정지원센터', deadline: '2026-11-20', channel: '방문 접수',
    requiredDocs: ['참가 신청서'], sourceUrl: 'https://example.org/ieum-sample/notice-3',
    quote: '관내 거주 미취학 발달 지연 영유아의 보호자', gradeMin: 0, gradeMax: 0, gradeLabel: '미취학', disability: ['발달장애'], region: '시범구',
  },
  {
    id: 'p4', title: '청각장애 아동 보청기 지원', orgName: '시범구청 장애인복지과', deadline: '2026-12-04', channel: '정부24 접수',
    requiredDocs: ['지원 신청서', '장애인증명서'], sourceUrl: 'https://example.org/ieum-sample/notice-4',
    quote: '관내 거주 청각장애 아동', gradeMin: 0, gradeMax: 12, gradeLabel: '전 학년', disability: ['청각장애'], region: '시범구',
  },
  {
    id: 'p5', title: '이웃구 방과후 돌봄 교실', orgName: '이웃구 복지관', deadline: '2026-11-27', channel: '온라인 접수',
    requiredDocs: ['참가 신청서'], sourceUrl: 'https://example.org/ieum-sample/notice-5',
    quote: '이웃구 거주 초등 1~6학년 발달장애 아동', gradeMin: 1, gradeMax: 6, gradeLabel: '초등 1~6학년', disability: ['발달장애'], region: '이웃구',
  },
];

export const applicationFields: { label: string; key: 'name' | 'birthDate' | 'grade' | 'disability' | 'region' | 'caregiverName' | 'phone' }[] = [
  { label: '아동 이름', key: 'name' },
  { label: '생년월일', key: 'birthDate' },
  { label: '학년', key: 'grade' },
  { label: '장애 유형', key: 'disability' },
  { label: '거주지', key: 'region' },
  { label: '보호자', key: 'caregiverName' },
  { label: '보호자 연락처', key: 'phone' },
];

export const issueGuide = {
  docType: '장애인증명서',
  steps: [
    '정부24(gov.kr)에 접속해요.',
    "검색창에 '장애인증명서'를 입력해요.",
    '본인 인증은 직접 진행해 주세요. 이 단계는 이음이 대신할 수 없어요.',
    '발급받은 파일을 저장해요.',
    '이음의 신청 진행 화면에서 그 파일을 올려요.',
  ],
};

export const iepNotice = {
  photo: {
    id: 'ph-iep',
    label: 'IEP 협의 안내문 사진',
    rawText: [
      '2026학년도 2학기 개별화교육(IEP) 협의회 안내',
      '일시: 11월 12일(목) 15:00',
      '장소: 특수학급 교실',
      '학부모 의견서는 11월 9일(월)까지 담임 선생님께 제출해 주세요.',
    ].join('\n'),
  },
  meetingOn: '2026-11-12',
  meetingTime: '15:00',
  place: '특수학급 교실',
  replyDue: '2026-11-09',
};

export interface DocTemplate {
  id: string;
  title: string;
  sections: { heading: string; lines: { text: string; refs: string[] }[] }[];
}

export const documentKinds = [
  { id: 'iep', label: 'IEP 준비 한 장', description: '기관 기록과 집에서 본 모습을 한 장으로 모아요' },
  { id: 'handover', label: '새 선생님께 인계서', description: 'B 감각통합센터 기록을 기간별로 정리해요' },
  { id: 'intro', label: '신청서용 아이 소개', description: '신청서에 붙일 짧은 소개를 만들어요' },
];

export const outputTemplates: DocTemplate[] = [
  {
    id: 'iep',
    title: '{name}의 IEP 준비 한 장',
    sections: [
      {
        heading: '요즘 기관에서 본 모습',
        lines: [
          { text: 'A 언어센터: 그림 카드를 보고 3어절 문장으로 말한 횟수가 늘었어요.', refs: ['s12'] },
          { text: 'A 언어센터: "물 주세요"처럼 필요한 말을 먼저 요청하는 모습이 있었어요.', refs: ['s9'] },
          { text: 'B 감각통합센터: 그네 활동에서 끝까지 기다리는 시간이 길어졌어요.', refs: ['s10'] },
          { text: 'C 놀이치료실: 역할놀이에서 친구 인형에게 먼저 인사하는 모습이 있었어요.', refs: ['s11'] },
        ],
      },
      {
        heading: '지난 학기 기록',
        lines: [
          { text: 'A 언어센터: 두 낱말을 이어서 말하는 횟수가 늘었어요.', refs: ['a2'] },
          { text: 'B 감각통합센터: 활동 순서를 기다리는 연습을 시작했어요.', refs: ['b8'] },
          { text: 'C 놀이치료실: 다른 아이 인형에게 말을 거는 모습이 보였어요.', refs: ['c2'] },
        ],
      },
      {
        heading: '기관별 목표',
        lines: [
          { text: 'A 언어센터 · 표현 언어: 두 낱말 이어 말하기', refs: ['a1', 'a2'] },
          { text: 'B 감각통합센터 · 몸 조절: 순서를 기다리며 활동하기', refs: ['b7', 'b8'] },
          { text: 'C 놀이치료실 · 또래 놀이: 인형·친구와 놀이 이어가기', refs: ['c1', 'c2'] },
        ],
      },
      {
        heading: '집에서 본 {name}',
        lines: [
          { text: '친구 이름을 부르며 같이 놀자고 한 날이 있었어요.', refs: ['p3'] },
          { text: '마트에서 직접 "이거 주세요"라고 말했어요.', refs: ['p1'] },
          { text: '혼자 신발을 신고 현관문 앞에서 기다렸어요.', refs: ['p2'] },
          { text: '집에서 그림책을 보며 두 낱말씩 이어 말해요.', refs: ['p4'] },
        ],
      },
    ],
  },
  {
    id: 'handover',
    title: 'B 감각통합센터 인계서',
    sections: [
      { heading: '2024년 하반기', lines: [{ text: '처음 방문한 달에는 낯선 기구 앞에서 보호자 곁에 머무는 시간이 길었어요.', refs: ['b1'] }] },
      {
        heading: '2025년 상반기',
        lines: [
          { text: '트램펄린에서 두 발로 뛰는 활동을 시작했어요.', refs: ['b2'] },
          { text: '그네에 타는 동안 몸을 곧게 세우고 있는 시간이 길어졌어요.', refs: ['b3'] },
        ],
      },
      {
        heading: '2025년 하반기',
        lines: [
          { text: '평균대 위를 한 발씩 걸어가는 연습을 했어요.', refs: ['b4'] },
          { text: '활동 도구를 스스로 골라 오는 일이 생겼어요.', refs: ['b5'] },
        ],
      },
      {
        heading: '2026년 상반기',
        lines: [
          { text: '도구를 정리 상자에 넣는 활동을 함께했어요.', refs: ['b6'] },
          { text: '그네 활동에서 균형을 잡는 시간이 길어졌어요.', refs: ['b7'] },
        ],
      },
      {
        heading: '2026년 하반기',
        lines: [
          { text: '활동 순서를 기다리는 연습을 시작했어요.', refs: ['b8'] },
          { text: '그네 활동에서 끝까지 기다리는 시간이 길어졌어요.', refs: ['s10'] },
        ],
      },
      { heading: '현재 수업', lines: [{ text: '월요일 오후에 수업이 있고, 10/26부터 17:00에 시작해요.', refs: ['m1'] }] },
    ],
  },
  {
    id: 'intro',
    title: '신청서용 아이 소개',
    sections: [
      {
        heading: '소개',
        lines: [
          { text: '이름 {name} · {age}세 · {grade} {schoolClass}', refs: ['profile'] },
          { text: '집에서는 그림책을 보며 두 낱말씩 이어 말해요.', refs: ['p4'] },
          { text: '친구 이름을 부르며 같이 놀자고 한 날이 있었어요.', refs: ['p3'] },
        ],
      },
    ],
  },
];
