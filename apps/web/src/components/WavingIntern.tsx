/** The same character that waves on the island, peeking over a card that needs the user. */
export function WavingIntern() {
  return (
    <svg className="waver" width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
      <defs>
        <radialGradient id="intern-head" cx=".35" cy=".3">
          <stop offset="0" stopColor="#fff0e0" />
          <stop offset="1" stopColor="#f2c9a0" />
        </radialGradient>
        <radialGradient id="intern-body" cx=".35" cy=".3">
          <stop offset="0" stopColor="#f4a68f" />
          <stop offset="1" stopColor="#e07a5f" />
        </radialGradient>
      </defs>
      <circle cx="13" cy="9" r="6" fill="url(#intern-head)" />
      <rect x="7" y="15" width="12" height="13" rx="6" fill="url(#intern-body)" />
      <path className="waver-arm" d="M19 17 L25 9" stroke="#f2c9a0" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
}
