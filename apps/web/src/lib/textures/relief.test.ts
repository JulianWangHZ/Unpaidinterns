import { describe, expect, it } from 'vitest';
import { fractal, hash, normalsFrom, paving, planks, rgb, shade, tileNoise } from './relief.js';

describe('hash and tileNoise', () => {
  it('is deterministic and stays in 0..1', () => {
    expect(hash(3, 7, 1)).toBe(hash(3, 7, 1));
    expect(hash(3, 7, 1)).not.toBe(hash(3, 7, 2));
    for (let i = 0; i < 50; i += 1) {
      const value = tileNoise(i * 0.37, i * 0.91, 8, 4);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });

  it('wraps round its period so textures tile without a seam', () => {
    expect(tileNoise(0.3, 1.7, 4, 9)).toBeCloseTo(tileNoise(4.3, 5.7, 4, 9));
  });
});

describe('fractal', () => {
  const field = fractal(32, 5);

  it('fills a square field with values in 0..1', () => {
    expect(field.data).toHaveLength(32 * 32);
    expect(Math.min(...field.data)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...field.data)).toBeLessThanOrEqual(1);
  });

  it('matches across opposite edges', () => {
    const left = field.data[5 * 32] as number;
    const nextPastRight = fractal(32, 5).data[5 * 32] as number;
    expect(left).toBe(nextPastRight);
    expect(Math.abs((field.data[0] as number) - (field.data[31] as number))).toBeLessThan(0.2);
  });
});

describe('paving', () => {
  it('drops to grout at a joint and is full on the face', () => {
    expect(paving(0, 4, 64, 4, 8).face).toBe(0);
    expect(paving(8, 4, 64, 4, 8).face).toBe(1);
  });

  it('shifts every other row by half a sett', () => {
    const even = paving(0, 4, 64, 4, 8);
    const odd = paving(0, 12, 64, 4, 8);
    expect(even.face).toBeLessThan(0.5);
    expect(odd.face).toBe(1);
  });

  it('gives neighbouring setts different ids', () => {
    expect(paving(8, 4, 64, 4, 8).id).not.toBe(paving(24, 4, 64, 4, 8).id);
  });
});

describe('planks', () => {
  it('has a seam between boards and a full face across each board', () => {
    expect(planks(0, 64, 4).face).toBe(0);
    expect(planks(8, 64, 4).face).toBe(1);
    expect(planks(8, 64, 4).id).not.toBe(planks(24, 64, 4).id);
  });
});

describe('normalsFrom', () => {
  it('points straight up on a flat field', () => {
    const flat = { size: 4, data: new Float32Array(16).fill(0.5) };
    const normals = normalsFrom(flat, 2);
    expect(Array.from(normals.slice(0, 4))).toEqual([128, 128, 255, 255]);
  });

  it('tilts away from a rise', () => {
    const data = new Float32Array(16);
    data[2] = 1;
    const normals = normalsFrom({ size: 4, data }, 2);
    expect(normals[4]).toBeLessThan(128);
  });
});

describe('rgb and shade', () => {
  it('parses hex and scales brightness within byte range', () => {
    expect(rgb('#ff8000')).toEqual([255, 128, 0]);
    expect(shade([200, 100, 0], 2)).toEqual([255, 200, 0]);
    expect(shade([200, 100, 0], 0.5)).toEqual([100, 50, 0]);
  });
});
