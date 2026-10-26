import { describe, expect, it } from 'vitest';
import { projectLabel, tagLabel } from './labels.js';

describe('projectLabel', () => {
  it('shows the project alone for the main checkout', () => {
    expect(projectLabel({ project: 'myapp' })).toBe('myapp');
  });

  it('adds the worktree name for worktree sessions', () => {
    expect(projectLabel({ project: 'myapp', worktree: 'fix-login' })).toBe('myapp · fix-login');
  });
});

describe('tagLabel', () => {
  it('shows only the worktree name for worktree sessions', () => {
    expect(tagLabel({ project: 'myapp', worktree: 'fix-login' })).toBe('fix-login');
  });

  it('shows the project name for the main checkout', () => {
    expect(tagLabel({ project: 'myapp' })).toBe('myapp');
  });
});
