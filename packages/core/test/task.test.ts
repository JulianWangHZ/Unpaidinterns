import { describe, expect, it } from 'vitest';
import { serverMessageSchema, taskCreateSchema, taskPatchSchema } from '../src/index.js';

describe('taskCreateSchema', () => {
  it('fills defaults and trims the title', () => {
    expect(taskCreateSchema.parse({ title: '  Fix login  ' })).toEqual({
      title: 'Fix login',
      note: '',
      project: '',
      column: 'todo',
      sessionIds: [],
    });
  });

  it.each([{ title: '' }, { title: '   ' }, { title: 'x'.repeat(201) }, {}])('rejects %j', (input) => {
    expect(taskCreateSchema.safeParse(input).success).toBe(false);
  });

  it('rejects too many bound sessions', () => {
    const ids = Array.from({ length: 21 }, (_, i) => `s${i}`);
    expect(taskCreateSchema.safeParse({ title: 'a', sessionIds: ids }).success).toBe(false);
  });
});

describe('taskPatchSchema', () => {
  it('accepts a partial update', () => {
    expect(taskPatchSchema.parse({ column: 'done', order: 1.5 })).toEqual({ column: 'done', order: 1.5 });
  });

  it('rejects unknown fields', () => {
    expect(taskPatchSchema.safeParse({ id: 'other' }).success).toBe(false);
  });

  it('rejects a non-finite order', () => {
    expect(taskPatchSchema.safeParse({ order: Number.POSITIVE_INFINITY }).success).toBe(false);
  });
});

describe('serverMessageSchema tasks', () => {
  it('accepts a tasks message', () => {
    expect(serverMessageSchema.safeParse({ type: 'tasks', tasks: [] }).success).toBe(true);
  });
});
