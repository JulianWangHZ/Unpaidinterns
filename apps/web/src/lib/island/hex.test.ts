import { describe, expect, it } from 'vitest';
import { hexDistance, hexKey, hexToWorld, neighbors, ring, spiral } from './hex.js';

describe('hex math', () => {
  it('measures distance in steps', () => {
    expect(hexDistance({ q: 0, r: 0 }, { q: 2, r: -1 })).toBe(2);
    expect(hexDistance({ q: 1, r: 1 }, { q: 1, r: 1 })).toBe(0);
  });

  it('lists six neighbours', () => {
    const around = neighbors({ q: 0, r: 0 });
    expect(around).toHaveLength(6);
    expect(around.every((hex) => hexDistance(hex, { q: 0, r: 0 }) === 1)).toBe(true);
  });

  it('builds rings with 6 * radius tiles at that distance', () => {
    expect(ring(0)).toEqual([{ q: 0, r: 0 }]);
    const third = ring(3);
    expect(third).toHaveLength(18);
    expect(new Set(third.map(hexKey)).size).toBe(18);
    expect(third.every((hex) => hexDistance(hex, { q: 0, r: 0 }) === 3)).toBe(true);
  });

  it('builds a spiral out to a radius', () => {
    expect(spiral(2)).toHaveLength(19);
  });

  it('places neighbours one tile width apart', () => {
    const [x1, z1] = hexToWorld({ q: 0, r: 0 }, 1);
    const [x2, z2] = hexToWorld({ q: 1, r: 0 }, 1);
    expect(Math.hypot(x2 - x1, z2 - z1)).toBeCloseTo(Math.sqrt(3));
  });
});
