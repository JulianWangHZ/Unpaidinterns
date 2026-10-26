import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AgentEvent, ServerMessage } from '@unpaidinterns/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AUTH_COOKIE, createApp } from '../src/app.js';
import type { RunRequest, StartResult } from '../src/runner.js';
import { SessionHub } from '../src/session-hub.js';

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'chat-'));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

const event = (overrides: Partial<AgentEvent> = {}): AgentEvent => ({
  agent: 'claude',
  sessionId: 's1',
  cwd: '/w/app',
  project: 'app',
  state: 'done',
  ts: 1,
  ...overrides,
});

function setup(startResult: StartResult = { ok: true }) {
  const hub = new SessionHub();
  const files = new Map<string, string>();
  const starts: RunRequest[] = [];
  const runner = { start: (_s: unknown, request: RunRequest) => (starts.push(request), startResult), isRunning: () => false };
  const { app } = createApp({ hub, linkToken: 'link', sessionSecret: 'secret', chat: { files, runner } });
  const messages: ServerMessage[] = [];
  hub.subscribe((m) => messages.push(m));
  const send = (method: string, path: string, body?: unknown, headers: Record<string, string> = {}) =>
    app.request(`http://127.0.0.1:4777${path}`, {
      method,
      headers: { Cookie: `${AUTH_COOKIE}=secret`, 'Content-Type': 'application/json', Origin: 'http://127.0.0.1:4777', ...headers },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  return { hub, files, starts, send, messages };
}

describe('chat routes', () => {
  it('returns the transcript of a known session', async () => {
    const { hub, files, send } = setup();
    hub.publish(event());
    const file = join(dir, 's1.jsonl');
    await writeFile(file, JSON.stringify({ type: 'user', uuid: 'u1', timestamp: '2026-10-26T00:00:00Z', message: { content: 'hello' } }));
    files.set('s1', file);
    const res = await send('GET', '/api/sessions/s1/messages');
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ messages: [{ role: 'user', text: 'hello' }] });
  });

  it('returns an empty transcript when the file is gone', async () => {
    const { hub, files, send } = setup();
    hub.publish(event());
    files.set('s1', join(dir, 'missing.jsonl'));
    expect(await (await send('GET', '/api/sessions/s1/messages')).json()).toEqual({ messages: [] });
  });

  it('404s for an unknown session', async () => {
    expect((await setup().send('GET', '/api/sessions/nope/messages')).status).toBe(404);
  });

  it('starts a run and answers 202', async () => {
    const { hub, starts, send } = setup();
    hub.publish(event());
    const res = await send('POST', '/api/sessions/s1/messages', { text: 'run tests' });
    expect(res.status).toBe(202);
    expect(starts).toEqual([{ text: 'run tests', mode: 'resume', permission: 'edit' }]);
  });

  it.each([
    ['working', 409, 'Claude is still working. Send once it finishes.'],
    ['busy', 409, 'A message to Claude is already running.'],
    ['unsupported', 422, 'Sending messages to this agent is not supported yet.'],
  ] as const)('explains a refused run (%s)', async (reason, status, error) => {
    const { hub, send } = setup({ ok: false, reason });
    hub.publish(event());
    const res = await send('POST', '/api/sessions/s1/messages', { text: 'x' });
    expect(res.status).toBe(status);
    expect(await res.json()).toEqual({ error });
  });

  it('rejects an empty message', async () => {
    const { hub, send } = setup();
    hub.publish(event());
    expect((await send('POST', '/api/sessions/s1/messages', { text: '  ' })).status).toBe(400);
  });

  it('blocks writes from another origin', async () => {
    const { hub, send, starts } = setup();
    hub.publish(event());
    const res = await send('POST', '/api/sessions/s1/messages', { text: 'x' }, { Origin: 'https://evil.example' });
    expect(res.status).toBe(403);
    expect(starts).toEqual([]);
  });
});
