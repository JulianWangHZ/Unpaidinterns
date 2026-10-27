import { describe, expect, it } from 'vitest';
import { parseRoute, routeHash } from './route.js';

describe('parseRoute', () => {
  it.each([
    ['#/island', 'island'],
    ['#/board', 'board'],
    ['', 'island'],
    ['#/unknown', 'island'],
  ] as const)('%s -> %s', (hash, route) => {
    expect(parseRoute(hash)).toBe(route);
  });
});

describe('routeHash', () => {
  it('round-trips through parseRoute', () => {
    expect(parseRoute(routeHash('board'))).toBe('board');
    expect(parseRoute(routeHash('island'))).toBe('island');
  });
});
