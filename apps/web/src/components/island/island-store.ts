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
  setScene(scene: SceneId): void;
  select(sessionId: string | null): void;
  hover(sessionId: string | null): void;
}

export const useIslandStore = create<IslandStore>()((set) => ({
  scene: 'office',
  selectedSession: null,
  hoveredSession: null,
  setScene: (scene) => set({ scene }),
  select: (sessionId) => set({ selectedSession: sessionId }),
  hover: (sessionId) => set({ hoveredSession: sessionId }),
}));
