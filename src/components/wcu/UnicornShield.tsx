export function UnicornShield({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 140" className={className} role="img" aria-label="World Crime Unicorn emblem">
      <defs>
        <linearGradient id="wcu-shield" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--neon)" />
          <stop offset="55%" stopColor="var(--electric)" />
          <stop offset="100%" stopColor="var(--violet)" />
        </linearGradient>
        <linearGradient id="wcu-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.99 0.01 250)" />
          <stop offset="100%" stopColor="oklch(0.86 0.05 230)" />
        </linearGradient>
      </defs>
      <path
        d="M60 4 L112 24 V72 c0 30-22 52-52 64 C30 124 8 102 8 72 V24 Z"
        fill="oklch(0.18 0.035 265)"
        stroke="url(#wcu-shield)"
        strokeWidth="4"
      />
      <path
        d="M60 12 L104 29 V71 c0 25-18 44-44 55 C34 115 16 96 16 71 V29 Z"
        fill="none"
        stroke="var(--electric)"
        strokeOpacity="0.35"
        strokeWidth="2"
      />
      {/* unicorn horn */}
      <path d="M74 26 L58 50 L66 52 Z" fill="var(--neon)" />
      {/* unicorn head */}
      <path
        d="M44 46 c10-4 22-2 28 6 l12 16 c6 8 4 18-4 24 l-6 4 -4-8 -8 8 -6-8 -10 10 c-10-8-14-22-10-34 c2-8 4-14 8-18 z"
        fill="url(#wcu-body)"
      />
      {/* mane */}
      <path
        d="M44 46 c-8 6-12 16-12 26 c0 8 3 16 8 22 c-2-12 0-22 6-30 c-4-8-4-13-2-18 z"
        fill="var(--electric)"
        fillOpacity="0.85"
      />
      <circle cx="66" cy="66" r="3.2" fill="oklch(0.2 0.04 265)" />
    </svg>
  );
}
