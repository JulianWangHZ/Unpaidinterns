/** Clay-style gear: two-step gradient lit from the top-left, with a soft inner hub. */
export function GearIcon({ size = 20 }: { size?: number }) {
  const teeth = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <radialGradient id="gear-body" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#a9afe8" />
          <stop offset="1" stopColor="#5b5f97" />
        </radialGradient>
        <radialGradient id="gear-hub" cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e3e6ff" />
        </radialGradient>
      </defs>
      {teeth.map((deg) => (
        <rect key={deg} x="10.2" y="1.6" width="3.6" height="5" rx="1.2" fill="url(#gear-body)" transform={`rotate(${deg} 12 12)`} />
      ))}
      <circle cx="12" cy="12" r="7.4" fill="url(#gear-body)" />
      <circle cx="12" cy="12" r="3.1" fill="url(#gear-hub)" />
    </svg>
  );
}

/** Clay-style picture-in-picture glyph: a screen with a raised inner window. */
export function PipIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2.5" y="4.5" width="19" height="15" rx="3" fill="#e3e6ff" stroke="#5b5f97" strokeWidth="1.6" />
      <rect x="11.5" y="11" width="8" height="6.5" rx="1.6" fill="#5b5f97" />
    </svg>
  );
}
