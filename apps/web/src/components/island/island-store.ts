import { create } from 'zustand';
import { SCENE_IDS, type SceneId } from '../../lib/scenes/types.js';

export const SCENE_STORAGE_KEY = 'unpaidinterns.scene';

export function readSavedScene(storage: Pick<Storage, 'getItem'>): SceneId {
  const saved = storage.getItem(SCENE_STORAGE_KEY);
  return (SCENE_IDS as readonly string[]).includes(saved ?? '') ? (saved as SceneId) : 'office';
}

interface IslandStore {
  scene: SceneId;
  selectedSession: string | null;
  hoveredSession: string | null;
  /** Screen point the session card is placed next to: the pointer while hovering, the click once pinned. */
  tipAt: { x: number; y: number } | null;
  setScene(scene: SceneId): void;
  select(sessionId: string | null, at?: { x: number; y: number }): void;
  hover(sessionId: string | null, at?: { x: number; y: number }): void;
}

export const useIslandStore = create<IslandStore>()((set) => ({
  scene: 'office',
  selectedSession: null,
  hoveredSession: null,
  tipAt: null,
  setScene: (scene) => set({ scene }),
  select: (sessionId, at) => set((state) => ({ selectedSession: sessionId, tipAt: at ?? state.tipAt })),
  // While a card is pinned, hovering others does not move it.
  hover: (sessionId, at) => set((state) => ({ hoveredSession: sessionId, tipAt: state.selectedSession || !at ? state.tipAt : at })),
}));
