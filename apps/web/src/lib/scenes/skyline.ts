/** Small deterministic random generator so the skyline looks the same on every load. */
export function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Tower {
  x: number;
  z: number;
  width: number;
  depth: number;
  /** Height of the roof relative to the office floor (0). Negative means below us. */
  top: number;
  tint: string;
}

const TINTS = ['#b9c6e4', '#c9d3ec', '#a9b8dc', '#d7dcef', '#bcc9df', '#e4dccf'];

/**
 * Towers in rings around the office, leaving a clear gap so none clip the room.
 * Nearby towers are mostly shorter than our floor so the view looks down on them.
 */
export function buildSkyline(count: number, seed = 7): Tower[] {
  const random = seeded(seed);
  return Array.from({ length: count }, (_, index) => {
    const ring = index / count;
    const angle = random() * Math.PI * 2;
    const distance = 22 + ring * 70 + random() * 8;
    const near = distance < 45;
    return {
      x: Math.cos(angle) * distance,
      z: Math.sin(angle) * distance,
      width: 4 + random() * 6,
      depth: 4 + random() * 6,
      top: near ? -20 + random() * 16 : -4 + random() * 34,
      tint: TINTS[Math.floor(random() * TINTS.length)] as string,
    };
  });
}

/** Towers standing behind the office building, getting taller the further back they are. */
export function buildBackdropTowers(count: number, seed = 17): Tower[] {
  const random = seeded(seed);
  return Array.from({ length: count }, (_, index) => {
    const depth = index / count;
    const distance = 16 + depth * 90 + random() * 10;
    return {
      x: (random() - 0.5) * (60 + depth * 160),
      z: -distance,
      width: 4 + random() * 6,
      depth: 4 + random() * 6,
      top: 4 + random() * (10 + depth * 30),
      tint: TINTS[Math.floor(random() * TINTS.length)] as string,
    };
  });
}
