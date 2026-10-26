import { describe, expect, it } from 'vitest';
import { buildBackdropTowers, buildSkyline, seeded } from './skyline.js';

describe('seeded', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = seeded(3);
    const b = seeded(3);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('stays within [0, 1)', () => {
    const next = seeded(9);
    for (let i = 0; i < 200; i += 1) {
      const value = next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('buildSkyline', () => {
  const towers = buildSkyline(60);

  it('is stable between calls', () => {
    expect(buildSkyline(60)).toEqual(towers);
  });

  it('keeps every tower clear of the office floor', () => {
    for (const tower of towers) {
      const nearestEdge = Math.hypot(tower.x, tower.z) - Math.hypot(tower.width, tower.depth) / 2;
      expect(nearestEdge).toBeGreaterThan(14);
    }
  });

  it('keeps nearby towers below eye level so the view looks down on the city', () => {
    const near = towers.filter((tower) => Math.hypot(tower.x, tower.z) < 45);
    expect(near.length).toBeGreaterThan(0);
    expect(near.every((tower) => tower.top < 3)).toBe(true);
  });
});

describe('buildBackdropTowers', () => {
  const towers = buildBackdropTowers(50);

  it('is stable between calls', () => {
    expect(buildBackdropTowers(50)).toEqual(towers);
  });

  it('keeps every tower behind the office building', () => {
    expect(towers.every((tower) => tower.z + tower.depth / 2 < -12)).toBe(true);
  });

  it('stands on the street and rises above it', () => {
    expect(towers.every((tower) => tower.top > 3)).toBe(true);
  });
});
