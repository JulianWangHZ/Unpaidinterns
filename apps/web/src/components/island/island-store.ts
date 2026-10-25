import { create } from 'zustand';

interface IslandStore {
  focusProject: string | null;
  selectedSession: string | null;
  hoveredSession: string | null;
  focus(project: string | null): void;
  select(sessionId: string | null, project?: string): void;
  hover(sessionId: string | null): void;
}

export const useIslandStore = create<IslandStore>()((set) => ({
  focusProject: null,
  selectedSession: null,
  hoveredSession: null,
  focus: (project) => set({ focusProject: project, selectedSession: null }),
  select: (sessionId, project) =>
    set((state) => ({ selectedSession: sessionId, focusProject: project ?? state.focusProject })),
  hover: (sessionId) => set({ hoveredSession: sessionId }),
}));
