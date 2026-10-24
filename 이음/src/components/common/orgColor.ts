import type { OrgId } from '../../api/types';

export const orgColor: Record<OrgId, { bar: string; dot: string; text: string }> = {
  A: { bar: 'border-fx-data-1', dot: 'bg-fx-data-1', text: 'text-fx-data-1' },
  B: { bar: 'border-fx-data-2', dot: 'bg-fx-data-2', text: 'text-fx-data-2' },
  C: { bar: 'border-fx-data-3', dot: 'bg-fx-data-3', text: 'text-fx-data-3' },
  S: { bar: 'border-fx-data-4', dot: 'bg-fx-data-4', text: 'text-fx-data-4' },
};
