import { describe, expect, it } from 'vitest';
import { parseClaudeLine } from '../src/adapters/claude.js';

const ctx = { filePath: '/home/u/.claude/projects/-work-web-app/s1.jsonl' };
const base = {
  sessionId: 's1',
  cwd: '/work/web-app',
  timestamp: '2026-10-25T08:00:00.000Z',
};
const TS = Date.parse(base.timestamp);

function line(obj: Record<string, unknown>): string {
  return JSON.stringify({ ...base, ...obj });
}

function assistant(content: unknown[], stopReason: string | null = null): string {
  return line({ type: 'assistant', message: { content, stop_reason: stopReason } });
}

function expectEvent(raw: string) {
  const result = parseClaudeLine(raw, ctx);
  if (result.kind !== 'event') throw new Error(`expected event, got ${result.kind}`);
  return result.event;
}

describe('parseClaudeLine', () => {
  it('skips blank lines', () => {
    expect(parseClaudeLine('   ', ctx)).toEqual({ kind: 'skip' });
  });

  it('reports invalid JSON as an error', () => {
    expect(parseClaudeLine('{not json', ctx)).toEqual({ kind: 'error', reason: 'invalid JSON' });
  });

  it('skips non-message line types', () => {
    expect(parseClaudeLine(line({ type: 'permission-mode' }), ctx)).toEqual({ kind: 'skip' });
  });

  it('skips meta lines', () => {
    expect(parseClaudeLine(line({ type: 'user', isMeta: true, message: { content: 'x' } }), ctx)).toEqual({
      kind: 'skip',
    });
  });

  it('reports a message line without cwd as an error', () => {
    const raw = JSON.stringify({ type: 'user', sessionId: 's1', timestamp: base.timestamp });
    expect(parseClaudeLine(raw, ctx)).toEqual({
      kind: 'error',
      reason: 'missing sessionId, cwd or timestamp',
    });
  });

  it('reports an unparseable timestamp as an error', () => {
    expect(parseClaudeLine(line({ type: 'user', timestamp: 'yesterday', message: { content: 'x' } }), ctx)).toEqual({
      kind: 'error',
      reason: 'invalid timestamp',
    });
  });

  it('maps a Bash tool call to running with the command', () => {
    const event = expectEvent(
      assistant([{ type: 'tool_use', name: 'Bash', input: { command: 'npm test' } }], 'tool_use'),
    );
    expect(event).toEqual({
      agent: 'claude',
      sessionId: 's1',
      cwd: '/work/web-app',
      project: 'web-app',
      state: 'running',
      tool: 'Bash: npm test',
      ts: TS,
    });
  });

  it('labels file tools with the file name only', () => {
    const event = expectEvent(
      assistant([{ type: 'tool_use', name: 'Edit', input: { file_path: '/work/web-app/src/app.ts' } }]),
    );
    expect(event.tool).toBe('Edit: app.ts');
  });

  it('labels search tools with the pattern', () => {
    const event = expectEvent(assistant([{ type: 'tool_use', name: 'Grep', input: { pattern: 'TODO' } }]));
    expect(event.tool).toBe('Grep: TODO');
  });

  it('uses the bare tool name when no argument is known', () => {
    const event = expectEvent(assistant([{ type: 'tool_use', name: 'WebSearch', input: {} }]));
    expect(event.tool).toBe('WebSearch');
  });

  it('truncates long commands', () => {
    const command = 'x'.repeat(200);
    const event = expectEvent(assistant([{ type: 'tool_use', name: 'Bash', input: { command } }]));
    expect(event.tool).toHaveLength('Bash: '.length + 60);
    expect(event.tool?.endsWith('…')).toBe(true);
  });

  it.each(['AskUserQuestion', 'ExitPlanMode'])('maps %s to waiting', (name) => {
    const event = expectEvent(assistant([{ type: 'tool_use', name, input: {} }]));
    expect(event.state).toBe('waiting');
    expect(event.tool).toBe(name);
  });

  it('maps a finished text reply to done with a detail', () => {
    const event = expectEvent(assistant([{ type: 'text', text: 'All tests pass.' }], 'end_turn'));
    expect(event.state).toBe('done');
    expect(event.detail).toBe('All tests pass.');
  });

  it('maps a finished turn without text to done without detail', () => {
    const event = expectEvent(assistant([{ type: 'thinking', thinking: '' }], 'end_turn'));
    expect(event.state).toBe('done');
    expect(event).not.toHaveProperty('detail');
  });

  it('maps an unfinished text block to writing', () => {
    expect(expectEvent(assistant([{ type: 'text', text: 'Working on' }])).state).toBe('writing');
  });

  it('maps a thinking block to thinking', () => {
    expect(expectEvent(assistant([{ type: 'thinking', thinking: '' }], 'tool_use')).state).toBe('thinking');
  });

  it('skips an assistant line with no known blocks', () => {
    expect(parseClaudeLine(assistant([]), ctx)).toEqual({ kind: 'skip' });
  });

  it('maps a tool result to thinking', () => {
    const raw = line({ type: 'user', message: { content: [{ type: 'tool_result', content: 'ok' }] } });
    expect(expectEvent(raw).state).toBe('thinking');
  });

  it('maps a new user prompt to thinking', () => {
    expect(expectEvent(line({ type: 'user', message: { content: 'fix the bug' } })).state).toBe('thinking');
  });

  it('maps an interrupt marker string to interrupted', () => {
    const raw = line({ type: 'user', message: { content: '[Request interrupted by user]' } });
    expect(expectEvent(raw).state).toBe('interrupted');
  });

  it('maps an interrupt marker block to interrupted', () => {
    const raw = line({
      type: 'user',
      message: { content: [{ type: 'text', text: '[Request interrupted by user for tool use]' }] },
    });
    expect(expectEvent(raw).state).toBe('interrupted');
  });

  it('skips a user line without content', () => {
    expect(parseClaudeLine(line({ type: 'user', message: {} }), ctx)).toEqual({ kind: 'skip' });
  });

  it('gives subagents their own id and a parent id', () => {
    const subCtx = { filePath: '/home/u/.claude/projects/-work-web-app/s1/subagents/agent-abc.jsonl' };
    const raw = line({ type: 'user', isSidechain: true, message: { content: 'go' } });
    const result = parseClaudeLine(raw, subCtx);
    expect(result).toMatchObject({
      kind: 'event',
      event: { sessionId: 's1/agent-abc', parentSessionId: 's1' },
    });
  });
});
