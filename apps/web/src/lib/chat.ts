import { stateGroup, type ChatMessage, type Session } from '@unpaidinterns/core';
import type { RunState } from '../store.js';

const GAP_MS = 10 * 60_000;

export type ThreadItem =
  | { kind: 'time'; key: string; ts: number }
  | { kind: 'bubble'; key: string; message: ChatMessage; tail: boolean }
  | { kind: 'tools'; key: string; messages: ChatMessage[] };

/** Lays a transcript out like a messaging app: time markers, bubbles, and tool calls folded into one row. */
export function threadItems(messages: readonly ChatMessage[]): ThreadItem[] {
  const items: ThreadItem[] = [];
  let lastTs = -Infinity;
  for (const message of messages) {
    if (message.ts - lastTs > GAP_MS) items.push({ kind: 'time', key: `t:${message.id}`, ts: message.ts });
    lastTs = message.ts;
    const previous = items.at(-1);
    if (message.role === 'tool') {
      if (previous?.kind === 'tools') previous.messages.push(message);
      else items.push({ kind: 'tools', key: `g:${message.id}`, messages: [message] });
      continue;
    }
    if (previous?.kind === 'bubble' && previous.message.role === message.role) previous.tail = false;
    items.push({ kind: 'bubble', key: message.id, message, tail: true });
  }
  return items;
}

export type ComposerState = { canSend: true } | { canSend: false; reason: 'working' | 'sending' | 'terminal' | 'unsupported' };

/** Whether a message can go out now, and if not, the reason to show under the input. */
export function composerState(session: Session, run: RunState | undefined): ComposerState {
  if (session.agent === 'gemini') return { canSend: false, reason: 'unsupported' };
  if (run?.status === 'running') return { canSend: false, reason: 'sending' };
  const group = stateGroup(session.state);
  // An agent waiting on a question is still open in its terminal; answering there avoids two writers.
  if (group === 'needsYou') return { canSend: false, reason: 'terminal' };
  if (group !== 'resting') return { canSend: false, reason: 'working' };
  return { canSend: true };
}
