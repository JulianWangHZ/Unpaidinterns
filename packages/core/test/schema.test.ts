import { describe, expect, it } from 'vitest';
import { agentEventSchema, serverMessageSchema } from '../src/index.js';

const validEvent = {
  agent: 'claude',
  sessionId: 's1',
  cwd: '/work/web-app',
  project: 'web-app',
  state: 'running',
  tool: 'Bash: npm test',
  ts: 1_700_000_000_000,
};

describe('agentEventSchema', () => {
  it('accepts a valid event', () => {
    expect(agentEventSchema.parse(validEvent)).toEqual(validEvent);
  });

  it('rejects an unknown agent', () => {
    expect(agentEventSchema.safeParse({ ...validEvent, agent: 'other' }).success).toBe(false);
  });

  it('rejects an empty session id', () => {
    expect(agentEventSchema.safeParse({ ...validEvent, sessionId: '' }).success).toBe(false);
  });

  it('rejects an unknown state', () => {
    expect(agentEventSchema.safeParse({ ...validEvent, state: 'sleeping' }).success).toBe(false);
  });
});

describe('serverMessageSchema', () => {
  it('accepts a remove message', () => {
    expect(serverMessageSchema.parse({ type: 'remove', sessionId: 's1' })).toEqual({
      type: 'remove',
      sessionId: 's1',
    });
  });

  it('rejects an unknown message type', () => {
    expect(serverMessageSchema.safeParse({ type: 'reset' }).success).toBe(false);
  });
});
