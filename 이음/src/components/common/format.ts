const won = new Intl.NumberFormat('ko-KR');

export const fmtWon = (n: number) => `${won.format(n)}원`;

export const ddayLabel = (d: number) => (d < 0 ? '지남' : d === 0 ? '오늘' : `D-${d}`);

export const monthLabel = (ym: string) => `${ym.slice(0, 4)}년 ${Number(ym.slice(5, 7))}월`;
