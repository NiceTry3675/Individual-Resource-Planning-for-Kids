// GET /views/{뷰}가 읽을 수 있는 뷰와, 뷰마다 조건으로 받을 컬럼·정렬.
// 뷰 이름·컬럼 이름은 이 목록에서만 SQL에 들어가고, 값은 파라미터 바인딩으로만 넣는다.

export type FilterType = 'int' | 'text';

export interface ViewSpec {
  filters: Record<string, FilterType>;
  orderBy: string;
}

export const VIEWS: Record<string, ViewSpec> = {
  v_home_card: { filters: { child_id: 'int' }, orderBy: 'card_id' },
  v_schedule: { filters: { child_id: 'int', date: 'text' }, orderBy: '[date], start_time' },
  v_voucher_summary: { filters: { child_id: 'int', month: 'text' }, orderBy: '[month] DESC' },
  v_usage: { filters: { child_id: 'int', month: 'text' }, orderBy: 'used_at, usage_id' },
  v_radar: { filters: { child_id: 'int', eligible: 'text' }, orderBy: 'deadline, match_id' },
  v_deadline: { filters: { child_id: 'int' }, orderBy: 'due_on, kind' },
  v_application: { filters: { child_id: 'int', application_id: 'int' }, orderBy: 'application_id DESC' },
  v_checklist: { filters: { application_id: 'int' }, orderBy: 'doc_type' },
  v_document: { filters: { child_id: 'int' }, orderBy: 'doc_type' },
  v_approval: { filters: { child_id: 'int', status: 'text' }, orderBy: 'approval_id DESC' },
};
