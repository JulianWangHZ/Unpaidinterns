import { z } from 'zod';
import type { Pose } from '../island/behavior.js';
import type { SceneId } from './types.js';

// Only plain .glb file names inside the scene folder; no paths, no remote URLs.
const fileName = z.string().regex(/^[\w-]+\.glb$/);

const characterSchema = z.object({ file: fileName, scale: z.number().positive().max(10).default(1) });

const manifestSchema = z.object({
  characters: z
    .object({
      working: characterSchema,
      needsYou: characterSchema,
      resting: characterSchema,
      trouble: characterSchema,
    })
    .partial()
    .strict(),
});

export type SceneManifest = z.infer<typeof manifestSchema>;
export type CharacterModel = z.infer<typeof characterSchema>;

export function parseManifest(raw: unknown): SceneManifest | null {
  const parsed = manifestSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function modelUrl(scene: SceneId, file: string): string {
  return `/scenes/${scene}/${file}`;
}

/** Each pose falls back to one of the seven standard clips every character should ship with. */
const STANDARD_CLIP: Readonly<Record<Pose, string>> = {
  think: 'think',
  type: 'type',
  typeSlow: 'type',
  wave: 'wave',
  slump: 'slump',
  sip: 'idle',
  sing: 'wave',
  play: 'stretch',
  lounge: 'idle',
  workout: 'stretch',
  nap: 'idle',
};

export function clipFor(pose: Pose, clips: readonly string[], walking: boolean): string | null {
  const find = (name: string) => clips.find((clip) => clip.toLowerCase() === name.toLowerCase());
  const wanted = walking ? ['walk'] : [pose, STANDARD_CLIP[pose]];
  for (const name of [...wanted, 'idle']) {
    const match = find(name);
    if (match) return match;
  }
  return clips[0] ?? null;
}
