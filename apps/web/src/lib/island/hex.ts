/** Axial hex coordinates for pointy-top hexagons. */
export interface Hex {
  q: number;
  r: number;
}

const DIRECTIONS: readonly Hex[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export const hexKey = (hex: Hex): string => `${hex.q},${hex.r}`;

export function hexDistance(a: Hex, b: Hex): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

export function neighbors(hex: Hex): Hex[] {
  return DIRECTIONS.map((d) => ({ q: hex.q + d.q, r: hex.r + d.r }));
}

export function ring(radius: number): Hex[] {
  if (radius === 0) return [{ q: 0, r: 0 }];
  const result: Hex[] = [];
  const start = DIRECTIONS[4] as Hex;
  let hex: Hex = { q: start.q * radius, r: start.r * radius };
  for (const direction of DIRECTIONS) {
    for (let step = 0; step < radius; step += 1) {
      result.push(hex);
      hex = { q: hex.q + direction.q, r: hex.r + direction.r };
    }
  }
  return result;
}

export function spiral(radius: number): Hex[] {
  return Array.from({ length: radius + 1 }, (_, index) => ring(index)).flat();
}

/** World position on the ground plane, as [x, z], for hexagons with the given circumradius. */
export function hexToWorld(hex: Hex, size: number): [number, number] {
  return [size * Math.sqrt(3) * (hex.q + hex.r / 2), size * 1.5 * hex.r];
}
