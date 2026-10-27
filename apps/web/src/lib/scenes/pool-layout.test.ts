import { describe, expect, it } from 'vitest';
import { spotAtActivity } from './index.js';
import { pool } from './pool.js';
import {
  BAR,
  CABANA,
  DECK,
  groundDistance,
  HOT_TUB,
  inRect,
  LAP_POOL,
  laneSpot,
  LIFEGUARD,
  LOUNGERS,
  PALMS,
  SLIDE,
  slideCurve,
  slideProgress,
  slideRider,
  SPLASH_POOL,
  WATER,
} from './pool-layout.js';
import { SEATED_HEIGHT, SIT_DROP } from './rides.js';
import { ACTIVITIES, type Vec3 } from './types.js';

/** People on the deck: the first few at every activity that is not a ride or a fixed seat. */
function deckPeople(): Vec3[] {
  return ACTIVITIES.flatMap((activity) => {
    const skip = (pool.rides?.[activity]?.seats ?? 0) + (pool.activitySeats?.[activity]?.length ?? 0);
    return [0, 1, 2].map((n) => spotAtActivity(pool, activity, skip + n).position);
  });
}

/** Big things standing on the deck, each with the ground it covers. */
const OBSTACLES: ReadonlyArray<{ name: string; at: Vec3; radius: number }> = [
  { name: 'hot tub', at: HOT_TUB.at, radius: HOT_TUB.radius + 0.25 },
  { name: 'slide tower', at: SLIDE.tower, radius: 1.0 },
  { name: 'bar', at: BAR.at, radius: 1.0 },
  { name: 'lifeguard chair', at: LIFEGUARD, radius: 0.5 },
  ...PALMS.map((at) => ({ name: 'palm', at, radius: 0.4 })),
];

describe('swimmers', () => {
  it('tread water inside the lap pool with their heads above the surface', () => {
    for (let i = 0; i < 60; i += 1) {
      const spot = laneSpot(i);
      expect(inRect(spot, LAP_POOL, -0.4), `swimmer ${i}`).toBe(true);
      // A standing figure is about 1.2 tall: chin around 0.85, top of head 1.2.
      expect(spot[1] + 0.85).toBeGreaterThan(WATER - 0.05);
      expect(spot[1] + 0.45).toBeLessThan(WATER);
      expect(spot[1]).toBeGreaterThan(WATER - LAP_POOL.depth);
    }
  });

  it('gives everyone in the pool room to swim', () => {
    for (let i = 0; i < 60; i += 1) {
      for (let j = i + 1; j < 60; j += 1) expect(groundDistance(laneSpot(i), laneSpot(j))).toBeGreaterThan(0.6);
    }
  });
});

describe('hot tub', () => {
  it('seats bathers chest-deep with their heads well clear of the water', () => {
    for (const spot of pool.activitySeats?.ballpit ?? []) {
      const origin = HOT_TUB.at[1] + spot.position[1];
      expect(origin + SIT_DROP).toBeCloseTo(HOT_TUB.bench);
      expect(origin + SEATED_HEIGHT).toBeGreaterThan(HOT_TUB.water + 0.3);
      expect(origin + 0.35).toBeLessThan(HOT_TUB.water);
      expect(Math.hypot(spot.position[0], spot.position[2])).toBeLessThan(HOT_TUB.radius - 0.2);
    }
  });
});

describe('water slide', () => {
  it('starts on the tower platform and ends low over the splash pool', () => {
    const start = slideCurve.getPointAt(0);
    const end = slideCurve.getPointAt(1);
    expect(start.y).toBeCloseTo(SLIDE.top + 0.05);
    expect(groundDistance([start.x, 0, start.z], SLIDE.tower)).toBeLessThan(0.9);
    expect(inRect([end.x, 0, end.z], SPLASH_POOL, -0.3)).toBe(true);
    expect(end.y - WATER).toBeLessThan(0.3);
  });

  it('always runs downhill', () => {
    let last = Infinity;
    for (let u = 0; u <= 1; u += 0.01) {
      const y = slideCurve.getPointAt(u).y;
      expect(y).toBeLessThanOrEqual(last + 1e-6);
      last = y;
    }
  });

  it('stays clear of the tower legs and the other structures on the way down', () => {
    for (let u = 0.08; u <= 1; u += 0.01) {
      const p = slideCurve.getPointAt(u);
      const ground: Vec3 = [p.x, 0, p.z];
      expect(inRect(ground, DECK, -0.6), `u=${u.toFixed(2)}`).toBe(true);
      expect(groundDistance(ground, BAR.at)).toBeGreaterThan(1.6);
      expect(groundDistance(ground, HOT_TUB.at)).toBeGreaterThan(HOT_TUB.radius + 0.6);
    }
  });

  it('spreads riders out and keeps them in order down the flume', () => {
    expect(slideProgress(0, 0)).toBe(0);
    for (const t of [1, 2.5, 4, 6]) {
      const places = Array.from({ length: SLIDE.riders }, (_, s) => slideRider(s, t, SIT_DROP).position);
      for (let a = 0; a < places.length; a += 1) {
        for (let b = a + 1; b < places.length; b += 1) {
          const same = slideProgress(a, t) === 0 && slideProgress(b, t) === 0;
          if (!same) expect((places[a] as { distanceTo(o: unknown): number }).distanceTo(places[b])).toBeGreaterThan(0.6);
        }
      }
    }
  });
});

describe('pool club layout', () => {
  it('keeps every deck activity on dry deck, clear of the pools', () => {
    for (const spot of deckPeople()) {
      expect(inRect(spot, DECK, -0.3)).toBe(true);
      expect(inRect(spot, LAP_POOL, 0.3)).toBe(false);
      expect(inRect(spot, SPLASH_POOL, 0.3)).toBe(false);
    }
  });

  it('keeps people clear of the big furniture', () => {
    for (const spot of deckPeople()) {
      for (const obstacle of OBSTACLES) {
        expect(groundDistance(spot, obstacle.at), `${obstacle.name} vs ${spot}`).toBeGreaterThan(obstacle.radius + 0.3);
      }
    }
  });

  it('keeps the pools, bar, cabana and loungers apart', () => {
    expect(inRect(HOT_TUB.at, LAP_POOL, HOT_TUB.radius + 0.4)).toBe(false);
    expect(inRect(BAR.at, SPLASH_POOL, 1.2)).toBe(false);
    expect(inRect(CABANA.at, LAP_POOL, 1.2)).toBe(false);
    expect(inRect(LOUNGERS.at, LAP_POOL, 0.5)).toBe(false);
    expect(LAP_POOL.x2).toBeLessThan(SPLASH_POOL.x1 - 1.5);
  });

  it('sets the lifeguard chair at the side of the lap pool', () => {
    expect(LIFEGUARD[0]).toBeGreaterThan(LAP_POOL.x2);
    expect(LIFEGUARD[0] - LAP_POOL.x2).toBeLessThan(1.2);
  });
});
