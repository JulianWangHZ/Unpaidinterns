import type { Task } from '@unpaidinterns/core';
import { describe, expect, it } from 'vitest';
import { columnsOf, moveId, orderBetween, placeTask } from './order.js';

const task = (id: string, column: Task['column'], order: number): Task => ({
  id,
  title: id,
  note: '',
  project: '',
  column,
  order,
  sessionIds: [],
  createdAt: 0,
  updatedAt: 0,
});

describe('orderBetween', () => {
  it.each([
    [undefined, undefined, 1],
    [undefined, 3, 2],
    [4, undefined, 5],
    [1, 2, 1.5],
  ] as const)('between %s and %s is %s', (before, after, expected) => {
    expect(orderBetween(before, after)).toBe(expected);
  });
});

describe('columnsOf', () => {
  it('groups by column and sorts by order', () => {
    const columns = columnsOf([task('b', 'todo', 2), task('a', 'todo', 1), task('c', 'done', 1)]);
    expect(columns.todo.map((t) => t.id)).toEqual(['a', 'b']);
    expect(columns.doing).toEqual([]);
    expect(columns.done.map((t) => t.id)).toEqual(['c']);
  });
});

describe('placeTask', () => {
  const tasks = [task('a', 'todo', 1), task('b', 'todo', 2), task('c', 'doing', 1), task('d', 'doing', 2)];

  it('places a task between two neighbours in another column', () => {
    expect(placeTask(tasks, 'a', 'doing', 1)).toEqual({ column: 'doing', order: 1.5 });
  });

  it('places a task at the top of a column', () => {
    expect(placeTask(tasks, 'a', 'doing', 0)).toEqual({ column: 'doing', order: 0 });
  });

  it('places a task in an empty column', () => {
    expect(placeTask(tasks, 'a', 'done', 0)).toEqual({ column: 'done', order: 1 });
  });

  it('ignores the moving task when reordering within its own column', () => {
    expect(placeTask(tasks, 'a', 'todo', 1)).toEqual({ column: 'todo', order: 3 });
  });
});

describe('moveId', () => {
  const ids = { todo: ['a', 'b'], doing: ['c'], done: [] };

  it('moves an id before the item it is dragged over', () => {
    expect(moveId(ids, 'a', 'doing', 'c')).toEqual({ todo: ['b'], doing: ['a', 'c'], done: [] });
  });

  it('appends when dragged over the column itself', () => {
    expect(moveId(ids, 'a', 'done', 'done')).toEqual({ todo: ['b'], doing: ['c'], done: ['a'] });
  });

  it('returns the same object when the id is unknown', () => {
    expect(moveId(ids, 'zzz', 'done', 'done')).toBe(ids);
  });
});
