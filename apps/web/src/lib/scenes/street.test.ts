import { describe, expect, it } from 'vitest';
import { BUILDING } from './office.js';
import { CROSSING, lampSpots, lineRuns, LOT, parkingBays, STREET, TRAFFIC, trafficX, treeSpots, type TrafficCar } from './street.js';

const car: TrafficCar = { lane: 0, phase: 0, speed: 10, model: 'y', color: '#fff' };

describe('parkingBays', () => {
  const bays = parkingBays();

  it('fills the lot with whole bays', () => {
    expect(bays).toHaveLength(5);
    const last = bays.at(-1)!;
    expect(last.x + LOT.bayWidth / 2).toBeLessThanOrEqual(LOT.x2);
    expect(bays[0]!.x - LOT.bayWidth / 2).toBe(LOT.x1);
  });

  it('keeps every bay clear of the office', () => {
    for (const bay of bays) expect(bay.x - LOT.bayWidth / 2).toBeGreaterThan(BUILDING.right);
  });

  it('has some cars charging and some not', () => {
    const charging = bays.filter((bay) => bay.charging).length;
    expect(charging).toBeGreaterThan(0);
    expect(charging).toBeLessThan(bays.length);
  });

  it('parks cars inside the lot', () => {
    for (const bay of bays) expect(bay.carZ).toBeGreaterThan(LOT.z1);
  });
});

describe('trafficX', () => {
  it('starts at the left end for a near-lane car with no phase', () => {
    expect(trafficX(car, 0)).toBe(-STREET.length / 2);
  });

  it('moves near-lane cars to the right', () => {
    expect(trafficX(car, 1)).toBe(-STREET.length / 2 + 10);
  });

  it('moves far-lane cars to the left', () => {
    const far = { ...car, lane: 1 as const };
    expect(trafficX(far, 1)).toBeLessThan(trafficX(far, 0.5));
  });

  it('wraps round after a full street length', () => {
    expect(trafficX(car, STREET.length / 10)).toBeCloseTo(trafficX(car, 0));
  });

  it('keeps every car on the street at any time', () => {
    for (const each of TRAFFIC) {
      for (const seconds of [0, 7.3, 1000]) expect(Math.abs(trafficX(each, seconds))).toBeLessThanOrEqual(STREET.length / 2);
    }
  });
});

describe('street furniture', () => {
  const blocksView = (x: number) => x > BUILDING.left - 1 && x < BUILDING.right + 1;

  it('keeps near-side trees out of the office front and the lot', () => {
    const near = treeSpots().filter(([, z]) => z < STREET.road.z1);
    expect(near.length).toBeGreaterThan(0);
    for (const [x] of near) {
      expect(blocksView(x)).toBe(false);
      expect(x > LOT.x1 - 1 && x < LOT.x2 + 1).toBe(false);
    }
  });

  it('lines the far side with trees, leaving the view of the office open', () => {
    const far = treeSpots().filter(([, z]) => z > STREET.road.z2);
    expect(far.length).toBeGreaterThan(15);
    for (const [x] of far) expect(blocksView(x)).toBe(false);
  });

  it('points lamp arms over the road from both sides', () => {
    const lamps = lampSpots();
    expect(lamps.some((lamp) => lamp.facing === 1)).toBe(true);
    expect(lamps.some((lamp) => lamp.facing === -1)).toBe(true);
    for (const lamp of lamps) expect(blocksView(lamp.x)).toBe(false);
  });
});

describe('lineRuns', () => {
  const runs = lineRuns();

  it('stops lane lines short of the zebra crossing on both sides', () => {
    const [left, right] = runs as [typeof runs[0], typeof runs[0]];
    expect(left.x + left.length / 2).toBeLessThan(CROSSING.x - CROSSING.width / 2);
    expect(right.x - right.length / 2).toBeGreaterThan(CROSSING.x + CROSSING.width / 2);
  });

  it('runs out to both ends of the street', () => {
    const [left, right] = runs as [typeof runs[0], typeof runs[0]];
    expect(left.x - left.length / 2).toBeCloseTo(-STREET.length / 2);
    expect(right.x + right.length / 2).toBeCloseTo(STREET.length / 2);
  });
});
