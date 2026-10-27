const TEETH = 8;
const OUTER = 9.6;
const INNER = 7.3;
const TOOTH = 0.19;

/** Outline of an eight-tooth gear on a 24px grid: each tooth is a short flat-topped step out from the rim. */
function gearPath(): string {
  const points: string[] = [];
  for (let i = 0; i < TEETH; i += 1) {
    const centre = (i / TEETH) * Math.PI * 2;
    const step = Math.PI / TEETH;
    for (const [angle, radius] of [
      [centre - step + 0.12, INNER],
      [centre - TOOTH, OUTER],
      [centre + TOOTH, OUTER],
      [centre + step - 0.12, INNER],
    ] as const) {
      points.push(`${(12 + Math.cos(angle) * radius).toFixed(2)} ${(12 + Math.sin(angle) * radius).toFixed(2)}`);
    }
  }
  return `M${points.join('L')}Z`;
}

const GEAR = gearPath();

/** Line-style settings icon; inherits the text colour of its button. */
export function GearIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinejoin="round" aria-hidden="true">
      <path d={GEAR} />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** Line-style picture-in-picture icon: a screen with a smaller window in its corner. */
export function PipIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <rect x="12" y="11.5" width="6.5" height="5" rx="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
