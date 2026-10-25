import type { ServerType } from '@hono/node-server';
import { createNodeWebSocket } from '@hono/node-ws';
import { Hono, type MiddlewareHandler } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { createLinkAuth, tokensMatch } from './auth.js';
import type { SessionHub } from './session-hub.js';

export const AUTH_COOKIE = 'ui_session';

export interface AppOptions {
  hub: SessionHub;
  linkToken: string;
  sessionSecret: string;
}

export function createApp({ hub, linkToken, sessionSecret }: AppOptions) {
  const app = new Hono();
  const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });
  const linkAuth = createLinkAuth(linkToken);

  const requireSession: MiddlewareHandler = async (c, next) => {
    if (!tokensMatch(getCookie(c, AUTH_COOKIE) ?? '', sessionSecret)) {
      return c.json({ error: 'Not signed in. Open the link printed in the terminal.' }, 401);
    }
    await next();
  };

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

  app.get(
    '/ws',
    requireSession,
    upgradeWebSocket(() => {
      let unsubscribe: (() => void) | undefined;
      return {
        onOpen(_event, ws) {
          ws.send(JSON.stringify({ type: 'snapshot', sessions: hub.sessions() }));
          unsubscribe = hub.subscribe((message) => ws.send(JSON.stringify(message)));
        },
        onClose() {
          unsubscribe?.();
        },
      };
    }),
  );

  return { app, injectWebSocket: (server: ServerType) => injectWebSocket(server) };
}
