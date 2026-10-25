import { describe, expect, it } from 'vitest';
import { useIslandStore } from './island-store.js';

describe('useIslandStore', () => {
  it('focuses a district and clears any selected agent', () => {
    const store = useIslandStore.getState();
    store.select('s1', 'web');
    store.focus('api');
    expect(useIslandStore.getState()).toMatchObject({ focusProject: 'api', selectedSession: null });
  });

  it('selecting an agent also focuses its project', () => {
    useIslandStore.getState().select('s2', 'docs');
    expect(useIslandStore.getState()).toMatchObject({ focusProject: 'docs', selectedSession: 's2' });
  });

  it('keeps the focused project when selecting without one', () => {
    useIslandStore.getState().focus('web');
    useIslandStore.getState().select('s3');
    expect(useIslandStore.getState().focusProject).toBe('web');
  });

  it('tracks the hovered agent', () => {
    useIslandStore.getState().hover('s4');
    expect(useIslandStore.getState().hoveredSession).toBe('s4');
  });
});
