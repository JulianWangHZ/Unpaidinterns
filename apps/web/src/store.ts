import type { ServerMessage, Session } from '@unpaidinterns/core';
import { create } from 'zustand';
import type { ConnectionStatus } from './lib/socket.js';

export type SessionMap = Readonly<Record<string, Session>>;

export function reduceMessage(sessions: SessionMap, message: ServerMessage): SessionMap {
  switch (message.type) {
    case 'snapshot':
      return Object.fromEntries(message.sessions.map((session) => [session.sessionId, session]));
    case 'upsert':
      return { ...sessions, [message.session.sessionId]: message.session };
    case 'remove':
      return Object.fromEntries(Object.entries(sessions).filter(([id]) => id !== message.sessionId));
  }
}

interface SessionStore {
  sessions: SessionMap;
  status: ConnectionStatus;
  apply(message: ServerMessage): void;
  setStatus(status: ConnectionStatus): void;
}

export const useSessionStore = create<SessionStore>()((set) => ({
  sessions: {},
  status: 'connecting',
  apply: (message) => set((state) => ({ sessions: reduceMessage(state.sessions, message) })),
  setStatus: (status) => set({ status }),
}));
