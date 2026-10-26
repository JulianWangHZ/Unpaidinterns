import type { AgentKind, ChatMessage } from '@unpaidinterns/core';
import { toolLabel } from './adapters/text.js';

const DEFAULT_LIMIT = 80;
const INTERRUPT = '[Request interrupted by user';
// The CLIs record their own notices as user turns, always wrapped in a lowercase tag such as
// <task-notification> or <system-reminder>. A person's prompt does not start with a bare tag.
const INJECTED = /^<[a-z][a-z0-9_-]*>/;
// Text the person pasted is wrapped in a tag by the CLI; show what they pasted, not the wrapper.
const PASTE_TAG = /<\/?pasted_content[^>]*>\n?/g;

type Raw = Record<string, unknown>;
type Block = { type?: string; text?: string; name?: string; input?: unknown };

function parse(line: string): Raw | null {
  try {
    return JSON.parse(line) as Raw;
  } catch {
    return null;
  }
}

function time(raw: Raw): number {
  const ts = Date.parse(String(raw.timestamp ?? ''));
  return Number.isNaN(ts) ? 0 : ts;
}

function isPersonText(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length > 0 && !trimmed.startsWith(INTERRUPT) && !INJECTED.test(trimmed);
}

function describeInput(name: string, input: unknown): string {
  const fields = (input ?? {}) as Record<string, unknown>;
  if (typeof fields.file_path === 'string') return toolLabel(name, fields.file_path.split('/').pop());
  const arg = [fields.command, fields.pattern, fields.url].find((value) => typeof value === 'string');
  return toolLabel(name, arg as string | undefined);
}

function claudeMessages(raw: Raw): ChatMessage[] {
  if (raw.isMeta || (raw.type !== 'user' && raw.type !== 'assistant')) return [];
  const id = String(raw.uuid ?? '');
  const ts = time(raw);
  const content = (raw.message as { content?: unknown } | undefined)?.content;
  if (raw.type === 'user') {
    const blocks: Block[] = typeof content === 'string' ? [{ type: 'text', text: content }] : Array.isArray(content) ? content : [];
    const text = blocks.filter((b) => b.type === 'text').map((b) => b.text ?? '').join('\n');
    return isPersonText(text) ? [{ id, role: 'user', text: text.replace(PASTE_TAG, '').trim(), ts }] : [];
  }
  const blocks: Block[] = Array.isArray(content) ? content : [];
  const out: ChatMessage[] = [];
  blocks.forEach((block, index) => {
    if (block.type === 'tool_use' && block.name) out.push({ id: `${id}:${index}`, role: 'tool', text: describeInput(block.name, block.input), ts });
  });
  const text = blocks.filter((b) => b.type === 'text').map((b) => b.text ?? '').join('\n').trim();
  if (text) out.push({ id, role: 'assistant', text, ts });
  return out;
}

function codexMessages(raw: Raw, next: () => string): ChatMessage[] {
  if (raw.type !== 'response_item') return [];
  const payload = (raw.payload ?? {}) as Raw;
  const ts = time(raw);
  if (payload.type === 'message' && (payload.role === 'user' || payload.role === 'assistant')) {
    const blocks = Array.isArray(payload.content) ? (payload.content as Block[]) : [];
    const text = blocks.map((b) => b.text ?? '').join('\n').trim();
    if (payload.role === 'user' && !isPersonText(text)) return [];
    return text ? [{ id: next(), role: payload.role, text, ts }] : [];
  }
  if (payload.type === 'custom_tool_call' || payload.type === 'function_call') {
    const input = String(payload.input ?? payload.arguments ?? '');
    return [{ id: next(), role: 'tool', text: toolLabel(String(payload.name ?? 'tool'), input.split('\n')[0]), ts }];
  }
  return [];
}

/** Turns a session file into the conversation a person would recognise: prompts, replies and tool calls. */
export function readTranscript(agent: AgentKind, text: string, limit = DEFAULT_LIMIT): ChatMessage[] {
  if (agent === 'gemini') return [];
  let counter = 0;
  const next = () => `x${++counter}`;
  const messages = text
    .split('\n')
    .map(parse)
    .filter((raw): raw is Raw => raw !== null)
    .flatMap((raw) => (agent === 'claude' ? claudeMessages(raw) : codexMessages(raw, next)));
  return messages.slice(-limit);
}
