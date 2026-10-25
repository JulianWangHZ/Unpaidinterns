import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { JsonTaskRepository } from '../src/task-repository.js';

let dir: string;
let file: string;
let clock: number;
let ids: number;

function repo(onCorrupt?: (backupPath: string) => void) {
  return new JsonTaskRepository(file, {
    now: () => clock,
    newId: () => `t${++ids}`,
    ...(onCorrupt ? { onCorrupt } : {}),
  });
}

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'tasks-'));
  file = join(dir, 'nested', 'tasks.json');
  clock = 1000;
  ids = 0;
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('JsonTaskRepository', () => {
  it('starts empty when the file does not exist', async () => {
    expect(await repo().list()).toEqual([]);
  });

  it('creates tasks at the end of their column and persists them', async () => {
    const tasks = repo();
    const first = await tasks.create({ title: 'One' });
    const second = await tasks.create({ title: 'Two', project: 'web-app' });
    expect(first).toEqual({
      id: 't1',
      title: 'One',
      note: '',
      project: '',
      column: 'todo',
      order: 1,
      sessionIds: [],
      createdAt: 1000,
      updatedAt: 1000,
    });
    expect(second.order).toBe(2);
    expect(await repo().list()).toEqual([first, second]);
  });

  it('updates fields and bumps updatedAt', async () => {
    const tasks = repo();
    const created = await tasks.create({ title: 'One' });
    clock = 2000;
    const updated = await tasks.update(created.id, { column: 'doing', order: 0.5 });
    expect(updated).toMatchObject({ column: 'doing', order: 0.5, updatedAt: 2000, createdAt: 1000 });
  });

  it('returns null when updating or removing a missing task', async () => {
    const tasks = repo();
    expect(await tasks.update('nope', { title: 'x' })).toBeNull();
    expect(await tasks.remove('nope')).toBe(false);
  });

  it('removes a task', async () => {
    const tasks = repo();
    const created = await tasks.create({ title: 'One' });
    expect(await tasks.remove(created.id)).toBe(true);
    expect(await repo().list()).toEqual([]);
  });

  it('writes atomically without leaving temp files', async () => {
    const tasks = repo();
    await Promise.all([tasks.create({ title: 'A' }), tasks.create({ title: 'B' }), tasks.create({ title: 'C' })]);
    expect((await repo().list()).map((t) => t.title)).toEqual(['A', 'B', 'C']);
    expect(await readdir(join(dir, 'nested'))).toEqual(['tasks.json']);
  });

  it('backs up a corrupted file and starts fresh', async () => {
    await repo().create({ title: 'seed' });
    await writeFile(file, '{ broken');
    const reported: string[] = [];
    expect(await repo((path) => reported.push(path)).list()).toEqual([]);
    expect(reported).toEqual([`${file}.bak`]);
    expect(await readFile(`${file}.bak`, 'utf8')).toBe('{ broken');
  });

  it('treats schema-invalid content as corrupted', async () => {
    await repo().create({ title: 'seed' });
    await writeFile(file, JSON.stringify({ version: 1, tasks: [{ id: 1 }] }));
    const reported: string[] = [];
    expect(await repo((path) => reported.push(path)).list()).toEqual([]);
    expect(reported).toHaveLength(1);
  });
});
