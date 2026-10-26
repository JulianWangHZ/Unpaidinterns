import { useEffect, useState } from 'react';
import { parseManifest, type SceneManifest } from './manifest.js';
import type { SceneId } from './types.js';

type Fetcher = (url: string) => Promise<Pick<Response, 'ok' | 'json'>>;

/**
 * Fetches /scenes/<id>/manifest.json. A missing file is normal and gives null;
 * a file that does not match the format is reported and also gives null.
 */
export async function loadSceneManifest(
  scene: SceneId,
  fetcher: Fetcher = (url) => fetch(url),
  warn: (message: string) => void = console.warn,
): Promise<SceneManifest | null> {
  const url = `/scenes/${scene}/manifest.json`;
  try {
    const response = await fetcher(url);
    if (!response.ok) return null;
    const parsed = parseManifest(await response.json());
    if (!parsed) warn(`Ignored ${url}: it does not match the scene model format.`);
    return parsed;
  } catch {
    return null;
  }
}

/** The current scene's model manifest, or null while loading or when the scene has none. */
export function useSceneManifest(scene: SceneId): SceneManifest | null {
  const [manifest, setManifest] = useState<SceneManifest | null>(null);
  useEffect(() => {
    let cancelled = false;
    setManifest(null);
    void loadSceneManifest(scene).then((loaded) => {
      if (!cancelled) setManifest(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [scene]);
  return manifest;
}
