import type { Session } from '@unpaidinterns/core';
import { describe, expect, it } from 'vitest';
import { statusCounts } from './status-counts.js';

const s = (sessionId: string, state: Session['state'], parentSessionId?: string): Session => ({
  agent: 'claude',
  sessionId,
  cwd: '/w',
  project: 'w',
  state,
  startedAt: 0,
  updatedAt: 0,
  ...(parentSessionId ? { parentSessionId } : {}),
});

describe('statusCounts', () => {
  it('counts needs-you (including errors), working and done', () => {
    const sessions = [s('a', 'waiting'), s('b', 'error'), s('c', 'running'), s('d', 'thinking'), s('e', 'done'), s('f', 'idle')];
    expect(statusCounts(sessions)).toEqual({ needsYou: 2, working: 2, done: 2 });
  });

  it('leaves interns out so each agent counts once', () => {
    expect(statusCounts([s('a', 'running'), s('a/i', 'running', 'a')])).toEqual({ needsYou: 0, working: 1, done: 0 });
  });

  it('is all zeros with no sessions', () => {
    expect(statusCounts([])).toEqual({ needsYou: 0, working: 0, done: 0 });
  });
});
