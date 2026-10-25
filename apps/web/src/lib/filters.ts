import type { AgentKind, Session, Task } from '@unpaidinterns/core';
import { create } from 'zustand';

export interface TaskFilters {
  project: string;
  hiddenAgents: AgentKind[];
  query: string;
}

export function filterTasks(
  tasks: readonly Task[],
  sessions: Readonly<Record<string, Session>>,
  filters: TaskFilters,
): Task[] {
  const query = filters.query.trim().toLowerCase();
  return tasks.filter((task) => {
    if (filters.project && task.project !== filters.project) return false;
    if (query && !`${task.title}\n${task.note}`.toLowerCase().includes(query)) return false;
    const agents = task.sessionIds.flatMap((id) => (sessions[id] ? [sessions[id].agent] : []));
    return agents.length === 0 || !agents.every((agent) => filters.hiddenAgents.includes(agent));
  });
}

export function projectsOf(tasks: readonly Task[], sessions: Readonly<Record<string, Session>>): string[] {
  const names = [...tasks.map((task) => task.project), ...Object.values(sessions).map((s) => s.project)];
  return [...new Set(names.filter((name) => name.length > 0))].sort();
}

interface FilterStore extends TaskFilters {
  setProject(project: string): void;
  setQuery(query: string): void;
  toggleAgent(agent: AgentKind): void;
}

export const useFilterStore = create<FilterStore>()((set) => ({
  project: '',
  hiddenAgents: [],
  query: '',
  setProject: (project) => set({ project }),
  setQuery: (query) => set({ query }),
  toggleAgent: (agent) =>
    set((state) => ({
      hiddenAgents: state.hiddenAgents.includes(agent)
        ? state.hiddenAgents.filter((value) => value !== agent)
        : [...state.hiddenAgents, agent],
    })),
}));
