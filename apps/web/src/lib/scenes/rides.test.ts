import { Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import {
  CAR_GAP,
  CAROUSEL,
  carPose,
  carProgress,
  COASTER,
  DROP,
  dropSeatPose,
  COASTER_LAP_SECONDS,
  coasterTrack,
  gondolaPose,
  horsePose,
  RIDE_SEATS,
  riderPose,
  SIT_DROP,
  trackFrame,
  trainProgress,
  WHEEL,
} from './rides.js';

const forwardOf = (q: { x: number; y: number; z: number; w: number }) => new Vector3(0, 0, 1).applyQuaternion(q as never);

describe('carousel', () => {
  it('keeps every horse on the ring at its saddle height', () => {
    for (let i = 0; i < CAROUSEL.horses; i += 1) {
      const { position } = horsePose(i, 3.3);
      expect(Math.hypot(position.x, position.z)).toBeCloseTo(CAROUSEL.ring);
      expect(Math.abs(position.y - CAROUSEL.saddle)).toBeLessThanOrEqual(CAROUSEL.bob + 1e-9);
    }
  });

  it('points each horse along its path, not at the centre', () => {
    const { position, quaternion } = horsePose(2, 1.7);
    const forward = forwardOf(quaternion);
    const radial = new Vector3(position.x, 0, position.z).normalize();
    expect(Math.abs(forward.dot(radial))).toBeLessThan(1e-6);
    const later = horsePose(2, 1.75).position;
    // Compare on the ground plane: the bob moves the horse up and down as well.
    const step = later.clone().sub(position).setY(0).normalize();
    expect(step.dot(forward)).toBeGreaterThan(0.99);
  });
});

describe('ferris wheel', () => {
  it('keeps the lowest car above the ground', () => {
    for (let t = 0; t < 80; t += 0.5) {
      for (let i = 0; i < WHEEL.cars; i += 1) expect(gondolaPose(i, t).position.y).toBeGreaterThan(0.3);
    }
  });

  it('keeps cars level whatever the wheel angle', () => {
    expect(gondolaPose(0, 0).quaternion.equals(gondolaPose(3, 21).quaternion)).toBe(true);
  });
});

describe('roller coaster', () => {
  it('runs one lap in a sensible time and wraps round', () => {
    expect(COASTER_LAP_SECONDS).toBeGreaterThan(10);
    expect(COASTER_LAP_SECONDS).toBeLessThan(60);
    expect(trainProgress(0)).toBeCloseTo(0);
    expect(trainProgress(COASTER_LAP_SECONDS + 2)).toBeCloseTo(trainProgress(2), 5);
  });

  it('always moves forward', () => {
    let last = trainProgress(0);
    for (let t = 0.1; t < COASTER_LAP_SECONDS; t += 0.1) {
      const now = trainProgress(t);
      expect(now).toBeGreaterThanOrEqual(last);
      last = now;
    }
  });

  it('crawls up the lift hill and races down the drop', () => {
    const speedAt = (u: number) => {
      let t = 0;
      while (trainProgress(t) < u) t += 0.02;
      return (trainProgress(t + 0.2) - trainProgress(t)) / 0.2;
    };
    const highest = coasterTrack.getSpacedPoints(200).reduce((best, p, i, all) => (p.y > (all[best] as Vector3).y ? i : best), 0) / 200;
    expect(speedAt(Math.min(0.99, highest + 0.12))).toBeGreaterThan(speedAt(highest - 0.02));
  });

  it('keeps the cars in a line behind the front one', () => {
    expect(carProgress(1, 5)).toBeCloseTo((trainProgress(5) - CAR_GAP + 1) % 1);
  });

  it('faces cars along the track and keeps them upright', () => {
    for (const u of [0.05, 0.3, 0.55, 0.8]) {
      const q = trackFrame(u);
      expect(forwardOf(q).dot(coasterTrack.getTangentAt(u))).toBeCloseTo(1);
      expect(new Vector3(0, 1, 0).applyQuaternion(q).y).toBeGreaterThan(0.3);
    }
  });

  it('puts both riders of a car on its two seats, either side of the middle', () => {
    const car = carPose(0, 4);
    const left = riderPose('coaster', 0, 4, [0, 0, 0]).position;
    const right = riderPose('coaster', 1, 4, [0, 0, 0]).position;
    expect(left.distanceTo(right)).toBeCloseTo(COASTER.seatX * 2);
    expect(left.clone().add(right).multiplyScalar(0.5).distanceTo(car.position)).toBeLessThan(0.2);
  });
});

describe('riderPose', () => {
  it('sits carousel riders on their horse, offset from the carousel centre', () => {
    const centre: [number, number, number] = [5, 0, 4];
    const rider = riderPose('carousel', 3, 2, centre).position;
    const horse = horsePose(3, 2).position.add(new Vector3(...centre));
    expect(horse.x - rider.x).toBeCloseTo(0);
    expect(horse.y - rider.y).toBeCloseTo(SIT_DROP);
  });

  it('wraps seats past the ride capacity back onto existing seats', () => {
    for (const ride of ['carousel', 'coaster', 'wheel', 'drop', 'slide'] as const) {
      const first = riderPose(ride, 0, 1, [0, 0, 0]).position;
      expect(riderPose(ride, RIDE_SEATS[ride], 1, [0, 0, 0]).position.distanceTo(first)).toBeCloseTo(0);
    }
  });
});

describe('drop tower seats', () => {
  it('face outward from the tower, rising and falling with the carriage', () => {
    const { position, quaternion } = dropSeatPose(3, 2);
    const outward = new Vector3(position.x, 0, position.z).normalize();
    expect(forwardOf(quaternion).dot(outward)).toBeCloseTo(1);
    expect(Math.hypot(position.x, position.z)).toBeCloseTo(DROP.seatRing);
    expect(dropSeatPose(3, 5.5).position.y).toBeGreaterThan(dropSeatPose(3, 0.5).position.y + 5);
  });

  it('spreads the seats evenly round the ring', () => {
    const a = dropSeatPose(0, 0).position;
    const b = dropSeatPose(1, 0).position;
    expect(a.distanceTo(b)).toBeCloseTo(2 * DROP.seatRing * Math.sin(Math.PI / DROP.seats));
  });
});
