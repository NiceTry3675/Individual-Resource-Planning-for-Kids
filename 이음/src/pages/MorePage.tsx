import { Link } from 'react-router-dom';
import { Card } from '../components/common/Card';
import { Icon } from '../components/common/Icon';
import { PageTitle } from '../components/common/PageTitle';

const groups = [
  { title: '한 장 장부', items: [{ to: '/schedule', label: '시간표', note: '기관별 주간 치료 일정' }, { to: '/voucher', label: '바우처 장부', note: '이번 달 한도·사용·잔액' }] },
  { title: '맞춤 지원 레이더', items: [{ to: '/radar', label: '지원 레이더', note: '받을 수 있는 지원과 마감 달력' }, { to: '/documents', label: '서류함', note: '가진 서류와 유효기간' }] },
  { title: '아이 이력서', items: [{ to: '/resume', label: '아이 이력서', note: '기관별 목표와 처음 해낸 날' }] },
  { title: '그 밖에', items: [{ to: '/profile', label: '프로필', note: '아이와 보호자 정보' }, { to: '/summary', label: '지우의 한 장', note: '마무리 화면' }, { to: '/demo', label: '시연 제어', note: '장면 넣기와 초기화' }] },
];

export default function MorePage() {
  return (
    <div className="space-y-5">
      <PageTitle title="더보기" />
      {groups.map((g) => (
        <section key={g.title} aria-label={g.title} className="space-y-2">
          <h2 className="text-sm font-bold text-fx-text-muted">{g.title}</h2>
          <Card className="divide-y divide-fx-border p-0">
            {g.items.map((it) => (
              <Link key={it.to} to={it.to} className="flex min-h-16 items-center justify-between gap-3 px-5 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-fx-text">
                <span>
                  <span className="block text-base font-bold text-fx-text">{it.label}</span>
                  <span className="block text-sm text-fx-text-muted">{it.note}</span>
                </span>
                <Icon name="next" className="h-5 w-5 text-fx-text-muted" />
              </Link>
            ))}
          </Card>
        </section>
      ))}
    </div>
  );
}
