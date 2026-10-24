const paths = {
  home: 'M3 11l9-8 9 8M5 10v10h14V10',
  inbox: 'M4 13l2-8h12l2 8M4 13v6h16v-6M4 13h5l1 2h4l1-2h5',
  check: 'M12 22a10 10 0 100-20 10 10 0 000 20zM8 12l3 3 5-6',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  back: 'M15 5l-7 7 7 7',
  next: 'M9 5l7 7-7 7',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6',
  file: 'M7 3h7l5 5v13H7zM14 3v5h5',
  wallet: 'M3 7h16a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2zM3 7l2-3h12M16 14h2',
  radar: 'M12 21a9 9 0 119-9M12 16a4 4 0 114-4M12 12l6-6',
  book: 'M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3zM5 17a3 3 0 013-3h11',
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, className = 'h-6 w-6' }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}
