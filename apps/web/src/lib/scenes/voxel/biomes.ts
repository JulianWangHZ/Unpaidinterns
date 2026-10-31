import { flatDistance } from './layout.js';
import { fbm, ridged, smoothstep } from './noise.js';

export const BIOMES = ['mountains', 'mesa', 'desert', 'ocean', 'plains', 'forest', 'taiga'] as const;
export type Biome = (typeof BIOMES)[number];

/**
 * Each biome owns a direction round the village, as a compass angle: 0 is straight back, a
 * quarter turn is to the right. The camera looks in from the front right, so the tall biomes sit
 * behind the village and the low ones in front, where they cannot hide it.
 */
const BEARING: Readonly<Record<Biome, number>> = {
  mountains: 0,
  mesa: 0.95,
  desert: 2.05,
  ocean: Math.PI,
  plains: -2.3,
  forest: -1.65,
  taiga: -0.8,
};

/** How wide each biome spreads, in radians; neighbours blend across the overlap. The sea gets the whole front. */
const SPREAD: Readonly<Record<Biome, number>> = { mountains: 0.55, mesa: 0.45, desert: 0.45, ocean: 1.0, plains: 0.45, forest: 0.5, taiga: 0.5 };
/** How far the ground takes to climb from the flat village up to the wild heights. */
const RAMP = 6;

function turn(a: number, b: number): number {
  const d = Math.abs(a - b) % (Math.PI * 2);
  return d > Math.PI ? Math.PI * 2 - d : d;
}

/** Biome blend at a point: weights that sum to 1, wobbled by noise so borders wander. */
export function biomeWeights(x: number, z: number, seed: number): Record<Biome, number> {
  const bearing = Math.atan2(x, -z) + (fbm(x / 22, z / 22, seed + 7, 2) - 0.5) * 1.4;
  const raw = BIOMES.map((b) => Math.exp(-((turn(bearing, BEARING[b]) / SPREAD[b]) ** 2)));
  const total = raw.reduce((sum, w) => sum + w, 0);
  return Object.fromEntries(BIOMES.map((b, i) => [b, (raw[i] as number) / total])) as Record<Biome, number>;
}

export function dominant(weights: Record<Biome, number>): Biome {
  return BIOMES.reduce((best, b) => (weights[b] > weights[best] ? b : best), BIOMES[0] as Biome);
}

/** Cliffs between level steps, as on a mesa: mostly flat shelves joined by short steep rises. */
function terrace(height: number, step: number): number {
  const t = height / step;
  const floor = Math.floor(t);
  return (floor + smoothstep(0.7, 1, t - floor)) * step;
}

/** Ground height in blocks for one biome on its own, before blending. */
export function biomeHeight(biome: Biome, x: number, z: number, seed: number): number {
  const rolling = fbm(x / 14, z / 14, seed);
  // The far wilds rise higher than the ground near the village.
  const reach = smoothstep(8, 26, Math.hypot(x, z));
  switch (biome) {
    case 'mountains':
      return 5 + 46 * ridged(x / 16, z / 16, seed + 3) ** 1.2 * (0.25 + reach * 0.75);
    case 'mesa':
      return terrace(4 + 22 * fbm(x / 12, z / 12, seed + 5) * (0.4 + reach * 0.6), 4);
    case 'desert': {
      const dune = Math.sin(x * 0.45 + z * 0.2 + rolling * 4) * 0.5 + 0.5;
      return 1 + 2 * rolling + 2.5 * dune;
    }
    case 'ocean':
      return -8 + 4 * rolling;
    case 'plains':
      return 1 + 3 * rolling;
    case 'forest':
      return 2 + 7 * rolling;
    case 'taiga':
      return 3 + 14 * rolling * (0.5 + reach * 0.5);
  }
}

/** Ground height in blocks at a point: 0 on the village flats, then the blended biomes beyond. */
export function groundHeight(x: number, z: number, seed: number): number {
  const weights = biomeWeights(x, z, seed);
  const wild = BIOMES.reduce((sum, b) => sum + (weights[b] > 0.01 ? weights[b] * biomeHeight(b, x, z, seed) : 0), 0);
  // `|| 0` turns the -0 a sunken biome rounds to on the flats into a plain 0.
  return Math.round(wild * smoothstep(0, RAMP, flatDistance(x, z))) || 0;
}
