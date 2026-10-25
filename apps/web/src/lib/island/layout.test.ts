import type { Session } from '@unpaidinterns/core';
import { describe, expect, it } from 'vitest';
import { hexDistance, hexKey } from './hex.js';
import { AMENITIES, assignSlots, buildLayout } from './layout.js';

const session = (sessionId: string, project: string, startedAt = 0, parentSessionId?: string): Session => ({
  agent: 'claude',
  sessionId,
  cwd: `/w/${project}`,
  project,
  state: 'running',
  startedAt,
  updatedAt: startedAt,
  ...(parentSessionId ? { parentSessionId } : {}),
});

describe('assignSlots', () => {
  it('keeps saved slots and gives new projects the lowest free slot', () => {
    expect(assignSlots(['a', 'b', 'c'], { b: 0 })).toEqual({ b: 0, a: 1, c: 2 });
  });

  it('drops nothing when a saved project is currently absent', () => {
    expect(assignSlots(['a'], { gone: 0 })).toEqual({ gone: 0, a: 1 });
  });
});

describe('buildLayout', () => {
  it('always places all eight amenities in the middle', () => {
    const layout = buildLayout([], {});
    expect(layout.amenities.map((a) => a.amenity)).toEqual([...AMENITIES]);
    expect(layout.amenities.every((a) => hexDistance(a.hex, { q: 0, r: 0 }) <= 2)).toBe(true);
    expect(layout.radius).toBe(4);
  });

  it('gives each project its own district with one seat per main session', () => {
    const sessions = [
      session('s1', 'web', 1),
      session('s2', 'web', 2),
      session('s2/agent-a', 'web', 3, 's2'),
      session('s3', 'api', 1),
    ];
    const layout = buildLayout(sessions, assignSlots(['web', 'api'], {}));
    const web = layout.districts.find((d) => d.project === 'web');
    const api = layout.districts.find((d) => d.project === 'api');
    expect(web?.seats.map((s) => s.sessionId)).toEqual(['s1', 's2']);
    expect(api?.seats.map((s) => s.sessionId)).toEqual(['s3']);
    expect(web?.color).not.toBe(api?.color);
  });

  it('never seats anyone on an amenity or in the walkway ring', () => {
    const sessions = Array.from({ length: 12 }, (_, i) => session(`s${i}`, `p${i % 4}`, i));
    const layout = buildLayout(sessions, assignSlots(['p0', 'p1', 'p2', 'p3'], {}));
    const seats = layout.districts.flatMap((d) => d.seats);
    expect(seats).toHaveLength(12);
    expect(seats.every((seat) => hexDistance(seat.hex, { q: 0, r: 0 }) >= 3)).toBe(true);
    expect(new Set(seats.map((seat) => hexKey(seat.hex))).size).toBe(12);
  });

  it('keeps seats next to each other inside a district', () => {
    const sessions = Array.from({ length: 4 }, (_, i) => session(`s${i}`, 'web', i));
    const [district] = buildLayout(sessions, { web: 0 }).districts;
    const seats = district?.seats ?? [];
    for (const seat of seats.slice(1)) {
      expect(seats.some((other) => other !== seat && hexDistance(other.hex, seat.hex) === 1)).toBe(true);
    }
  });

  it('grows the island when districts reach the edge', () => {
    const sessions = Array.from({ length: 30 }, (_, i) => session(`s${i}`, 'big', i));
    const layout = buildLayout(sessions, { big: 0 });
    const farthest = Math.max(...layout.districts[0]!.seats.map((s) => hexDistance(s.hex, { q: 0, r: 0 })));
    expect(layout.radius).toBe(farthest + 1);
    expect(layout.tiles).toHaveLength(1 + 3 * layout.radius * (layout.radius + 1));
  });

  it('labels every tile by kind', () => {
    const layout = buildLayout([session('s1', 'web')], { web: 0 });
    const kinds = new Set(layout.tiles.map((tile) => tile.kind));
    expect(kinds).toEqual(new Set(['amenity', 'district', 'empty']));
  });
});
