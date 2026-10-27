import { describe, expect, it } from 'vitest';
import { grid, mosaic, ripples, travertine } from './pool-surfaces.js';

const average = (pixels: Uint8Array, channel: number) => {
  let sum = 0;
  for (let i = channel; i < pixels.length; i += 4) sum += pixels[i] as number;
  return sum / (pixels.length / 4);
};

describe('grid', () => {
  it('drops into grout at a joint and is full in the middle of a tile', () => {
    expect(grid(0, 4, 64, 8).face).toBe(0);
    expect(grid(4, 4, 64, 8).face).toBe(1);
    expect(grid(4, 4, 64, 8).id).not.toBe(grid(12, 4, 64, 8).id);
  });
});

describe('pool surfaces', () => {
  it('builds blue mosaic with pale grout', () => {
    const tiles = mosaic('#3fa9d8', 8, 32);
    expect(tiles.color).toHaveLength(32 * 32 * 4);
    expect(average(tiles.color, 2)).toBeGreaterThan(average(tiles.color, 0));
    expect(tiles.color[0]).toBeGreaterThan(200);
    expect(average(tiles.normal, 2)).toBeGreaterThan(200);
  });

  it('builds cream travertine with varied slabs', () => {
    const deck = travertine('#efe6d6', 32);
    const reds = new Set<number>();
    for (let i = 0; i < deck.color.length; i += 4) reds.add(deck.color[i] as number);
    expect(reds.size).toBeGreaterThan(8);
    expect(average(deck.roughness, 0)).toBeGreaterThan(190);
  });

  it('makes a ripple normal map that mostly points up', () => {
    const map = ripples(32);
    expect(map).toHaveLength(32 * 32 * 4);
    expect(average(map, 2)).toBeGreaterThan(200);
  });
});
