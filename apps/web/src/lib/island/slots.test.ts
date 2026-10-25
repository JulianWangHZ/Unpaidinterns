import { describe, expect, it } from 'vitest';
import { loadSlots, saveSlots, SLOTS_STORAGE_KEY } from './slots.js';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    data,
  };
}

describe('district slots storage', () => {
  it('round-trips saved slots', () => {
    const storage = memoryStorage();
    saveSlots(storage, { web: 0, api: 1 });
    expect(loadSlots(storage)).toEqual({ web: 0, api: 1 });
  });

  it.each(['not json', '[]', '{"web":"zero"}', '{"web":-1}'])('ignores bad saved value %s', (raw) => {
    expect(loadSlots(memoryStorage({ [SLOTS_STORAGE_KEY]: raw }))).toEqual({});
  });

  it('returns an empty map when nothing is saved', () => {
    expect(loadSlots(memoryStorage())).toEqual({});
  });
});
