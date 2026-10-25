import { describe, expect, it } from 'vitest';
import { parseRoute } from './route.js';

describe('parseRoute', () => {
  it.each([
    ['#/island', 'island'],
    ['#/board', 'board'],
    ['', 'board'],
    ['#/unknown', 'board'],
  ] as const)('%s -> %s', (hash, route) => {
    expect(parseRoute(hash)).toBe(route);
  });
});
