import { agentKindSchema, type AgentKind, type Session, type Task } from '@unpaidinterns/core';
import { z } from 'zod';
import { create } from 'zustand';
import type { Theme } from './theme.js';

export const HIDDEN_AGENTS_KEY = 'unpaidinterns.hiddenAgents';
const hiddenSchema = z.array(agentKindSchema);

type SessionMap = Readonly<Record<string, Session>>;

export function visibleSessions(sessions: SessionMap, hidden: readonly AgentKind[]): SessionMap {
  if (hidden.length === 0) return sessions;
  return Object.fromEntries(Object.entries(sessions).filter(([, session]) => !hidden.includes(session.agent)));
}

/** Cards stay visible unless every live session bound to them belongs to a hidden agent. */
export function tasksForAgents(tasks: readonly Task[], sessions: SessionMap, hidden: readonly AgentKind[]): Task[] {
  return tasks.filter((task) => {
    const agents = task.sessionIds.flatMap((id) => (sessions[id] ? [sessions[id].agent] : []));
    return agents.length === 0 || !agents.every((agent) => hidden.includes(agent));
  });
}

export function loadHiddenAgents(storage: Pick<Storage, 'getItem'>): AgentKind[] {
  try {
    const parsed = hiddenSchema.safeParse(JSON.parse(storage.getItem(HIDDEN_AGENTS_KEY) ?? '[]'));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}

export function saveHiddenAgents(storage: Pick<Storage, 'setItem'>, hidden: readonly AgentKind[]): void {
  storage.setItem(HIDDEN_AGENTS_KEY, JSON.stringify(hidden));
}

interface SettingsStore {
  hiddenAgents: AgentKind[];
  toggleAgent(agent: AgentKind): void;
  setHiddenAgents(hidden: AgentKind[]): void;
  theme: Theme;
  setTheme(theme: Theme): void;
}

export const useSettingsStore = create<SettingsStore>()((set) => ({
  hiddenAgents: [],
  toggleAgent: (agent) =>
    set((state) => ({
      hiddenAgents: state.hiddenAgents.includes(agent)
        ? state.hiddenAgents.filter((value) => value !== agent)
        : [...state.hiddenAgents, agent],
    })),
  setHiddenAgents: (hiddenAgents) => set({ hiddenAgents }),
  theme: 'day',
  setTheme: (theme) => set({ theme }),
}));
