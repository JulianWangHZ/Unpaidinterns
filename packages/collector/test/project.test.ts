import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createProjectResolver } from '../src/project.js';

let root: string;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'project-'));
});

afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function repo(name: string): Promise<string> {
  const dir = join(root, name);
  await mkdir(join(dir, '.git', 'worktrees'), { recursive: true });
  return dir;
}

async function worktree(main: string, at: string, name: string): Promise<string> {
  await mkdir(join(main, '.git', 'worktrees', name), { recursive: true });
  await mkdir(at, { recursive: true });
  await writeFile(join(at, '.git'), `gitdir: ${join(main, '.git', 'worktrees', name)}\n`);
  return at;
}

describe('createProjectResolver', () => {
  it('names a normal repo after its folder', async () => {
    const main = await repo('myapp');
    expect(createProjectResolver()(main)).toEqual({ project: 'myapp' });
  });

  it('names a git worktree after its main repo and labels the worktree', async () => {
    const main = await repo('myapp');
    const wt = await worktree(main, join(root, 'myapp-login'), 'myapp-login');
    expect(createProjectResolver()(wt)).toEqual({ project: 'myapp', worktree: 'myapp-login' });
  });

  it('handles a relative gitdir', async () => {
    const main = await repo('myapp');
    const at = join(root, 'side', 'feature-x');
    await mkdir(join(main, '.git', 'worktrees', 'feature-x'), { recursive: true });
    await mkdir(at, { recursive: true });
    await writeFile(join(at, '.git'), 'gitdir: ../../myapp/.git/worktrees/feature-x\n');
    expect(createProjectResolver()(at)).toEqual({ project: 'myapp', worktree: 'feature-x' });
  });

  it('resolves from a subfolder inside a worktree', async () => {
    const main = await repo('myapp');
    const wt = await worktree(main, join(main, '.claude', 'worktrees', 'fix-bug'), 'fix-bug');
    const sub = join(wt, 'src', 'lib');
    await mkdir(sub, { recursive: true });
    expect(createProjectResolver()(sub)).toEqual({ project: 'myapp', worktree: 'fix-bug' });
  });

  it('recognises a removed agent worktree from its path alone', () => {
    const gone = join(root, 'myapp', '.claude', 'worktrees', 'old-task');
    expect(createProjectResolver()(gone)).toEqual({ project: 'myapp', worktree: 'old-task' });
  });

  it('falls back to the folder name outside any repo', async () => {
    const plain = join(root, 'notes');
    await mkdir(plain);
    expect(createProjectResolver()(plain).project).toBe('notes');
  });

  it('falls back to the folder name for a path that does not exist', () => {
    expect(createProjectResolver()(join(root, 'missing', 'app'))).toEqual({ project: 'app' });
  });

  it('ignores a .git file that is not a worktree pointer', async () => {
    const dir = join(root, 'odd');
    await mkdir(dir);
    await writeFile(join(dir, '.git'), 'not a pointer');
    expect(createProjectResolver()(dir)).toEqual({ project: 'odd' });
  });

  it('caches results per cwd', async () => {
    const main = await repo('myapp');
    const resolve = createProjectResolver();
    const first = resolve(main);
    await rm(join(main, '.git'), { recursive: true });
    expect(resolve(main)).toBe(first);
  });
});
