import { fractal, hash, normalsFrom, paving, planks, rgb, shade } from './relief.js';

/** Colour, roughness and normal pixels for one surface, ready to upload as data textures. */
export interface SurfacePixels {
  size: number;
  color: Uint8Array;
  roughness: Uint8Array;
  normal: Uint8Array;
}

const SIZE = 128;

function blank(size: number) {
  return { color: new Uint8Array(size * size * 4), roughness: new Uint8Array(size * size * 4) };
}

function put(target: Uint8Array, i: number, [r, g, b]: [number, number, number]) {
  target[i] = r;
  target[i + 1] = g;
  target[i + 2] = b;
  target[i + 3] = 255;
}

/** Lawn: patchy light and dark greens with fine blade speckle and a soft lumpy relief. */
export function grass(base: string, size = SIZE): SurfacePixels {
  const patches = fractal(size, 11, 3, 4);
  const blades = fractal(size, 12, 32, 2);
  const { color, roughness } = blank(size);
  const height = new Float32Array(size * size);
  const tone = rgb(base);
  for (let p = 0; p < size * size; p += 1) {
    const patch = patches.data[p] as number;
    const blade = blades.data[p] as number;
    put(color, p * 4, shade(tone, 0.82 + patch * 0.3 + (blade - 0.5) * 0.18));
    put(roughness, p * 4, [235, 235, 235]);
    height[p] = patch * 0.4 + blade * 0.6;
  }
  return { size, color, roughness, normal: normalsFrom({ size, data: height }, 2.2) };
}

/** Paved plaza: running-bond setts, each a slightly different tone, with recessed grout. */
export function setts(base: string, grout: string, size = SIZE): SurfacePixels {
  const wear = fractal(size, 21, 4, 3);
  const { color, roughness } = blank(size);
  const height = new Float32Array(size * size);
  const stone = rgb(base);
  const joint = rgb(grout);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const p = y * size + x;
      const { id, face } = paving(x, y, size, 4, 8);
      const tint = 0.9 + hash(id, 0, 31) * 0.18 + ((wear.data[p] as number) - 0.5) * 0.12;
      const surface = shade(stone, tint);
      const mixed: [number, number, number] = [0, 1, 2].map((c) => Math.round((joint[c] as number) + ((surface[c] as number) - (joint[c] as number)) * face)) as [number, number, number];
      put(color, p * 4, mixed);
      const rough = Math.round(200 + (1 - face) * 40 + ((wear.data[p] as number) - 0.5) * 30);
      put(roughness, p * 4, [rough, rough, rough]);
      height[p] = face * 0.8 + (wear.data[p] as number) * 0.2;
    }
  }
  return { size, color, roughness, normal: normalsFrom({ size, data: height }, 3) };
}

/** Timber boards running along x: grain streaks, per-board tone and dark seams. */
export function boards(base: string, count = 6, size = SIZE): SurfacePixels {
  const grain = fractal(size, 41, 2, 3);
  const { color, roughness } = blank(size);
  const height = new Float32Array(size * size);
  const wood = rgb(base);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const p = y * size + x;
      const { id, face } = planks(y, size, count);
      const streak = Math.sin((x / size) * Math.PI * 2 * 3 + (grain.data[p] as number) * 9 + id * 1.7) * 0.5 + 0.5;
      const tint = (0.88 + hash(id, 1, 43) * 0.2 + streak * 0.08) * (0.55 + face * 0.45);
      put(color, p * 4, shade(wood, tint));
      const rough = Math.round(170 + streak * 40);
      put(roughness, p * 4, [rough, rough, rough]);
      height[p] = face * 0.7 + streak * 0.3;
    }
  }
  return { size, color, roughness, normal: normalsFrom({ size, data: height }, 2) };
}

/** Painted steel: flat colour with faint mottling, and a roughness that varies like worn paint. */
export function paint(base: string, size = 64): SurfacePixels {
  const mottle = fractal(size, 61, 4, 3);
  const { color, roughness } = blank(size);
  const tone = rgb(base);
  for (let p = 0; p < size * size; p += 1) {
    const m = mottle.data[p] as number;
    put(color, p * 4, shade(tone, 0.96 + m * 0.08));
    const rough = Math.round(90 + m * 70);
    put(roughness, p * 4, [rough, rough, rough]);
  }
  return { size, color, roughness, normal: normalsFrom(mottle, 0.4) };
}
