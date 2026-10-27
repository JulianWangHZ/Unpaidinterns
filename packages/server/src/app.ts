import type { ServerType } from '@hono/node-server';
import { createNodeWebSocket } from '@hono/node-ws';
import { Hono, type MiddlewareHandler } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { createLinkAuth, tokensMatch } from './auth.js';
import type { SessionHub } from './session-hub.js';
import type { TaskRepository } from './task-repository.js';
import { taskRoutes } from './task-routes.js';

export const AUTH_COOKIE = 'ui_session';

export interface AppOptions {
  hub: SessionHub;
  tasks?: TaskRepository;
  linkToken: string;
  sessionSecret: string;
}

export function createApp({ hub, tasks, linkToken, sessionSecret }: AppOptions) {
  const app = new Hono();
  const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });
  const linkAuth = createLinkAuth(linkToken);

  const requireSession: MiddlewareHandler = async (c, next) => {
    if (!tokensMatch(getCookie(c, AUTH_COOKIE) ?? '', sessionSecret)) {
      return c.json({ error: 'Not signed in. Open the link printed in the terminal.' }, 401);
    }
    await next();
  };

  // Writes must come from this page: a cross-site form or fetch carries another Origin.
  app.use('/api/*', async (c, next) => {
    if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
      const origin = c.req.header('origin');
      if (origin && origin !== new URL(c.req.url).origin) return c.json({ error: 'Requests from other sites are not allowed.' }, 403);
    }
    await next();
  });

  app.get('/api/health', (c) => c.json({ ok: true }));

  app.get('/api/auth', (c) => {
    if (!linkAuth.redeem(c.req.query('token') ?? '')) {
      return c.json(
        { error: 'This link is invalid or was already used. Restart the server to get a new one.' },
        401,
      );
    }
    setCookie(c, AUTH_COOKIE, sessionSecret, { httpOnly: true, sameSite: 'Strict', path: '/' });
    return c.redirect('/');
  });

  app.get('/api/sessions', requireSession, (c) => c.json({ sessions: hub.sessions() }));
  if (tasks) app.route('/api/tasks', taskRoutes(tasks, requireSession, (message) => hub.broadcast(message)));

  app.get(
    '/ws',
    requireSession,
    upgradeWebSocket(() => {
      let unsubscribe: (() => void) | undefined;
      return {
        async onOpen(_event, ws) {
          // Subscribe and send the snapshot in the same tick so no session update falls in between.
          unsubscribe = hub.subscribe((message) => ws.send(JSON.stringify(message)));
          ws.send(JSON.stringify({ type: 'snapshot', sessions: hub.sessions() }));
          if (tasks) ws.send(JSON.stringify({ type: 'tasks', tasks: await tasks.list() }));
        },
        onClose() {
          unsubscribe?.();
        },
      };
    }),
  );

  return { app, injectWebSocket: (server: ServerType) => injectWebSocket(server) };
}
