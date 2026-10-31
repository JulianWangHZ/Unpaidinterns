import { describe, expect, it } from 'vitest';
import { ANIMAL_KINDS, grazeTarget, placeAnimals, ROAM } from './animals.js';
import { flatDistance } from './layout.js';
import { columnAt, generateWorld, groundAt } from './world.js';

describe('animals', () => {
  const world = generateWorld();
  const animals = placeAnimals(world);

  it('places every kind of animal, out of the village, on the ground', () => {
    expect(new Set(animals.map((a) => a.kind))).toEqual(new Set(ANIMAL_KINDS));
    for (const { home } of animals) {
      expect(flatDistance(home[0], home[2])).toBeGreaterThanOrEqual(1);
      expect(home[1]).toBeCloseTo(groundAt(world, home[0], home[2]));
    }
  });

  it('keeps wolves to the woods and every herd to its size', () => {
    const wolves = animals.filter((a) => a.kind === 'wolf');
    expect(wolves).toHaveLength(4);
    for (const { home } of wolves) {
      const [i, k] = columnAt(home[0], home[2]);
      expect(['forest', 'taiga']).toContain(world.biome[k * world.width + i]);
    }
  });

  it('places the same herd every time', () => {
    expect(placeAnimals(world)).toEqual(animals);
  });

  it('keeps each animal near home, wandering over time', () => {
    const animal = animals[0];
    if (!animal) throw new Error('no animals');
    const spots = Array.from({ length: 20 }, (_, s) => grazeTarget(animal, 0, s * 4));
    for (const [x, , z] of spots) expect(Math.hypot(x - animal.home[0], z - animal.home[2])).toBeLessThanOrEqual(ROAM + 1e-9);
    expect(new Set(spots.map((p) => p.join())).size).toBeGreaterThan(2);
  });
});
