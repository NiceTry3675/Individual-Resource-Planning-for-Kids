export function Mascot({ className = 'h-20 w-20' }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="ieum-heart-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f0566a" />
          <stop offset="1" stopColor="#d65d8e" />
        </linearGradient>
      </defs>
      <path
        d="M60 106C24 80 10 58 10 38 10 22 22 12 36 12 47 12 56 18 60 27 64 18 73 12 84 12 98 12 110 22 110 38 110 58 96 80 60 106Z"
        fill="url(#ieum-heart-gradient)"
      />
    </svg>
  );
}
