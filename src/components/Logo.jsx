export default function Logo({ size = 36 }) {
  return (
    <span className="logo" style={{ width: size, height: size }}>
      <svg viewBox="0 0 48 48" role="img" aria-label="Masroof logo">
        <defs>
          <linearGradient id="masroof-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-2)" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="48" height="48" rx="13" fill="url(#masroof-bg)" />
        <rect
          x="0.7"
          y="0.7"
          width="46.6"
          height="46.6"
          rx="12.3"
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1.4"
        />

        <g fill="rgba(255,255,255,0.95)">
          <rect x="12" y="27" width="6.4" height="9" rx="2.2" />
          <rect x="21" y="21" width="6.4" height="15" rx="2.2" />
        </g>
        <rect x="30" y="12" width="6.4" height="24" rx="2.2" fill="rgba(255,255,255,0.45)" />

        <path
          d="M12 22.5 L21 17 L30 20.5 L38.5 15.5"
          fill="none"
          stroke="var(--logo-mark)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M34.6 15.2 L39 15.4 L38.6 19.8"
          fill="none"
          stroke="var(--logo-mark)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <g className="logo-shine" transform="rotate(18 24 24)">
          <rect x="10" y="-14" width="9" height="76" fill="rgba(255,255,255,0.55)" />
        </g>
      </svg>
    </span>
  );
}
