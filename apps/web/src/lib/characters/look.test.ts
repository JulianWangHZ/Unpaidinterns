import { describe, expect, it } from 'vitest';
import { FEMALE_HAIR, HAIR_STYLES, lookFor, MALE_HAIR, shade } from './look.js';

describe('lookFor', () => {
  it('gives the same session the same look every time', () => {
    expect(lookFor('session-a')).toEqual(lookFor('session-a'));
  });

  it('varies looks across sessions', () => {
    const looks = Array.from({ length: 80 }, (_, i) => lookFor(`session-${i}`));
    expect(new Set(looks.map((l) => l.hair)).size).toBe(HAIR_STYLES.length);
    expect(new Set(looks.map((l) => l.skin)).size).toBeGreaterThan(3);
    expect(new Set(looks.map((l) => l.hairColor)).size).toBeGreaterThan(3);
  });

  it('uses valid hex colours', () => {
    const look = lookFor('x');
    for (const colour of [look.skin, look.hairColor, look.pants, look.shoes]) {
      expect(colour).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe('shade', () => {
  it('darkens and lightens a colour', () => {
    expect(shade('#808080', -0.5)).toBe('#404040');
    expect(shade('#808080', 0.5)).toBe('#c0c0c0');
  });

  it('clamps at black and white', () => {
    expect(shade('#ffffff', 0.5)).toBe('#ffffff');
    expect(shade('#000000', -0.5)).toBe('#000000');
  });
});

describe('gender', () => {
  const looks = Array.from({ length: 200 }, (_, i) => lookFor(`agent-${i}`));

  it('makes roughly half the agents women', () => {
    const women = looks.filter((l) => l.gender === 'female').length;
    expect(women).toBeGreaterThan(70);
    expect(women).toBeLessThan(130);
  });

  it('picks hair from the matching set', () => {
    for (const look of looks) {
      const allowed: readonly string[] = look.gender === 'female' ? FEMALE_HAIR : MALE_HAIR;
      expect(allowed).toContain(look.hair);
    }
  });

  it('puts skirts only on women, and only on some', () => {
    expect(looks.some((l) => l.skirt && l.gender === 'male')).toBe(false);
    const women = looks.filter((l) => l.gender === 'female');
    const skirts = women.filter((l) => l.skirt).length;
    expect(skirts).toBeGreaterThan(0);
    expect(skirts).toBeLessThan(women.length);
  });
});
