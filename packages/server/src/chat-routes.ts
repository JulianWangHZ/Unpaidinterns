import { readFile } from 'node:fs/promises';
import { readTranscript } from '@unpaidinterns/collector';
import { sendMessageSchema } from '@unpaidinterns/core';
import { Hono, type MiddlewareHandler } from 'hono';
import { AGENT_NAMES } from './agent-names.js';
import type { RunRequest, StartResult } from './runner.js';
import type { SessionHub } from './session-hub.js';

export interface ChatDeps {
  /** Session id to the session file it was read from. */
  files: ReadonlyMap<string, string>;
  runner: { start(session: never, request: RunRequest): StartResult };
}

export function chatRoutes(hub: SessionHub, deps: ChatDeps, requireSession: MiddlewareHandler) {
  const routes = new Hono();
  routes.use('*', requireSession);
  const find = (id: string) => hub.sessions().find((session) => session.sessionId === id);

  routes.get('/:id/messages', async (c) => {
    const session = find(c.req.param('id'));
    if (!session) return c.json({ error: 'That agent is no longer on the island.' }, 404);
    const file = deps.files.get(session.sessionId);
    const text = file ? await readFile(file, 'utf8').catch(() => '') : '';
    return c.json({ messages: readTranscript(session.agent, text) });
  });

  routes.post('/:id/messages', async (c) => {
    const session = find(c.req.param('id'));
    if (!session) return c.json({ error: 'That agent is no longer on the island.' }, 404);
    const parsed = sendMessageSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'Write a message first.' }, 400);
    const result = deps.runner.start(session as never, parsed.data);
    if (result.ok) return c.json({ ok: true }, 202);
    const name = AGENT_NAMES[session.agent];
    if (result.reason === 'working') return c.json({ error: `${name} is still working. Send once it finishes.` }, 409);
    if (result.reason === 'busy') return c.json({ error: `A message to ${name} is already running.` }, 409);
    return c.json({ error: 'Sending messages to this agent is not supported yet.' }, 422);
  });

  return routes;
}
