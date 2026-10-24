import { useState } from 'react';
import type { Profile, ProfileOptions, ProfileView } from '../../api/types';
import { Badge } from '../common/Badge';
import { Card } from '../common/Card';
import { btnPrimary, btnSecondary, inputCls, labelCls } from '../common/ui';

function Select({ id, label, value, options, onChange }: { id: string; label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>{label}</label>
      <select id={id} required value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        <option value="" disabled>선택해 주세요</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export function ProfileForm({ profile, options, onSave }: { profile: ProfileView; options: ProfileOptions; onSave: (p: Profile) => Promise<void> }) {
  const [form, setForm] = useState<Profile>({
    name: profile.name, birthDate: profile.birthDate, grade: profile.grade, schoolClass: profile.schoolClass,
    disability: profile.disability, region: profile.region, incomeBracket: profile.incomeBracket, caregiver: { ...profile.caregiver },
  });
  const [busy, setBusy] = useState(false);
  const [noticeFile, setNoticeFile] = useState('');
  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => setForm((f) => ({ ...f, [key]: value }));
  const setCaregiver = (key: keyof Profile['caregiver'], value: string) => setForm((f) => ({ ...f, caregiver: { ...f.caregiver, [key]: value } }));

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onSave(form);
        } finally {
          setBusy(false);
        }
      }}
    >
      <Card className="space-y-4">
        <h2 className="text-lg font-bold text-fx-text">아이</h2>
        <div>
          <label htmlFor="pf-name" className={labelCls}>이름 (가명)</label>
          <input id="pf-name" required value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="pf-birth" className={labelCls}>생년월일</label>
          <input id="pf-birth" type="date" required value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} className={inputCls} />
          <p className="mt-1 text-sm text-fx-text-muted">지금 {profile.age}세예요</p>
        </div>
        <Select id="pf-grade" label="학년" value={form.grade} options={options.grades} onChange={(v) => set('grade', v)} />
        <div>
          <label htmlFor="pf-class" className={labelCls}>학급</label>
          <input id="pf-class" value={form.schoolClass} onChange={(e) => set('schoolClass', e.target.value)} className={inputCls} placeholder="예: 특수학급" />
        </div>
        <Select id="pf-dis" label="장애 유형" value={form.disability} options={options.disabilities} onChange={(v) => set('disability', v)} />
        <Select id="pf-region" label="사는 곳" value={form.region} options={options.regions} onChange={(v) => set('region', v)} />
        <Select id="pf-income" label="바우처 소득 구간" value={form.incomeBracket} options={options.incomes} onChange={(v) => set('incomeBracket', v)} />
        <div>
          <label htmlFor="pf-notice" className={labelCls}>결정통지서 사진으로 채우기</label>
          <input
            id="pf-notice"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setNoticeFile(file.name);
              set('incomeBracket', '2구간');
            }}
            className={inputCls}
          />
          {noticeFile && <p className="mt-1 text-sm text-fx-text-muted">{noticeFile} · 시연용으로 소득 구간만 예시 값으로 채웠어요</p>}
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-bold text-fx-text">보호자</h2>
        <div>
          <label htmlFor="pf-cg" className={labelCls}>이름</label>
          <input id="pf-cg" required value={form.caregiver.name} onChange={(e) => setCaregiver('name', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="pf-phone" className={labelCls}>연락처</label>
          <input id="pf-phone" type="tel" required value={form.caregiver.phone} onChange={(e) => setCaregiver('phone', e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="pf-email" className={labelCls}>이메일 (선택)</label>
          <input id="pf-email" type="email" value={form.caregiver.email} onChange={(e) => setCaregiver('email', e.target.value)} className={inputCls} />
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-bold text-fx-text">다니는 기관</h2>
        <ul className="flex flex-wrap gap-2">
          {profile.organizations.map((o) => <li key={o.id}><Badge tone="info">{o.name}</Badge></li>)}
        </ul>
      </Card>

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={busy} className={btnPrimary}>저장</button>
        <button type="reset" onClick={() => window.history.back()} className={btnSecondary}>닫기</button>
      </div>
    </form>
  );
}
