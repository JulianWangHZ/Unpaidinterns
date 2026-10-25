import type { Session } from '@unpaidinterns/core';
import { describe, expect, it } from 'vitest';
import { placeAgents } from './behavior.js';

const MIN = 60_000;
const NOW = 100 * MIN;

const session = (sessionId: string, state: Session['state'], ageMs = 5 * MIN, parentSessionId?: string): Session => ({
  agent: 'claude',
  sessionId,
  cwd: '/w/a',
  project: 'a',
  state,
  startedAt: 0,
  updatedAt: NOW - ageMs,
  ...(parentSessionId ? { parentSessionId } : {}),
});

describe('placeAgents', () => {
  it('keeps working agents at their desks with a pose per state', () => {
    const placed = placeAgents([session('a', 'thinking'), session('b', 'running'), session('c', 'writing')], NOW);
    expect(placed.get('a')).toEqual({ at: { kind: 'desk' }, pose: 'think' });
    expect(placed.get('b')?.pose).toBe('type');
    expect(placed.get('c')?.pose).toBe('typeSlow');
  });

  it('keeps an agent that needs the user at the desk, waving', () => {
    expect(placeAgents([session('a', 'waiting')], NOW).get('a')).toEqual({ at: { kind: 'desk' }, pose: 'wave' });
  });

  it('slumps at the desk on error', () => {
    expect(placeAgents([session('a', 'error')], NOW).get('a')?.pose).toBe('slump');
  });

  it('sends a just-finished agent to the coffee bar first', () => {
    expect(placeAgents([session('a', 'done', 20_000)], NOW).get('a')).toEqual({
      at: { kind: 'amenity', amenity: 'coffee', seat: 0 },
      pose: 'sip',
    });
  });

  it('sends long-idle agents to the nap pods', () => {
    expect(placeAgents([session('a', 'idle', 26 * MIN)], NOW).get('a')?.at).toEqual({
      kind: 'amenity',
      amenity: 'nap',
      seat: 0,
    });
  });

  it('pairs resting agents for KTV, then ping-pong, then solo amenities', () => {
    const resting = ['a', 'b', 'c', 'd', 'e'].map((id) => session(id, 'done'));
    const placed = placeAgents(resting, NOW);
    expect(placed.get('a')?.at).toEqual({ kind: 'amenity', amenity: 'ktv', seat: 0 });
    expect(placed.get('b')?.at).toEqual({ kind: 'amenity', amenity: 'ktv', seat: 1 });
    expect(placed.get('c')?.at).toEqual({ kind: 'amenity', amenity: 'pingpong', seat: 0 });
    expect(placed.get('d')?.at).toEqual({ kind: 'amenity', amenity: 'pingpong', seat: 1 });
    expect(placed.get('e')?.at).toEqual({ kind: 'amenity', amenity: 'kitchen', seat: 0 });
  });

  it('sends a lone resting agent to a solo amenity instead of KTV', () => {
    expect(placeAgents([session('a', 'done')], NOW).get('a')?.at).toMatchObject({ amenity: 'kitchen' });
  });

  it('makes interns follow their parent', () => {
    const placed = placeAgents([session('p', 'done', 20_000), session('p/i', 'running', 1000, 'p')], NOW);
    expect(placed.get('p/i')).toEqual({ at: { kind: 'withParent', parentSessionId: 'p' }, pose: 'type' });
  });
});
