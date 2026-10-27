import { describe, expect, it } from 'vitest';
import { spotAtActivity } from './index.js';
import { park } from './park.js';
import { QUEUE_LANES, queueEntrance, queueLines, queueSignSpot, COASTER_POINTS, DROP_CYCLE, dropTowerHeight, FOUNTAIN, footprints, GATE, GROUNDS, groundDistance, PATHS, PLAZA, RIDES } from './park-layout.js';
import { ACTIVITIES, type Vec3 } from './types.js';

const inside = ([x, , z]: Vec3, margin = 0) => x > GROUNDS.x1 + margin && x < GROUNDS.x2 - margin && z > GROUNDS.z1 + margin && z < GROUNDS.z2 - margin;

/**
 * Where people stand on the ground: the first few people at every activity, the first few waiting
 * past a ride's capacity, and the first twelve booths. Riders are on the ride, so they are left out.
 */
function peopleSpots(): Vec3[] {
  const atActivities = ACTIVITIES.flatMap((activity) => {
    const skip = park.rides?.[activity]?.seats ?? 0;
    return [0, 1, 2, 3].map((n) => spotAtActivity(park, activity, skip + n).position);
  });
  const atBooths = Array.from({ length: 12 }, (_, i) => park.seatAt(i, 'claude', i).position);
  return [...atActivities, ...atBooths];
}

describe('park layout', () => {
  it('keeps every ride, the fountain and the coaster track clear of people', () => {
    for (const footprint of footprints()) {
      for (const spot of peopleSpots()) {
        expect(groundDistance(footprint.at, spot), `${footprint.at} vs ${spot}`).toBeGreaterThan(footprint.radius + 0.4);
      }
    }
  });

  it('builds everything inside the fence', () => {
    for (const footprint of footprints()) expect(inside(footprint.at, footprint.radius * 0.5)).toBe(true);
    for (const spot of peopleSpots()) expect(inside(spot, 1)).toBe(true);
  });

  it('keeps the ferris wheel and drop tower apart from each other and the coaster', () => {
    expect(groundDistance(RIDES.ferrisWheel.at, RIDES.dropTower.at)).toBeGreaterThan(RIDES.ferrisWheel.radius + RIDES.dropTower.radius);
    for (const point of COASTER_POINTS) {
      expect(groundDistance(point, RIDES.ferrisWheel.at)).toBeGreaterThan(RIDES.ferrisWheel.radius + 1);
    }
  });

  it('gives the coaster a lift hill and keeps the track off the ground', () => {
    const heights = COASTER_POINTS.map(([, y]) => y);
    expect(Math.max(...heights)).toBeGreaterThan(5);
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(1);
  });

  it('puts the gate on the front fence and the fountain between it and the plaza', () => {
    expect(GATE.z).toBe(GROUNDS.z2);
    expect(FOUNTAIN.at[2]).toBeGreaterThan(PLAZA.centre[2]);
    expect(FOUNTAIN.at[2]).toBeLessThan(GATE.z);
  });

  it('starts every path on the ground inside the park', () => {
    for (const [from, to] of PATHS) {
      expect(inside(from)).toBe(true);
      expect(inside(to, -0.01)).toBe(true);
    }
  });
});

describe('dropTowerHeight', () => {
  it('climbs from the bottom to the top, waits, then drops back', () => {
    expect(dropTowerHeight(0)).toBeCloseTo(0.75);
    expect(dropTowerHeight(2.5)).toBeGreaterThan(dropTowerHeight(1));
    expect(dropTowerHeight(5.5)).toBeCloseTo(RIDES.dropTower.height - 1.4);
    expect(dropTowerHeight(6.6)).toBeLessThan(dropTowerHeight(6.3));
    expect(dropTowerHeight(8)).toBeCloseTo(0.75);
  });

  it('never leaves the tower', () => {
    for (let t = -3; t < DROP_CYCLE * 2; t += 0.05) {
      const y = dropTowerHeight(t);
      expect(y).toBeGreaterThanOrEqual(0.75 - 1e-9);
      expect(y).toBeLessThanOrEqual(RIDES.dropTower.height - 1.4 + 1e-9);
    }
  });

  it('repeats every ride', () => {
    expect(dropTowerHeight(3.2 + DROP_CYCLE)).toBeCloseTo(dropTowerHeight(3.2));
  });
});

describe('ride queues', () => {
  const lanes = Object.values(QUEUE_LANES);

  it('spaces stanchions evenly and close enough for a rope between each pair', () => {
    for (const lane of lanes) {
      for (const posts of queueLines(lane)) {
        for (let i = 1; i < posts.length; i += 1) {
          const gap = groundDistance(posts[i - 1] as Vec3, posts[i] as Vec3);
          expect(gap).toBeGreaterThan(0.3);
          expect(gap).toBeLessThanOrEqual(0.71);
        }
      }
    }
  });

  it('leaves alternate inner lines open at opposite ends so the lanes join up', () => {
    const lines = queueLines(QUEUE_LANES.wheel);
    const width = (line: Vec3[]) => groundDistance(line[0] as Vec3, line.at(-1) as Vec3);
    expect(width(lines.at(-1) as Vec3[])).toBeCloseTo(QUEUE_LANES.wheel.width);
    expect(width(lines[0] as Vec3[])).toBeLessThan(QUEUE_LANES.wheel.width - 0.5);
  });

  it('puts each entrance and its sign well apart from every other ride', () => {
    const spots = lanes.map((lane) => queueSignSpot(lane));
    for (let i = 0; i < spots.length; i += 1) {
      for (let j = i + 1; j < spots.length; j += 1) expect(groundDistance(spots[i] as Vec3, spots[j] as Vec3)).toBeGreaterThan(4);
    }
  });

  it('keeps each sign next to its own queue entrance, nearer it than any other ride', () => {
    const rides = { wheel: RIDES.ferrisWheel.at, drop: RIDES.dropTower.at } as const;
    for (const key of ['wheel', 'drop'] as const) {
      const sign = queueSignSpot(QUEUE_LANES[key]);
      expect(groundDistance(sign, queueEntrance(QUEUE_LANES[key]))).toBeLessThan(1.2);
      const other = key === 'wheel' ? rides.drop : rides.wheel;
      expect(groundDistance(sign, rides[key])).toBeLessThan(groundDistance(sign, other));
    }
  });

  it('starts each queue at its ride and keeps it out of the ride itself', () => {
    expect(groundDistance(QUEUE_LANES.wheel.gate, RIDES.ferrisWheel.at)).toBeLessThan(RIDES.ferrisWheel.radius);
    for (const posts of queueLines(QUEUE_LANES.drop)) {
      for (const post of posts) expect(groundDistance(post, RIDES.dropTower.at)).toBeGreaterThan(RIDES.dropTower.radius + 0.4);
    }
  });
});
