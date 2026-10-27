/**
 * Pure helpers for procedural surface textures: tileable value noise, a few height patterns,
 * and conversion of a height field into a tangent-space normal map. Everything works on plain
 * arrays so it runs (and is tested) without a canvas or WebGL.
 */

/** Square grid of values in 0..1, row by row. */
export interface Field {
  size: number;
  data: Float32Array;
}

/** Deterministic 0..1 hash of a lattice point, so textures look the same on every load. */
export function hash(x: number, y: number, seed: number): number {
  let h = (seed * 2654435761 + x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Value noise that wraps every `period` cells, so the texture tiles without seams. */
export function tileNoise(x: number, y: number, period: number, seed: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = smooth(x - x0);
  const fy = smooth(y - y0);
  const at = (i: number, j: number) => hash(((i % period) + period) % period, ((j % period) + period) % period, seed);
  const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * fx;
  const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * fx;
  return top + (bottom - top) * fy;
}

/** Several octaves of tiling noise, normalised to 0..1. */
export function fractal(size: number, seed: number, cells = 4, octaves = 4): Field {
  const data = new Float32Array(size * size);
  let total = 0;
  for (let o = 0, amplitude = 1; o < octaves; o += 1, amplitude /= 2) total += amplitude;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let value = 0;
      for (let o = 0, amplitude = 1, period = cells; o < octaves; o += 1, amplitude /= 2, period *= 2) {
        value += tileNoise((x / size) * period, (y / size) * period, period, seed + o * 101) * amplitude;
      }
      data[y * size + x] = value / total;
    }
  }
  return { size, data };
}

export interface Tile {
  /** Which tile a pixel belongs to, for per-tile colour. */
  id: number;
  /** 1 on the tile face, falling to 0 in the grout. */
  face: number;
}

/**
 * Running-bond paving: rows of rectangular setts, every other row shifted by half a sett.
 * `columns` and `rows` count setts across the tile; `grout` is the joint width as a share of a sett.
 */
export function paving(x: number, y: number, size: number, columns: number, rows: number, grout = 0.08): Tile {
  const v = (y / size) * rows;
  const row = Math.floor(v);
  const u = (x / size) * columns + (row % 2 ? 0.5 : 0);
  const column = Math.floor(u) % columns;
  const edge = Math.min(u - Math.floor(u), 1 - (u - Math.floor(u)), (v - row) * (columns / rows), (1 - (v - row)) * (columns / rows));
  return { id: row * columns + column, face: Math.min(1, Math.max(0, edge / grout)) };
}

/** Parallel boards along x with dark seams between them. */
export function planks(y: number, size: number, boards: number, seam = 0.06): Tile {
  const v = (y / size) * boards;
  const board = Math.floor(v);
  const edge = Math.min(v - board, 1 - (v - board));
  return { id: board, face: Math.min(1, Math.max(0, edge / seam)) };
}

/**
 * Tangent-space normal map (RGBA bytes) from a height field, using central differences that wrap
 * round the edges. `strength` scales how deep the relief reads.
 */
export function normalsFrom(height: Field, strength: number): Uint8Array {
  const { size, data } = height;
  const out = new Uint8Array(size * size * 4);
  const at = (x: number, y: number) => data[((y + size) % size) * size + ((x + size) % size)] as number;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const inverse = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      const i = (y * size + x) * 4;
      out[i] = Math.round((-dx * inverse * 0.5 + 0.5) * 255);
      out[i + 1] = Math.round((-dy * inverse * 0.5 + 0.5) * 255);
      out[i + 2] = Math.round((inverse * 0.5 + 0.5) * 255);
      out[i + 3] = 255;
    }
  }
  return out;
}

/** Parse `#rrggbb` into 0..255 channels. */
export function rgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/** Scale a colour's brightness by `amount` (1 keeps it), clamped to bytes. */
export function shade([r, g, b]: [number, number, number], amount: number): [number, number, number] {
  const clamp = (c: number) => Math.max(0, Math.min(255, Math.round(c * amount)));
  return [clamp(r), clamp(g), clamp(b)];
}
