import type { ChatMessage, Session } from '@unpaidinterns/core';
import { describe, expect, it } from 'vitest';
import { composerState, threadItems } from './chat.js';

const MIN = 60_000;
const msg = (id: string, role: ChatMessage['role'], ts: number, text = id): ChatMessage => ({ id, role, text, ts });

describe('threadItems', () => {
  it('starts with a time marker and groups consecutive tool calls', () => {
    const items = threadItems([msg('u', 'user', 0), msg('t1', 'tool', 1), msg('t2', 'tool', 2), msg('a', 'assistant', 3)]);
    expect(items.map((i) => i.kind)).toEqual(['time', 'bubble', 'tools', 'bubble']);
    expect(items[2]).toMatchObject({ kind: 'tools', messages: [{ id: 't1' }, { id: 't2' }] });
  });

  it('adds a time marker after a long gap', () => {
    const items = threadItems([msg('a', 'user', 0), msg('b', 'assistant', 11 * MIN)]);
    expect(items.filter((i) => i.kind === 'time')).toHaveLength(2);
  });

  it('marks the last bubble of a run by the same side', () => {
    const items = threadItems([msg('a', 'assistant', 0), msg('b', 'assistant', 1), msg('c', 'user', 2)]);
    const bubbles = items.filter((i) => i.kind === 'bubble');
    expect(bubbles.map((b) => (b.kind === 'bubble' ? b.tail : null))).toEqual([false, true, true]);
  });

  it('returns nothing for an empty thread', () => {
    expect(threadItems([])).toEqual([]);
  });
});

const session = (overrides: Partial<Session> = {}): Session => ({
  agent: 'claude',
  sessionId: 's',
  cwd: '/w',
  project: 'w',
  state: 'done',
  startedAt: 0,
  updatedAt: 0,
  ...overrides,
});

describe('composerState', () => {
  it('is open when the agent is resting', () => {
    expect(composerState(session(), undefined)).toEqual({ canSend: true });
  });

  it('waits while the agent works or a message is running', () => {
    expect(composerState(session({ state: 'running' }), undefined)).toEqual({ canSend: false, reason: 'working' });
    expect(composerState(session(), { status: 'running' })).toEqual({ canSend: false, reason: 'sending' });
  });

  it('cannot reach an agent that waits for an answer in its terminal', () => {
    expect(composerState(session({ state: 'waiting' }), undefined)).toEqual({ canSend: false, reason: 'terminal' });
  });

  it('does not support Gemini yet', () => {
    expect(composerState(session({ agent: 'gemini' }), undefined)).toEqual({ canSend: false, reason: 'unsupported' });
  });
});
