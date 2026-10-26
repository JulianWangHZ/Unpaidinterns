import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEMO_SESSION_COUNT, startDemo } from '../src/demo.js';
import { SessionHub } from '../src/session-hub.js';

afterEach(() => {
  vi.useRealTimers();
});

describe('startDemo', () => {
  it('publishes every demo session immediately with one session per state', () => {
    const hub = new SessionHub();
    const stop = startDemo(hub, { now: () => 1000 });
    const sessions = hub.sessions();
    expect(sessions).toHaveLength(DEMO_SESSION_COUNT);
    expect(new Set(sessions.map((s) => s.state))).toEqual(
      new Set(['thinking', 'running', 'writing', 'waiting', 'done']),
    );
    stop();
  });

  it('includes a subagent with a parent', () => {
    const hub = new SessionHub();
    const stop = startDemo(hub, { now: () => 1000 });
    expect(hub.sessions().some((s) => s.parentSessionId === 'demo-1')).toBe(true);
    stop();
  });

  it('advances states on each tick and stops cleanly', () => {
    vi.useFakeTimers();
    const hub = new SessionHub();
    let clock = 1000;
    const stop = startDemo(hub, { intervalMs: 100, now: () => clock });
    const before = hub.sessions().find((s) => s.sessionId === 'demo-1')?.state;
    clock = 2000;
    vi.advanceTimersByTime(100);
    const after = hub.sessions().find((s) => s.sessionId === 'demo-1')?.state;
    expect(after).not.toBe(before);
    stop();
    clock = 3000;
    vi.advanceTimersByTime(500);
    expect(hub.sessions().find((s) => s.sessionId === 'demo-1')?.updatedAt).toBe(2000);
  });
});

describe('demo worktree session', () => {
  it('reports its main project and worktree', () => {
    const hub = new SessionHub();
    const stop = startDemo(hub, { now: () => 1000 });
    expect(hub.sessions().find((s) => s.sessionId === 'demo-4')).toMatchObject({ project: 'api-server', worktree: 'fix-auth' });
    stop();
  });
});
