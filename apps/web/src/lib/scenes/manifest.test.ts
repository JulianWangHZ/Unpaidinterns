import { describe, expect, it } from 'vitest';
import { clipFor, modelUrl, parseManifest } from './manifest.js';

describe('parseManifest', () => {
  it('accepts characters per state group', () => {
    expect(parseManifest({ characters: { working: { file: 'staff.glb', scale: 0.9 } } })).toEqual({
      characters: { working: { file: 'staff.glb', scale: 0.9 } },
    });
  });

  it('defaults scale to 1', () => {
    expect(parseManifest({ characters: { resting: { file: 'a.glb' } } })?.characters.resting?.scale).toBe(1);
  });

  it.each([
    null,
    { characters: { working: { file: '../secret.glb' } } },
    { characters: { working: { file: 'https://example.com/a.glb' } } },
    { characters: { working: { file: 'a.png' } } },
    { characters: { boss: { file: 'a.glb' } } },
  ])('rejects %j', (raw) => {
    expect(parseManifest(raw)).toBeNull();
  });
});

describe('modelUrl', () => {
  it('builds a path inside the scene folder', () => {
    expect(modelUrl('park', 'mascot.glb')).toBe('/scenes/park/mascot.glb');
  });
});

describe('clipFor', () => {
  const all = ['idle', 'think', 'type', 'wave', 'stretch', 'slump', 'walk'];

  it('uses a clip named after the pose when present', () => {
    expect(clipFor('sip', ['idle', 'sip'], false)).toBe('sip');
  });

  it('maps poses onto the standard clip set', () => {
    expect(clipFor('typeSlow', all, false)).toBe('type');
    expect(clipFor('sing', all, false)).toBe('wave');
    expect(clipFor('workout', all, false)).toBe('stretch');
  });

  it('plays walk while moving', () => {
    expect(clipFor('type', all, true)).toBe('walk');
  });

  it('falls back to idle, then to the first clip', () => {
    expect(clipFor('slump', ['idle'], false)).toBe('idle');
    expect(clipFor('slump', ['Armature|Dance'], false)).toBe('Armature|Dance');
    expect(clipFor('slump', [], false)).toBeNull();
  });

  it('matches clip names case-insensitively', () => {
    expect(clipFor('wave', ['Idle', 'Wave'], false)).toBe('Wave');
  });
});
