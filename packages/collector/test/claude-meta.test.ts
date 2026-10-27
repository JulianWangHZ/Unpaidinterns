import { describe, expect, it } from 'vitest';
import { createClaudeParser } from '../src/adapters/claude.js';

const FILE = '/h/.claude/projects/-w-app/s1.jsonl';
const base = { sessionId: 's1', cwd: '/w/app' };
const at = (min: number) => new Date(Date.UTC(2026, 9, 27, 8, min)).toISOString();
const line = (obj: Record<string, unknown>) => JSON.stringify({ ...base, ...obj });

function events(lines: string[]) {
  const parse = createClaudeParser(FILE);
  return lines.map((l) => parse(l)).flatMap((r) => (r.kind === 'event' ? [r.event] : []));
}

describe('createClaudeParser metadata', () => {
  it('remembers the last prompt, the model and when the turn started', () => {
    const out = events([
      line({ type: 'user', timestamp: at(0), message: { content: 'fix the login bug' } }),
      line({ type: 'assistant', timestamp: at(2), message: { model: 'claude-opus-5-5', content: [{ type: 'tool_use', name: 'Bash', input: { command: 'npm test' } }] } }),
    ]);
    expect(out.at(-1)).toMatchObject({ prompt: 'fix the login bug', model: 'claude-opus-5-5', turnStartedAt: Date.parse(at(0)), state: 'running' });
  });

  it('starts a new turn on each new prompt but not on tool results', () => {
    const out = events([
      line({ type: 'user', timestamp: at(0), message: { content: 'first' } }),
      line({ type: 'user', timestamp: at(3), message: { content: [{ type: 'tool_result', content: 'ok' }] } }),
      line({ type: 'user', timestamp: at(5), message: { content: 'second' } }),
    ]);
    expect(out[1]?.turnStartedAt).toBe(Date.parse(at(0)));
    expect(out[2]).toMatchObject({ prompt: 'second', turnStartedAt: Date.parse(at(5)) });
  });

  it('re-emits the latest state when a title arrives, and prefers a custom title', () => {
    const out = events([
      line({ type: 'assistant', timestamp: at(1), message: { content: [{ type: 'text', text: 'Done.' }], stop_reason: 'end_turn' } }),
      JSON.stringify({ type: 'ai-title', sessionId: 's1', aiTitle: 'Fix login redirect' }),
      JSON.stringify({ type: 'custom-title', sessionId: 's1', customTitle: 'Login work' }),
      JSON.stringify({ type: 'ai-title', sessionId: 's1', aiTitle: 'Something else' }),
    ]);
    expect(out.map((e) => e.title)).toEqual([undefined, 'Fix login redirect', 'Login work', 'Login work']);
    expect(out.every((e) => e.state === 'done')).toBe(true);
  });

  it('ignores a title before any state', () => {
    expect(events([JSON.stringify({ type: 'ai-title', sessionId: 's1', aiTitle: 'Early' })])).toEqual([]);
  });

  it('keeps injected notices and interrupts out of the prompt', () => {
    const out = events([
      line({ type: 'user', timestamp: at(0), message: { content: 'real question' } }),
      line({ type: 'user', timestamp: at(1), message: { content: '<task-notification>x</task-notification>' } }),
      line({ type: 'user', timestamp: at(2), message: { content: '[Request interrupted by user]' } }),
    ]);
    expect(out.at(-1)?.prompt).toBe('real question');
  });

  it('flattens and shortens a long prompt', () => {
    const long = `line one\n\n${'word '.repeat(100)}`;
    const out = events([line({ type: 'user', timestamp: at(0), message: { content: long } })]);
    expect(out[0]?.prompt?.startsWith('line one word')).toBe(true);
    expect(out[0]?.prompt?.length).toBeLessThanOrEqual(240);
  });
});
