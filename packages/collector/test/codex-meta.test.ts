import { describe, expect, it } from 'vitest';
import { createCodexParser } from '../src/adapters/codex.js';

const FILE = '/h/.codex/sessions/rollout-x-019f69ce-21b2-7f30-a692-f309a4780c95.jsonl';
const at = (min: number) => new Date(Date.UTC(2026, 9, 27, 8, min)).toISOString();
const line = (type: string, payload: Record<string, unknown>, min = 0) => JSON.stringify({ timestamp: at(min), type, payload });

describe('createCodexParser metadata', () => {
  it('carries the model, the last prompt and the turn start', () => {
    const parse = createCodexParser(FILE);
    const out = [
      line('session_meta', { id: 'c1', cwd: '/w/api' }),
      line('turn_context', { cwd: '/w/api', model: 'gpt-5-codex' }),
      line('event_msg', { type: 'task_started' }, 1),
      line('response_item', { type: 'message', role: 'user', content: [{ type: 'input_text', text: '<environment_context>x</environment_context>' }] }, 1),
      line('response_item', { type: 'message', role: 'user', content: [{ type: 'input_text', text: 'add tests' }] }, 1),
      line('response_item', { type: 'custom_tool_call', name: 'exec', input: 'npm test' }, 3),
    ]
      .map((l) => parse(l))
      .flatMap((r) => (r.kind === 'event' ? [r.event] : []));
    expect(out.at(-1)).toMatchObject({ model: 'gpt-5-codex', prompt: 'add tests', turnStartedAt: Date.parse(at(1)), state: 'running' });
  });
});
