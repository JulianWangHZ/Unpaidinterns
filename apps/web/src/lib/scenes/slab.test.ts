import { describe, expect, it } from 'vitest';
import { slabAround, type Rect } from './slab.js';

const full: Rect = { x1: -10, x2: 10, z1: -2, z2: 2 };
const area = (rects: Rect[]) => rects.reduce((sum, r) => sum + (r.x2 - r.x1) * (r.z2 - r.z1), 0);
const covers = (rects: Rect[], x: number, z: number) => rects.some((r) => x > r.x1 && x < r.x2 && z > r.z1 && z < r.z2);

describe('slabAround', () => {
  it('returns the whole slab when there is no hole', () => {
    expect(slabAround(full, null)).toEqual([full]);
  });

  it('leaves the hole uncovered and covers everything else', () => {
    const hole = { x1: 5, x2: 7.5, z1: -2, z2: -1 };
    const pieces = slabAround(full, hole);
    expect(area(pieces)).toBeCloseTo(area([full]) - 2.5 * 1);
    expect(covers(pieces, 6, -1.5)).toBe(false);
    expect(covers(pieces, 6, 0)).toBe(true);
    expect(covers(pieces, 4, -1.5)).toBe(true);
    expect(covers(pieces, 8, -1.5)).toBe(true);
  });

  it('never returns overlapping pieces', () => {
    const pieces = slabAround(full, { x1: -1, x2: 1, z1: -0.5, z2: 0.5 });
    expect(area(pieces)).toBeCloseTo(80 - 2);
    expect(pieces).toHaveLength(4);
  });

  it('ignores a hole outside the slab', () => {
    expect(slabAround(full, { x1: 20, x2: 21, z1: 0, z2: 1 })).toEqual([full]);
  });
});
