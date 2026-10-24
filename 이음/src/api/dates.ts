const DAY_MS = 86400000;

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const toMs = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
const toIso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export const addDays = (iso: string, n: number) => toIso(toMs(iso) + n * DAY_MS);
export const diffDays = (a: string, b: string) => Math.round((toMs(a) - toMs(b)) / DAY_MS);
export const weekdayIndex = (iso: string) => new Date(toMs(iso)).getUTCDay();
export const startOfWeek = (iso: string) => addDays(iso, -((weekdayIndex(iso) + 6) % 7));
export const monthDay = (iso: string) => `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;
export const shortDay = (iso: string) => `${monthDay(iso)}(${WEEKDAYS[weekdayIndex(iso)]})`;
export const koDate = (iso: string) =>
  `${Number(iso.slice(5, 7))}월 ${Number(iso.slice(8, 10))}일(${WEEKDAYS[weekdayIndex(iso)]})`;
export const daysInMonth = (ym: string) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
};
export const addMinutes = (hhmm: string, minutes: number) => {
  const [h, m] = hhmm.split(':').map(Number);
  const t = h * 60 + m + minutes;
  return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};
export const ageOn = (birth: string, on: string) => {
  let age = Number(on.slice(0, 4)) - Number(birth.slice(0, 4));
  if (on.slice(5) < birth.slice(5)) age -= 1;
  return age;
};
