import type { Session } from '@unpaidinterns/core';
import { describe, expect, it } from 'vitest';
import { reduceMessage, useSessionStore } from './store.js';

const s1: Session = {
  agent: 'claude',
  sessionId: 's1',
  cwd: '/w/a',
  project: 'a',
  state: 'running',
  startedAt: 0,
  updatedAt: 1,
};

describe('reduceMessage', () => {
  it('replaces everything on snapshot', () => {
    expect(reduceMessage({ old: { ...s1, sessionId: 'old' } }, { type: 'snapshot', sessions: [s1] })).toEqual({ s1 });
  });

  it('inserts or replaces on upsert without mutating', () => {
    const before = { s1 };
    const after = reduceMessage(before, { type: 'upsert', session: { ...s1, state: 'done' } });
    expect(after.s1?.state).toBe('done');
    expect(before.s1.state).toBe('running');
  });

  it('drops a session on remove', () => {
    expect(reduceMessage({ s1 }, { type: 'remove', sessionId: 's1' })).toEqual({});
  });
});

describe('useSessionStore', () => {
  it('applies messages and tracks connection status', () => {
    const { apply, setStatus } = useSessionStore.getState();
    apply({ type: 'snapshot', sessions: [s1] });
    setStatus('open');
    expect(useSessionStore.getState().sessions).toEqual({ s1 });
    expect(useSessionStore.getState().status).toBe('open');
  });
});
