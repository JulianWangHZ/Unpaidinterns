import { describe, expect, it } from 'vitest';
import { readSavedScene, SCENE_STORAGE_KEY, useIslandStore } from './island-store.js';

const storage = (value: string | null) => ({ getItem: (key: string) => (key === SCENE_STORAGE_KEY ? value : null) });

describe('readSavedScene', () => {
  it('returns a saved scene', () => {
    expect(readSavedScene(storage('pool'))).toBe('pool');
  });

  it.each([null, 'moon'])('falls back to the office for %s', (value) => {
    expect(readSavedScene(storage(value))).toBe('office');
  });
});

describe('useIslandStore', () => {
  it('switches scene, selects and hovers agents', () => {
    const store = useIslandStore.getState();
    store.setScene('park');
    store.select('s1');
    store.hover('s2');
    expect(useIslandStore.getState()).toMatchObject({ scene: 'park', selectedSession: 's1', hoveredSession: 's2' });
    store.select(null);
    expect(useIslandStore.getState().selectedSession).toBeNull();
  });
});
