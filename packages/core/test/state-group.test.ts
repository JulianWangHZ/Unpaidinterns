import { describe, expect, it } from 'vitest';
import { projectName, stateGroup } from '../src/index.js';

describe('stateGroup', () => {
  it.each([
    ['thinking', 'working'],
    ['running', 'working'],
    ['writing', 'working'],
    ['waiting', 'needsYou'],
    ['done', 'resting'],
    ['interrupted', 'resting'],
    ['idle', 'resting'],
    ['error', 'trouble'],
  ] as const)('maps %s to %s', (state, group) => {
    expect(stateGroup(state)).toBe(group);
  });
});

describe('projectName', () => {
  it('returns the last path segment', () => {
    expect(projectName('/work/web-app')).toBe('web-app');
  });

  it('ignores a trailing slash', () => {
    expect(projectName('/work/web-app/')).toBe('web-app');
  });

  it('handles Windows paths', () => {
    expect(projectName('C:\\work\\api-server')).toBe('api-server');
  });

  it('falls back to the input for the root path', () => {
    expect(projectName('/')).toBe('/');
  });
});
