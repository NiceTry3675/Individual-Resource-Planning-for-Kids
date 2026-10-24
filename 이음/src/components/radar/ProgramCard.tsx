import { Link } from 'react-router-dom';
import type { ProgramRow } from '../../api/types';
import { koDate } from '../../api/dates';
import { Badge, type BadgeTone } from '../common/Badge';
import { Card } from '../common/Card';
import { btnPrimary } from '../common/ui';

const eligibleTone: Record<ProgramRow['eligible'], BadgeTone> = { '해당': 'success', '해당 가능': 'warning', '비해당': 'muted' };
const reasonText = { ok: '맞아요', no: '맞지 않아요', unknown: '확인 필요' } as const;
const reasonTone: Record<'ok' | 'no' | 'unknown', BadgeTone> = { ok: 'success', no: 'muted', unknown: 'warning' };

export function ProgramCard({ program }: { program: ProgramRow }) {
  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={eligibleTone[program.eligible]}>{program.eligible}</Badge>
        <Badge tone="muted">{program.channel}</Badge>
      </div>
      <div>
        <h3 className="text-lg font-bold text-fx-text">{program.title}</h3>
        <p className="text-sm text-fx-text-muted">{program.orgName} · 신청 마감 {koDate(program.deadline)}</p>
      </div>
      <div>
        <p className="mb-1 text-sm font-semibold text-fx-text-muted">왜 이렇게 봤나요</p>
        <ul className="space-y-2">
          {program.reasons.map((r) => (
            <li key={r.label} className="flex items-start justify-between gap-3 text-sm text-fx-text">
              <span>{r.label}</span>
              <Badge tone={reasonTone[r.result]}>{reasonText[r.result]}</Badge>
            </li>
          ))}
        </ul>
      </div>
      <p className="rounded-2xl bg-fx-background p-3 text-sm text-fx-text-muted">공고 원문: “{program.quote}”</p>
      <div className="flex flex-wrap items-center gap-3">
        {program.applicationId && (
          <Link to={`/applications/${program.applicationId}`} className={btnPrimary}>신청 진행 보기</Link>
        )}
        <a href={program.sourceUrl} target="_blank" rel="noreferrer" className="font-semibold text-fx-info underline underline-offset-4">
          원문 공고 열기 ↗
        </a>
      </div>
    </Card>
  );
}
