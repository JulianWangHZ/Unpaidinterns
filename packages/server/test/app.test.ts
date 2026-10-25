import { describe, expect, it } from 'vitest';
import { AUTH_COOKIE, createApp } from '../src/app.js';
import { SessionHub } from '../src/session-hub.js';

function setup() {
  const hub = new SessionHub();
  const { app } = createApp({ hub, linkToken: 'link', sessionSecret: 'secret' });
  return { hub, app };
}

const signedIn = { headers: { Cookie: `${AUTH_COOKIE}=secret` } };

describe('createApp', () => {
  it('serves health without auth', async () => {
    const res = await setup().app.request('/api/health');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it('rejects a wrong link token', async () => {
    const res = await setup().app.request('/api/auth?token=nope');
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({
      error: 'This link is invalid or was already used. Restart the server to get a new one.',
    });
  });

  it('sets a strict http-only cookie and redirects on a valid link', async () => {
    const res = await setup().app.request('/api/auth?token=link');
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/');
    const cookie = res.headers.get('set-cookie') ?? '';
    expect(cookie).toContain(`${AUTH_COOKIE}=secret`);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Strict');
  });

  it('refuses to reuse a link', async () => {
    const { app } = setup();
    await app.request('/api/auth?token=link');
    expect((await app.request('/api/auth?token=link')).status).toBe(401);
  });

  it('requires the cookie for sessions', async () => {
    const res = await setup().app.request('/api/sessions');
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Not signed in. Open the link printed in the terminal.' });
  });

  it('returns sessions when signed in', async () => {
    const { app, hub } = setup();
    hub.publish({ agent: 'claude', sessionId: 's1', cwd: '/w/a', project: 'a', state: 'done', ts: 5 });
    const res = await app.request('/api/sessions', signedIn);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ sessions: hub.sessions() });
  });
});
