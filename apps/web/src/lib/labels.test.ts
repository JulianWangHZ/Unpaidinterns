import { describe, expect, it } from 'vitest';
import { projectLabel } from './labels.js';

describe('projectLabel', () => {
  it('shows the project alone for the main checkout', () => {
    expect(projectLabel({ project: 'myapp' })).toBe('myapp');
  });

  it('adds the worktree name for worktree sessions', () => {
    expect(projectLabel({ project: 'myapp', worktree: 'fix-login' })).toBe('myapp · fix-login');
  });
});
