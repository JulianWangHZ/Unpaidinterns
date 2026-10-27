import type { SurfacePixels } from './park-surfaces.js';
import { fractal, hash, normalsFrom, paving, rgb, shade } from './relief.js';

const SIZE = 128;

function put(target: Uint8Array, i: number, [r, g, b]: [number, number, number]) {
  target[i] = r;
  target[i + 1] = g;
  target[i + 2] = b;
  target[i + 3] = 255;
}

/** Square tiles in a grid with grout lines: the face is 1, falling to 0 in the joints. */
export function grid(x: number, y: number, size: number, tiles: number, grout = 0.1): { id: number; face: number } {
  const u = (x / size) * tiles;
  const v = (y / size) * tiles;
  const fu = u - Math.floor(u);
  const fv = v - Math.floor(v);
  const edge = Math.min(fu, 1 - fu, fv, 1 - fv);
  return { id: Math.floor(v) * tiles + Math.floor(u), face: Math.min(1, Math.max(0, edge / grout)) };
}

/** Pool mosaic: small glazed tiles in a few close blues, with white grout. */
export function mosaic(base: string, tiles = 16, size = SIZE): SurfacePixels {
  const color = new Uint8Array(size * size * 4);
  const roughness = new Uint8Array(size * size * 4);
  const height = new Float32Array(size * size);
  const tone = rgb(base);
  const grout = rgb('#e8f4f8');
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const p = y * size + x;
      const { id, face } = grid(x, y, size, tiles);
      const tile = shade(tone, 0.86 + hash(id, 3, 71) * 0.26);
      put(color, p * 4, [0, 1, 2].map((c) => Math.round((grout[c] as number) + ((tile[c] as number) - (grout[c] as number)) * face)) as [number, number, number]);
      const rough = Math.round(60 + (1 - face) * 150);
      put(roughness, p * 4, [rough, rough, rough]);
      height[p] = face;
    }
  }
  return { size, color, roughness, normal: normalsFrom({ size, data: height }, 2.5) };
}

/** Travertine deck: large pale stone slabs, each a slightly different cream, with fine pitting. */
export function travertine(base: string, size = SIZE): SurfacePixels {
  const pits = fractal(size, 81, 24, 2);
  const veins = fractal(size, 82, 3, 4);
  const color = new Uint8Array(size * size * 4);
  const roughness = new Uint8Array(size * size * 4);
  const height = new Float32Array(size * size);
  const stone = rgb(base);
  const joint = shade(stone, 0.8);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const p = y * size + x;
      const { id, face } = paving(x, y, size, 2, 2, 0.03);
      const pit = (pits.data[p] as number) < 0.28 ? 0.9 : 1;
      const vein = 0.96 + ((veins.data[p] as number) - 0.5) * 0.12;
      const surface = shade(stone, (0.95 + hash(id, 5, 83) * 0.08) * vein * pit);
      put(color, p * 4, [0, 1, 2].map((c) => Math.round((joint[c] as number) + ((surface[c] as number) - (joint[c] as number)) * face)) as [number, number, number]);
      const rough = Math.round(200 + (pit < 1 ? 40 : 0));
      put(roughness, p * 4, [rough, rough, rough]);
      height[p] = face * 0.8 + (pit < 1 ? 0 : 0.2);
    }
  }
  return { size, color, roughness, normal: normalsFrom({ size, data: height }, 2) };
}

/** Gentle ripples for a water surface: a normal map only, meant to be scrolled. */
export function ripples(size = SIZE): Uint8Array {
  const swell = fractal(size, 91, 4, 4);
  return normalsFrom(swell, 3.5);
}
