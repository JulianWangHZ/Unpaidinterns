import { describe, expect, it } from 'vitest';
import { createCodexParser } from '../src/adapters/codex.js';

const SESSION_ID = '019f69ce-21b2-7f30-a692-f309a4780c95';
const FILE = `/home/u/.codex/sessions/2026/10/25/rollout-2026-10-25T08-00-00-${SESSION_ID}.jsonl`;
const TIME = '2026-10-25T08:00:00.000Z';
const TS = Date.parse(TIME);

function line(type: string, payload: Record<string, unknown>, timestamp = TIME): string {
  return JSON.stringify({ timestamp, type, payload });
}

const meta = line('session_meta', { id: SESSION_ID, cwd: '/work/api-server' });

function parserWithMeta() {
  const parse = createCodexParser(FILE);
  expect(parse(meta)).toEqual({ kind: 'skip' });
  return parse;
}

function stateOf(raw: string) {
  const result = parserWithMeta()(raw);
  if (result.kind !== 'event') throw new Error(`expected event, got ${result.kind}`);
  return result.event;
}

describe('createCodexParser', () => {
  it('skips blank lines', () => {
    expect(createCodexParser(FILE)('  ')).toEqual({ kind: 'skip' });
  });

  it('reports invalid JSON as an error', () => {
    expect(createCodexParser(FILE)('{oops')).toEqual({ kind: 'error', reason: 'invalid JSON' });
  });

  it('reports state lines that arrive before any cwd', () => {
    const parse = createCodexParser(FILE);
    expect(parse(line('event_msg', { type: 'task_started' }))).toEqual({
      kind: 'error',
      reason: 'event before session_meta',
    });
  });

  it('builds a full event from session_meta context', () => {
    expect(stateOf(line('event_msg', { type: 'task_started' }))).toEqual({
      agent: 'codex',
      sessionId: SESSION_ID,
      cwd: '/work/api-server',
      project: 'api-server',
      state: 'thinking',
      turnStartedAt: TS,
      ts: TS,
    });
  });

  it('falls back to the file name for the session id', () => {
    const parse = createCodexParser(FILE);
    parse(line('turn_context', { cwd: '/work/api-server' }));
    const result = parse(line('event_msg', { type: 'task_started' }));
    expect(result).toMatchObject({ kind: 'event', event: { sessionId: SESSION_ID } });
  });

  it('follows cwd changes from turn_context', () => {
    const parse = parserWithMeta();
    parse(line('turn_context', { cwd: '/work/web-app' }));
    expect(parse(line('event_msg', { type: 'task_started' }))).toMatchObject({
      event: { cwd: '/work/web-app', project: 'web-app' },
    });
  });

  it('maps reasoning to thinking', () => {
    expect(stateOf(line('response_item', { type: 'reasoning' })).state).toBe('thinking');
  });

  it('maps a tool call to running with the first line of input', () => {
    const event = stateOf(
      line('response_item', { type: 'custom_tool_call', name: 'exec', input: 'npm test\nnpm run lint' }),
    );
    expect(event.state).toBe('running');
    expect(event.tool).toBe('exec: npm test');
  });

  it('reads function call arguments too', () => {
    const event = stateOf(line('response_item', { type: 'function_call', name: 'wait', arguments: '{}' }));
    expect(event.tool).toBe('wait: {}');
  });

  it('uses the bare name when a tool has no input', () => {
    expect(stateOf(line('response_item', { type: 'function_call', name: 'wait' })).tool).toBe('wait');
  });

  it('maps tool output to thinking', () => {
    expect(stateOf(line('response_item', { type: 'custom_tool_call_output' })).state).toBe('thinking');
  });

  it('maps an assistant message to writing', () => {
    expect(stateOf(line('response_item', { type: 'message', role: 'assistant' })).state).toBe('writing');
  });

  it('maps a user message to thinking', () => {
    expect(stateOf(line('response_item', { type: 'message', role: 'user' })).state).toBe('thinking');
  });

  it('skips messages from other roles', () => {
    expect(parserWithMeta()(line('response_item', { type: 'message', role: 'developer' }))).toEqual({
      kind: 'skip',
    });
  });

  it('maps task_complete to done with the last reply', () => {
    const event = stateOf(line('event_msg', { type: 'task_complete', last_agent_message: 'Shipped.' }));
    expect(event.state).toBe('done');
    expect(event.detail).toBe('Shipped.');
  });

  it('maps task_complete without a reply to done', () => {
    expect(stateOf(line('event_msg', { type: 'task_complete' }))).not.toHaveProperty('detail');
  });

  it('maps an approval request to waiting', () => {
    const event = stateOf(line('event_msg', { type: 'exec_approval_request' }));
    expect(event.state).toBe('waiting');
    expect(event.tool).toBe('Approval');
  });

  it('maps turn_aborted to interrupted', () => {
    expect(stateOf(line('event_msg', { type: 'turn_aborted' })).state).toBe('interrupted');
  });

  it('maps error to error', () => {
    expect(stateOf(line('event_msg', { type: 'error' })).state).toBe('error');
  });

  it('skips bookkeeping lines', () => {
    const parse = parserWithMeta();
    expect(parse(line('event_msg', { type: 'token_count' }))).toEqual({ kind: 'skip' });
    expect(parse(line('token_usage_record', {}))).toEqual({ kind: 'skip' });
  });

  it('reports an unparseable timestamp', () => {
    expect(parserWithMeta()(line('event_msg', { type: 'task_started' }, 'later'))).toEqual({
      kind: 'error',
      reason: 'invalid timestamp',
    });
  });

  it('treats a missing payload as empty', () => {
    expect(parserWithMeta()(JSON.stringify({ timestamp: TIME, type: 'event_msg' }))).toEqual({ kind: 'skip' });
  });
});
