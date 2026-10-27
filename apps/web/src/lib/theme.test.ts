import { describe, expect, it } from 'vitest';
import { loadTheme, saveTheme, THEME_KEY } from './theme.js';

const memory = (initial: Record<string, string> = {}) => {
  const data = new Map(Object.entries(initial));
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
};

describe('theme storage', () => {
  it('uses a saved choice', () => {
    expect(loadTheme(memory({ [THEME_KEY]: 'day' }), true)).toBe('day');
    expect(loadTheme(memory({ [THEME_KEY]: 'night' }), false)).toBe('night');
  });

  it('follows the system when nothing valid is saved', () => {
    expect(loadTheme(memory(), true)).toBe('night');
    expect(loadTheme(memory(), false)).toBe('day');
    expect(loadTheme(memory({ [THEME_KEY]: 'dusk' }), false)).toBe('day');
  });

  it('round-trips', () => {
    const storage = memory();
    saveTheme(storage, 'night');
    expect(loadTheme(storage, false)).toBe('night');
  });
});
