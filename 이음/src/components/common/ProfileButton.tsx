import { useId } from 'react';
import { Link } from 'react-router-dom';

export function ProfileButton() {
  const uid = useId();
  const bgId = `${uid}-bg`;
  const rimId = `${uid}-rim`;

  return (
    <Link
      to="/profile"
      aria-label="프로필"
      className="block h-12 w-12 shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fx-text"
    >
      <svg viewBox="0 0 100 100" className="block h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id={bgId} x1="0.2" y1="0" x2="0.5" y2="1">
            <stop offset="0" stopColor="#939ba6" />
            <stop offset="0.55" stopColor="#7f8594" />
            <stop offset="1" stopColor="#706e88" />
          </linearGradient>
          <linearGradient id={rimId} x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.15" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.35" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="49" fill={`url(#${bgId})`} />
        <circle cx="50" cy="50" r="48.4" fill="none" stroke={`url(#${rimId})`} strokeWidth="1.2" />
        <circle cx="50" cy="38.4" r="17.8" fill="#ffffff" />
        <path
          d="M 19.5 77 C 28 69, 40 65.2, 50 65.2 C 60 65.2, 72 69, 80.5 77 C 82 78.5, 81.5 80.5, 79.5 82 C 71 89, 60 92.4, 50 92.4 C 40 92.4, 29 89, 20.5 82 C 18.5 80.5, 18 78.5, 19.5 77 Z"
          fill="#ffffff"
        />
      </svg>
    </Link>
  );
}
