import { describe, expect, it } from 'vitest';
import { placeTip } from './tip-position.js';

const view = { width: 1000, height: 800 };
const size = { width: 320, height: 200 };

describe('placeTip', () => {
  it('sits below and right of the pointer when there is room', () => {
    expect(placeTip({ x: 100, y: 100 }, size, view)).toEqual({ left: 116, top: 116 });
  });

  it('flips to the left near the right edge', () => {
    expect(placeTip({ x: 900, y: 100 }, size, view).left).toBe(900 - 320 - 16);
  });

  it('lifts up near the bottom edge without going off the top', () => {
    expect(placeTip({ x: 100, y: 750 }, size, view).top).toBe(800 - 200 - 8);
    expect(placeTip({ x: 100, y: 750 }, { width: 320, height: 900 }, view).top).toBe(8);
  });

  it('never goes past the left edge', () => {
    expect(placeTip({ x: 200, y: 100 }, { width: 900, height: 100 }, view).left).toBe(8);
  });
});
