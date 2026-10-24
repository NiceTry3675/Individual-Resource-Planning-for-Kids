import { Link } from 'react-router-dom';
import type { HomeCard } from '../../api/types';
import { Badge, type BadgeTone } from '../common/Badge';
import { Card } from '../common/Card';
import { ddayLabel } from '../common/format';
import { SourceRefs } from '../common/SourceRefs';
import { btnSecondary } from '../common/ui';

const toneBadge: Record<HomeCard['tone'], { tone: BadgeTone; label: string }> = {
  warning: { tone: 'warning', label: '확인 필요' },
  info: { tone: 'info', label: '안내' },
  success: { tone: 'success', label: '반영함' },
};

export function HomeCardItem({ card }: { card: HomeCard }) {
  const badge = toneBadge[card.tone];
  return (
    <Card className={`space-y-3 ${card.resolved ? 'opacity-60' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        {card.resolved ? <Badge tone="success">처리했어요</Badge> : <Badge tone={badge.tone}>{badge.label}</Badge>}
        {card.dday !== null && !card.resolved && <Badge tone="muted">{ddayLabel(card.dday)}</Badge>}
      </div>
      <h3 className="text-lg font-bold text-fx-text">{card.title}</h3>
      <p className="text-base text-fx-text-muted">{card.body}</p>
      <SourceRefs refs={card.refs} />
      {card.to && card.actionLabel && !card.resolved && (
        <Link to={card.to} className={`${btnSecondary} w-full`}>{card.actionLabel}</Link>
      )}
    </Card>
  );
}
