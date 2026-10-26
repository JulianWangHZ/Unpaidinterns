import { describe, expect, it } from 'vitest';
import { readTranscript } from '../src/transcript.js';

const T = '2026-10-26T08:00:00.000Z';
const TS = Date.parse(T);
const line = (obj: Record<string, unknown>) => JSON.stringify({ timestamp: T, ...obj });

describe('readTranscript (claude)', () => {
  it('reads prompts, replies and tool calls in order', () => {
    const text = [
      line({ type: 'user', uuid: 'u1', message: { content: 'fix the login bug' } }),
      line({ type: 'assistant', uuid: 'a1', message: { content: [{ type: 'thinking', thinking: 'x' }, { type: 'tool_use', name: 'Bash', input: { command: 'npm test' } }] } }),
      line({ type: 'user', uuid: 'r1', message: { content: [{ type: 'tool_result', content: 'ok' }] } }),
      line({ type: 'assistant', uuid: 'a2', message: { content: [{ type: 'text', text: 'Fixed it.' }] } }),
    ].join('\n');
    expect(readTranscript('claude', text)).toEqual([
      { id: 'u1', role: 'user', text: 'fix the login bug', ts: TS },
      { id: 'a1:1', role: 'tool', text: 'Bash: npm test', ts: TS },
      { id: 'a2', role: 'assistant', text: 'Fixed it.', ts: TS },
    ]);
  });

  it('skips meta, interrupt markers, system lines and bad JSON', () => {
    const text = [
      line({ type: 'user', uuid: 'm', isMeta: true, message: { content: 'caveat' } }),
      line({ type: 'user', uuid: 'i', message: { content: '[Request interrupted by user]' } }),
      line({ type: 'system', uuid: 's' }),
      '{broken',
      line({ type: 'user', uuid: 'c', message: { content: '<command-name>/clear</command-name>' } }),
    ].join('\n');
    expect(readTranscript('claude', text)).toEqual([]);
  });

  it.each([
    '<task-notification>\n<task-id>b1</task-id>\n<status>stopped</status>\n</task-notification>',
    '<bash-input>ls</bash-input>',
    '<local-command-stdout>ok</local-command-stdout>',
    '<user-prompt-submit-hook>x</user-prompt-submit-hook>',
  ])('hides messages the CLI injects (%s)', (content) => {
    expect(readTranscript('claude', line({ type: 'user', uuid: 'n', message: { content } }))).toEqual([]);
  });

  it('shows pasted text without its wrapper tag', () => {
    const content = '<pasted_content id="ab12">\nnpm test fails\n</pasted_content id="ab12">\n\nwhy?';
    expect(readTranscript('claude', line({ type: 'user', uuid: 'p', message: { content } }))[0]?.text).toBe('npm test fails\n\nwhy?');
  });

  it('keeps a real prompt that merely contains angle brackets', () => {
    const text = line({ type: 'user', uuid: 'p', message: { content: 'why does <Button> re-render?' } });
    expect(readTranscript('claude', text)).toHaveLength(1);
  });

  it('reads text blocks inside a user array', () => {
    const text = line({ type: 'user', uuid: 'u', message: { content: [{ type: 'text', text: 'hello' }] } });
    expect(readTranscript('claude', text)).toEqual([{ id: 'u', role: 'user', text: 'hello', ts: TS }]);
  });

  it('keeps only the most recent messages', () => {
    const text = Array.from({ length: 10 }, (_, i) => line({ type: 'user', uuid: `u${i}`, message: { content: `m${i}` } })).join('\n');
    expect(readTranscript('claude', text, 3).map((m) => m.text)).toEqual(['m7', 'm8', 'm9']);
  });
});

describe('readTranscript (codex)', () => {
  const item = (payload: Record<string, unknown>) => line({ type: 'response_item', payload });

  it('reads user and assistant messages and tool calls', () => {
    const text = [
      item({ type: 'message', role: 'developer', content: [{ type: 'input_text', text: 'rules' }] }),
      item({ type: 'message', role: 'user', content: [{ type: 'input_text', text: 'add tests' }] }),
      item({ type: 'custom_tool_call', name: 'exec', input: 'npm test\nmore' }),
      item({ type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'Done.' }] }),
    ].join('\n');
    expect(readTranscript('codex', text)).toEqual([
      { id: 'x1', role: 'user', text: 'add tests', ts: TS },
      { id: 'x2', role: 'tool', text: 'exec: npm test', ts: TS },
      { id: 'x3', role: 'assistant', text: 'Done.', ts: TS },
    ]);
  });

  it('hides injected environment context from the user side', () => {
    const text = item({ type: 'message', role: 'user', content: [{ type: 'input_text', text: '<environment_context>cwd</environment_context>' }] });
    expect(readTranscript('codex', text)).toEqual([]);
  });
});

describe('readTranscript (gemini)', () => {
  it('returns nothing until Gemini transcripts are supported', () => {
    expect(readTranscript('gemini', 'anything')).toEqual([]);
  });
});
