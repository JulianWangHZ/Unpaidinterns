import type { Session, Task } from '@unpaidinterns/core';
import { describe, expect, it } from 'vitest';
import { filterTasks, projectsOf, useFilterStore } from './filters.js';

const task = (id: string, overrides: Partial<Task> = {}): Task => ({
  id,
  title: id,
  note: '',
  project: '',
  column: 'todo',
  order: 1,
  sessionIds: [],
  createdAt: 0,
  updatedAt: 0,
  ...overrides,
});
const codex: Session = {
  agent: 'codex',
  sessionId: 'x1',
  cwd: '/w/api',
  project: 'api',
  state: 'running',
  startedAt: 0,
  updatedAt: 0,
};
const none = { project: '', hiddenAgents: [], query: '' };

describe('filterTasks', () => {
  const tasks = [
    task('login', { project: 'web', note: 'OAuth flow' }),
    task('rate limit', { project: 'api', sessionIds: ['x1'] }),
    task('docs'),
  ];

  it('keeps everything with no filters', () => {
    expect(filterTasks(tasks, { x1: codex }, none)).toHaveLength(3);
  });

  it('filters by project', () => {
    expect(filterTasks(tasks, {}, { ...none, project: 'web' }).map((t) => t.id)).toEqual(['login']);
  });

  it('searches title and note case-insensitively', () => {
    expect(filterTasks(tasks, {}, { ...none, query: 'oauth' }).map((t) => t.id)).toEqual(['login']);
  });

  it('hides cards whose live sessions all belong to hidden agents', () => {
    const visible = filterTasks(tasks, { x1: codex }, { ...none, hiddenAgents: ['codex'] });
    expect(visible.map((t) => t.id)).toEqual(['login', 'docs']);
  });
});

describe('projectsOf', () => {
  it('collects unique, sorted, non-empty projects from tasks and sessions', () => {
    expect(projectsOf([task('a', { project: 'web' }), task('b')], { x1: codex })).toEqual(['api', 'web']);
  });
});

describe('useFilterStore', () => {
  it('updates filters', () => {
    const store = useFilterStore.getState();
    store.setProject('web');
    store.setQuery('fix');
    store.toggleAgent('codex');
    expect(useFilterStore.getState()).toMatchObject({ project: 'web', query: 'fix', hiddenAgents: ['codex'] });
    store.toggleAgent('codex');
    expect(useFilterStore.getState().hiddenAgents).toEqual([]);
  });
});
