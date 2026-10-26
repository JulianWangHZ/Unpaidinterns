import { describe, expect, it } from 'vitest';
import { loadSceneManifest } from './use-manifest.js';

const respond = (ok: boolean, body: unknown) => async () => ({ ok, json: async () => body });

describe('loadSceneManifest', () => {
  it('requests the scene folder manifest', async () => {
    const urls: string[] = [];
    await loadSceneManifest('park', async (url) => {
      urls.push(url);
      return { ok: true, json: async () => ({ characters: {} }) };
    });
    expect(urls).toEqual(['/scenes/park/manifest.json']);
  });

  it('returns a valid manifest', async () => {
    const manifest = { characters: { working: { file: 'staff.glb' } } };
    expect(await loadSceneManifest('office', respond(true, manifest))).toEqual({
      characters: { working: { file: 'staff.glb', scale: 1 } },
    });
  });

  it('treats a missing file as no manifest', async () => {
    expect(await loadSceneManifest('pool', respond(false, null))).toBeNull();
  });

  it('warns about and ignores a malformed manifest', async () => {
    const warnings: string[] = [];
    const result = await loadSceneManifest('pool', respond(true, { characters: { boss: {} } }), (m) => warnings.push(m));
    expect(result).toBeNull();
    expect(warnings).toEqual(['Ignored /scenes/pool/manifest.json: it does not match the scene model format.']);
  });

  it('returns null when the request fails', async () => {
    expect(await loadSceneManifest('office', async () => Promise.reject(new Error('offline')))).toBeNull();
  });
});
