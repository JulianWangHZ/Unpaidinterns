import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { serve, type ServerType } from '@hono/node-server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WebSocket from 'ws';
import { AUTH_COOKIE, createApp } from '../src/app.js';
import { SessionHub } from '../src/session-hub.js';

let server: ServerType | undefined;

async function startServer(hub: SessionHub): Promise<number> {
  const { app, injectWebSocket } = createApp({ hub, linkToken: 'link', sessionSecret: 'secret' });
  server = serve({ fetch: app.fetch, port: 0, hostname: '127.0.0.1' });
  injectWebSocket(server);
  await once(server, 'listening');
  return (server.address() as AddressInfo).port;
}

afterEach(async () => {
  server?.close();
  server = undefined;
});

describe('GET /ws', () => {
  it('sends a snapshot, then live updates', async () => {
    const hub = new SessionHub();
    const port = await startServer(hub);
    const socket = new WebSocket(`ws://127.0.0.1:${port}/ws`, {
      headers: { Cookie: `${AUTH_COOKIE}=secret` },
    });
    const messages: unknown[] = [];
    socket.on('message', (data) => messages.push(JSON.parse(String(data))));
    await once(socket, 'open');
    await vi.waitFor(() => expect(messages).toEqual([{ type: 'snapshot', sessions: [] }]));

    hub.publish({ agent: 'claude', sessionId: 's1', cwd: '/w/a', project: 'a', state: 'running', ts: 1 });
    await vi.waitFor(() => expect(messages[1]).toMatchObject({ type: 'upsert', session: { sessionId: 's1' } }));
    socket.close();
  });

  it('rejects connections without the cookie', async () => {
    const port = await startServer(new SessionHub());
    const socket = new WebSocket(`ws://127.0.0.1:${port}/ws`);
    const [, response] = (await once(socket, 'unexpected-response')) as [unknown, { statusCode: number }];
    expect(response.statusCode).toBe(401);
    // Terminating a socket that never connected emits an error we expect here.
    socket.on('error', () => undefined);
    socket.terminate();
  });
});
