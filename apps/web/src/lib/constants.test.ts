import { describe, expect, it } from 'vitest';
import { ROOM_ACCENT } from '../components/island/office/palette.js';
import { AGENT_KINDS, AGENT_NAMES } from './agents.js';
import { ROOMS } from './scenes/office.js';

describe('shared constants', () => {
  it('names every agent kind', () => {
    expect(AGENT_KINDS.map((kind) => AGENT_NAMES[kind])).toEqual(['Claude', 'Codex', 'Gemini']);
  });

  it('gives every office room an accent colour', () => {
    for (const id of Object.keys(ROOMS)) {
      expect(ROOM_ACCENT[id as keyof typeof ROOM_ACCENT]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
