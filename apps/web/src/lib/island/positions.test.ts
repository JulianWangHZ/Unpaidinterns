import { describe, expect, it } from 'vitest';
import { amenitySeat, deskSpot, HEX_SIZE, internOffset } from './positions.js';

describe('positions', () => {
  it('puts the agent behind the desk, facing it', () => {
    const spot = deskSpot({ q: 0, r: 0 });
    expect(spot.position[1]).toBe(0);
    expect(spot.position[2]).toBeGreaterThan(0);
    expect(spot.facing).toBeCloseTo(Math.PI);
  });

  it('spreads amenity seats around the tile and faces the middle', () => {
    const seats = [0, 1, 2, 3].map((seat) => amenitySeat({ q: 0, r: 0 }, seat));
    const keys = new Set(seats.map((s) => s.position.map((v) => v.toFixed(2)).join()));
    expect(keys.size).toBe(4);
    for (const seat of seats) {
      const [x, , z] = seat.position;
      expect(Math.hypot(x, z)).toBeLessThan(HEX_SIZE);
      const towardCentre = Math.atan2(-x, -z);
      expect(Math.cos(seat.facing - towardCentre)).toBeCloseTo(1);
    }
  });

  it('wraps seats beyond the fourth onto a second, wider circle', () => {
    const first = amenitySeat({ q: 0, r: 0 }, 0).position;
    const fifth = amenitySeat({ q: 0, r: 0 }, 4).position;
    expect(Math.hypot(fifth[0], fifth[2])).toBeGreaterThan(Math.hypot(first[0], first[2]));
  });

  it('stands interns next to their parent', () => {
    const [x, y, z] = internOffset([1, 0, 1]);
    expect(y).toBe(0);
    expect(Math.hypot(x - 1, z - 1)).toBeGreaterThan(0.3);
  });
});
