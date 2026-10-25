import { basename } from 'node:path';
import { projectName, type AgentEvent, type SessionState } from '@unpaidinterns/core';
import type { LineContext, ParseResult, ParserFactory } from '../types.js';
import { DETAIL_MAX, toolLabel, truncate } from './text.js';

const WAITING_TOOLS = new Set(['AskUserQuestion', 'ExitPlanMode']);
const INTERRUPT_PREFIX = '[Request interrupted by user';
const SKIP: ParseResult = { kind: 'skip' };

interface ContentBlock {
  type?: string;
  name?: string;
  text?: string;
  input?: Record<string, unknown>;
}

interface ClaudeMessage {
  content?: string | ContentBlock[];
  stop_reason?: string | null;
}

interface ClaudeLine {
  type?: string;
  sessionId?: string;
  cwd?: string;
  timestamp?: string;
  isSidechain?: boolean;
  isMeta?: boolean;
  message?: ClaudeMessage;
}

interface StatePart {
  state: SessionState;
  tool?: string;
  detail?: string;
}

function describeTool(name: string, input: Record<string, unknown>): string {
  const { command, file_path: filePath, pattern } = input;
  let arg: string | undefined;
  if (typeof command === 'string') arg = command;
  else if (typeof filePath === 'string') arg = basename(filePath);
  else if (typeof pattern === 'string') arg = pattern;
  return toolLabel(name, arg);
}

function assistantState(message: ClaudeMessage | undefined): StatePart | null {
  const blocks = Array.isArray(message?.content) ? message.content : [];
  const toolUse = blocks.findLast((block) => block.type === 'tool_use' && block.name);
  if (toolUse?.name) {
    return WAITING_TOOLS.has(toolUse.name)
      ? { state: 'waiting', tool: toolUse.name }
      : { state: 'running', tool: describeTool(toolUse.name, toolUse.input ?? {}) };
  }
  const text = blocks
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('')
    .trim();
  if (message?.stop_reason === 'end_turn') {
    return text ? { state: 'done', detail: truncate(text, DETAIL_MAX) } : { state: 'done' };
  }
  if (text) return { state: 'writing' };
  if (blocks.some((block) => block.type === 'thinking')) return { state: 'thinking' };
  return null;
}

function userState(message: ClaudeMessage | undefined): StatePart | null {
  const content = message?.content;
  if (typeof content === 'string') {
    return { state: content.startsWith(INTERRUPT_PREFIX) ? 'interrupted' : 'thinking' };
  }
  if (!Array.isArray(content)) return null;
  const interrupted = content.some(
    (block) => block.type === 'text' && block.text?.startsWith(INTERRUPT_PREFIX),
  );
  // A tool result or a new prompt both mean the agent is processing again.
  return { state: interrupted ? 'interrupted' : 'thinking' };
}

function sessionIds(sessionId: string, isSidechain: boolean, filePath: string) {
  if (!isSidechain) return { sessionId };
  return { sessionId: `${sessionId}/${basename(filePath, '.jsonl')}`, parentSessionId: sessionId };
}

export function parseClaudeLine(line: string, ctx: LineContext): ParseResult {
  if (line.trim() === '') return SKIP;
  let raw: ClaudeLine;
  try {
    raw = JSON.parse(line) as ClaudeLine;
  } catch {
    return { kind: 'error', reason: 'invalid JSON' };
  }
  if ((raw.type !== 'user' && raw.type !== 'assistant') || raw.isMeta) return SKIP;
  if (!raw.sessionId || !raw.cwd || !raw.timestamp) {
    return { kind: 'error', reason: 'missing sessionId, cwd or timestamp' };
  }
  const ts = Date.parse(raw.timestamp);
  if (Number.isNaN(ts)) return { kind: 'error', reason: 'invalid timestamp' };

  const part = raw.type === 'assistant' ? assistantState(raw.message) : userState(raw.message);
  if (!part) return SKIP;

  const event: AgentEvent = {
    agent: 'claude',
    ...sessionIds(raw.sessionId, raw.isSidechain === true, ctx.filePath),
    cwd: raw.cwd,
    project: projectName(raw.cwd),
    ...part,
    ts,
  };
  return { kind: 'event', event };
}

export const createClaudeParser: ParserFactory = (filePath) => (line) => parseClaudeLine(line, { filePath });
