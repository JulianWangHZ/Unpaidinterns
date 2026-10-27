import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { STATION, STATION_CANOPY, STATION_PLATFORM, STATION_POSTS } from './park-layout.js';
import {
  CAROUSEL,
  carPose,
  COASTER,
  COASTER_LAP_SECONDS,
  DROP,
  dropSeatPose,
  gondolaPivot,
  horsePose,
  riderPose,
  SEATED_HEIGHT,
  WHEEL,
} from './rides.js';

/**
 * Moving rides checked against what stands around them, sampled through a full cycle, so a ride
 * can never pass through its own frame, its station or its neighbours mid-motion.
 */

const STEP = 0.05;
const times = (until: number) => Array.from({ length: Math.ceil(until / STEP) }, (_, i) => i * STEP);

/** Points over a coaster car's outer surface, in world space. */
function carHull(car: number, seconds: number): Vector3[] {
  const { position, quaternion } = carPose(car, seconds);
  const hx = COASTER.carWidth / 2;
  const hz = COASTER.carLength / 2;
  const points: Vector3[] = [];
  for (const x of [-hx, 0, hx]) {
    for (const z of [-hz, -hz / 2, 0, hz / 2, hz]) {
      for (const y of [0.05, COASTER.carHeight]) points.push(new Vector3(x, y, z).applyQuaternion(quaternion).add(position));
    }
  }
  return points;
}

describe('roller coaster clearance', () => {
  const lap = times(COASTER_LAP_SECONDS);

  it('never lets one car run into the next', () => {
    for (const t of lap) {
      for (let car = 1; car < COASTER.cars; car += 1) {
        const gap = carPose(car - 1, t).position.distanceTo(carPose(car, t).position);
        expect(gap, `t=${t.toFixed(2)} car ${car}`).toBeGreaterThan(COASTER.carLength + 0.05);
      }
    }
  });

  it('keeps every car clear of the station posts', () => {
    for (const t of lap) {
      for (let car = 0; car < COASTER.cars; car += 1) {
        for (const p of carHull(car, t)) {
          for (const [px, , pz] of STATION_POSTS) {
            expect(Math.hypot(p.x - px, p.z - pz), `t=${t.toFixed(2)} car ${car}`).toBeGreaterThan(0.06 + 0.1);
          }
        }
      }
    }
  });

  it('runs above the platform and under the canopy through the station', () => {
    const [x1, , z] = STATION.from;
    const x2 = STATION.to[0];
    for (const t of lap) {
      for (let car = 0; car < COASTER.cars; car += 1) {
        for (const p of carHull(car, t)) {
          if (p.x < x1 - 0.6 || p.x > x2 + 0.6 || Math.abs(p.z - z) > 1.5) continue;
          expect(p.y < STATION_PLATFORM.top && p.z > STATION_PLATFORM.near, 'inside the platform').toBe(false);
          // Riders' heads reach about a metre above the car rim.
          expect(p.y + 1.0).toBeLessThan(STATION_CANOPY.bottom);
        }
      }
    }
  });
});

describe('ferris wheel clearance', () => {
  const turn = times((Math.PI * 2) / WHEEL.spin / WHEEL.cars + 1);
  const { width, depth, floorDrop } = WHEEL.cabin;

  it('keeps every cabin floor above the boarding platform', () => {
    for (const t of turn) {
      for (let i = 0; i < WHEEL.cars; i += 1) {
        expect(gondolaPivot(i, t)[1] - floorDrop).toBeGreaterThan(WHEEL.platformTop + 0.08);
      }
    }
  });

  it('keeps cabins inside the rims and clear of the platform railing', () => {
    expect(depth / 2).toBeLessThan(0.55 - 0.05);
    expect(depth / 2).toBeLessThan(Math.abs(WHEEL.railZ) - 0.1);
  });

  it('gives a seated rider headroom under the cabin roof', () => {
    const pivot = gondolaPivot(0, 0)[1];
    const head = riderPose('wheel', 0, 0, [0, 0, 0]).position.y + SEATED_HEIGHT;
    // The roof trim hangs 0.06 below the roof line.
    expect(head).toBeLessThan(pivot - WHEEL.cabin.roofDrop - 0.06);
  });

  it('never lets neighbouring cabins touch as they swing round', () => {
    for (const t of turn) {
      for (let i = 0; i < WHEEL.cars; i += 1) {
        const [ax, ay] = gondolaPivot(i, t);
        const [bx, by] = gondolaPivot((i + 1) % WHEEL.cars, t);
        // Cabins hang straight down, so they only meet if their columns and heights overlap.
        const sideBySide = Math.abs(ax - bx) < width + 0.05;
        const stacked = Math.abs(ay - by) < floorDrop + 0.05;
        expect(sideBySide && stacked, `t=${t.toFixed(2)} cabins ${i} and ${i + 1}`).toBe(false);
      }
    }
  });
});

describe('carousel clearance', () => {
  it('leaves room between one horse and the next', () => {
    const a = horsePose(0, 0).position.setY(0);
    const b = horsePose(1, 0).position.setY(0);
    expect(a.distanceTo(b)).toBeGreaterThan(CAROUSEL.horseLength + 0.08);
  });

  it('keeps hooves above the turntable at the bottom of the bob', () => {
    const lowestBack = CAROUSEL.saddle - CAROUSEL.bob;
    // Hooves hang about 0.45 below the horse's back.
    expect(lowestBack - 0.45).toBeGreaterThan(CAROUSEL.deck);
  });
});

describe('drop tower clearance', () => {
  it('stops the seats with the footrests above the deck', () => {
    for (const t of times(9)) {
      for (let i = 0; i < DROP.seats; i += 1) {
        expect(dropSeatPose(i, t).position.y - DROP.footrest).toBeGreaterThan(DROP.deck);
      }
    }
  });
});
