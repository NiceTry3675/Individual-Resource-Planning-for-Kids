export type OrgId = 'A' | 'B' | 'C' | 'S';
export type SceneNo = 1 | 2 | 3;
export type Tone = 'warning' | 'info' | 'success';
export type SessionStatus = '예정' | '출석' | '결석' | '취소' | '보강 제안' | '보강 요청';
export type ApprovalKind = '확인 요청' | '보강 요청' | '신청 제출' | '문서 공유';
export type ApplicationStatus = '준비' | '승인 대기' | '제출' | '접수' | '보완 요청' | '선정' | '미선정';
export type DeadlineKind = '서류' | 'IEP' | '신청';

export interface Organization {
  id: OrgId;
  name: string;
  kind: string;
}

export interface Caregiver {
  name: string;
  role: string;
  phone: string;
  email: string;
}

export interface Profile {
  name: string;
  birthDate: string;
  grade: string;
  schoolClass: string;
  disability: string;
  region: string;
  incomeBracket: string;
  caregiver: Caregiver;
}

export interface ProfileView extends Profile {
  age: number;
  organizations: Organization[];
}

export interface Source {
  id: string;
  label: string;
  text: string;
  url?: string;
}

export interface HomeCard {
  id: string;
  tone: Tone;
  title: string;
  body: string;
  refs: Source[];
  actionLabel?: string;
  to?: string;
  resolved: boolean;
  dday: number | null;
}

export interface Counter {
  scene: SceneNo;
  title: string;
  manualSteps: string[];
  approvals: number;
  decided: number;
  direct: number;
  directDone: boolean;
}

export interface Totals {
  manual: number;
  approvals: number;
  direct: number;
}

export interface SessionRow {
  id: string;
  date: string;
  start: string;
  end: string;
  orgId: OrgId;
  orgName: string;
  therapy: string;
  funding: string;
  status: SessionStatus;
  changedFrom?: string;
}

export interface HomeData {
  childName: string;
  today: string;
  cards: HomeCard[];
  counters: Counter[];
  totals: Totals;
  upcoming: SessionRow[];
  scenesDone: number;
}

export interface WeekData {
  today: string;
  weekStart: string;
  weekEnd: string;
  prevWeek: string | null;
  nextWeek: string | null;
  isThisWeek: boolean;
  days: { date: string; sessions: SessionRow[] }[];
}

export interface UsageRow {
  id: string;
  date: string;
  orgId: OrgId;
  orgName: string;
  amount: number;
  match: '일치' | '확인 필요' | '미확인';
  reason?: string;
}

export interface VoucherData {
  month: string;
  programName: string;
  limit: number;
  used: number;
  planned: number;
  remaining: number;
  expiring: number | null;
  usage: UsageRow[];
  overlap: { warning: boolean; text: string };
}

export type Eligible = '해당' | '해당 가능' | '비해당';
export interface Reason {
  label: string;
  result: 'ok' | 'no' | 'unknown';
}

export interface ProgramRow {
  id: string;
  title: string;
  orgName: string;
  deadline: string;
  channel: string;
  requiredDocs: string[];
  sourceUrl: string;
  quote: string;
  eligible: Eligible;
  reasons: Reason[];
  applicationId?: string;
}

export interface DeadlineRow {
  id: string;
  title: string;
  dueOn: string;
  kind: DeadlineKind;
  to?: string;
  dday: number;
}

export interface RadarData {
  today: string;
  collected: boolean;
  programs: ProgramRow[];
  deadlines: DeadlineRow[];
}

export interface ChecklistRow {
  docType: string;
  status: '있음' | '없음' | '만료';
  note: string;
}

export interface ApplicationData {
  id: string;
  program: ProgramRow;
  status: ApplicationStatus;
  steps: string[];
  stepIndex: number;
  form: { label: string; value: string; filled: boolean }[];
  checklist: ChecklistRow[];
  missing: string[];
  submittedAt?: string;
  resultOn?: string;
  approvalId?: string;
  guide: { docType: string; steps: string[] };
}

export interface DocumentRow {
  id: string;
  docType: string;
  issuedOn: string;
  validUntil: string | null;
  fileName: string;
  dday: number | null;
  expired: boolean;
}

export interface Approval {
  id: string;
  scene: SceneNo | 0;
  kind: ApprovalKind;
  title: string;
  recipient: string;
  draftText: string;
  originalText: string;
  refs: Source[];
  status: '대기' | '보냄' | '보류';
  how: '승인' | '고쳐서 승인' | null;
  guide?: { title: string; lines: string[] };
  link?: { label: string; to: string };
  sentLink?: { label: string; to: string };
}

export interface InboxItem {
  id: string;
  kind: 'text' | 'photo' | 'file' | 'note';
  label: string;
  rawText: string;
  receivedAt: string;
  result: string;
  runId?: string;
  pending?: boolean;
}

export interface RunResult {
  runId: string;
  status: '완료';
  processed: number;
}

export interface Note {
  id: string;
  orgId: OrgId | null;
  date: string;
  author: '치료사' | '부모';
  text: string;
  goalId?: string;
  isFirst: boolean;
}

export interface Goal {
  id: string;
  orgId: OrgId;
  area: string;
  description: string;
  startedOn: string;
  status: string;
}

export interface ResumeTab {
  key: string;
  name: string;
  goals: Goal[];
  periods: { label: string; notes: Note[] }[];
}

export interface ResumeData {
  tabs: ResumeTab[];
  firsts: Note[];
  kinds: { id: string; label: string; description: string }[];
}

export interface OutputDoc {
  id: string;
  title: string;
  sections: { heading: string; lines: { text: string; refs: number[] }[] }[];
  sources: { n: number; label: string; text: string; url?: string }[];
  extraLines: string[];
  shareToken: string | null;
  shareStatus: '없음' | '대기' | '보냄' | '보류';
}

export interface DemoData {
  scenes: { scene: SceneNo; title: string; inputs: string[]; done: boolean }[];
}

export interface ProfileOptions {
  grades: string[];
  disabilities: string[];
  regions: string[];
  incomes: string[];
}
