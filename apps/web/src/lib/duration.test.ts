import { describe, expect, it } from 'vitest';
import { formatDuration } from './duration.js';

describe('formatDuration', () => {
  it.each([
    [0, '0s'],
    [999, '0s'],
    [45_000, '45s'],
    [61_000, '1m 1s'],
    [3_600_000, '1h 0m'],
    [5_430_000, '1h 30m'],
    [-5_000, '0s'],
  ])('%i ms -> %s', (ms, text) => {
    expect(formatDuration(ms)).toBe(text);
  });
});
