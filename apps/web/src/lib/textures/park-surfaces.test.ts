import { describe, expect, it } from 'vitest';
import { boards, grass, paint, setts, type SurfacePixels } from './park-surfaces.js';

const average = (pixels: Uint8Array, channel: number) => {
  let sum = 0;
  for (let i = channel; i < pixels.length; i += 4) sum += pixels[i] as number;
  return sum / (pixels.length / 4);
};

function checkShape(surface: SurfacePixels) {
  const bytes = surface.size * surface.size * 4;
  expect(surface.color).toHaveLength(bytes);
  expect(surface.roughness).toHaveLength(bytes);
  expect(surface.normal).toHaveLength(bytes);
  // Normal maps point mostly up (blue high).
  expect(average(surface.normal, 2)).toBeGreaterThan(200);
}

describe('park surfaces', () => {
  it.each([
    ['grass', () => grass('#a9dc95', 32)],
    ['setts', () => setts('#efe2cc', '#bfae90', 32)],
    ['boards', () => boards('#c99d76', 4, 32)],
    ['paint', () => paint('#e9ecf5', 16)],
  ])('builds full colour, roughness and normal maps for %s', (_name, make) => {
    checkShape(make());
  });

  it('keeps grass green on average', () => {
    const lawn = grass('#a9dc95', 32);
    expect(average(lawn.color, 1)).toBeGreaterThan(average(lawn.color, 0));
    expect(average(lawn.color, 1)).toBeGreaterThan(average(lawn.color, 2));
  });

  it('varies the tone between setts and darkens the grout', () => {
    const stone = setts('#efe2cc', '#8a7a60', 64);
    const reds = new Set<number>();
    for (let i = 0; i < stone.color.length; i += 4) reds.add(stone.color[i] as number);
    expect(reds.size).toBeGreaterThan(20);
    // Pixel (0, 0) sits on a joint.
    expect(stone.color[0]).toBeLessThan(200);
  });

  it('darkens the seams between boards', () => {
    const deck = boards('#c99d76', 4, 64);
    const seam = deck.color[0] as number;
    const face = deck.color[(8 * 64 + 10) * 4] as number;
    expect(seam).toBeLessThan(face);
  });

  it('is the same every time', () => {
    expect(grass('#a9dc95', 16).color).toEqual(grass('#a9dc95', 16).color);
  });
});
