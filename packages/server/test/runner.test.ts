import { EventEmitter } from 'node:events';
import type { Session } from '@unpaidinterns/core';
import { describe, expect, it, vi } from 'vitest';
import { buildCommand, Runner, type Spawner } from '../src/runner.js';

const session = (overrides: Partial<Session> = {}): Session => ({
  agent: 'claude',
  sessionId: 's1',
  cwd: '/work/app',
  project: 'app',
  state: 'done',
  startedAt: 0,
  updatedAt: 0,
  ...overrides,
});

describe('buildCommand', () => {
  it('resumes a Claude session in print mode with edit permission', () => {
    expect(buildCommand(session(), { text: 'run the tests', mode: 'resume', permission: 'edit' })).toEqual({
      command: 'claude',
      args: ['-p', 'run the tests', '--resume', 's1', '--permission-mode', 'acceptEdits', '--allowedTools', 'Read Glob Grep Edit Write'],
      cwd: '/work/app',
    });
  });

  it('limits read-only Claude runs to reading tools and never asks', () => {
    const { args } = buildCommand(session(), { text: 'x', mode: 'resume', permission: 'readOnly' });
    expect(args).toContain('dontAsk');
    expect(args.at(-1)).toBe('Read Glob Grep');
  });

  it('adds Bash only at full permission', () => {
    expect(buildCommand(session(), { text: 'x', mode: 'resume', permission: 'full' }).args.at(-1)).toContain('Bash');
    expect(buildCommand(session(), { text: 'x', mode: 'resume', permission: 'edit' }).args.at(-1)).not.toContain('Bash');
  });

  it('forks a Claude session when asked', () => {
    expect(buildCommand(session(), { text: 'x', mode: 'fork', permission: 'edit' }).args).toContain('--fork-session');
  });

  it('keeps a prompt that looks like a flag as a plain argument', () => {
    const { args } = buildCommand(session(), { text: '--dangerously-skip-permissions', mode: 'resume', permission: 'edit' });
    expect(args[0]).toBe('-p');
    expect(args[1]).toBe('--dangerously-skip-permissions');
  });

  it('resumes a Codex session with a matching sandbox', () => {
    expect(buildCommand(session({ agent: 'codex', sessionId: 'c1' }), { text: 'go', mode: 'resume', permission: 'readOnly' })).toEqual({
      command: 'codex',
      args: ['exec', 'resume', '-c', 'sandbox_mode="read-only"', 'c1', 'go'],
      cwd: '/work/app',
    });
  });

  it('uses the main session id for subagents', () => {
    expect(buildCommand(session({ sessionId: 's1/agent-a', parentSessionId: 's1' }), { text: 'x', mode: 'resume', permission: 'edit' }).args).toContain('s1');
  });

  it('honours binary overrides', () => {
    expect(buildCommand(session(), { text: 'x', mode: 'resume', permission: 'edit' }, { claude: '/bin/fake' }).command).toBe('/bin/fake');
  });
});

class FakeChild extends EventEmitter {
  stderr = new EventEmitter();
  killed = false;
  kill() {
    this.killed = true;
    this.emit('exit', null, 'SIGTERM');
    return true;
  }
}

function setup(spawnImpl?: (child: FakeChild) => void) {
  const children: FakeChild[] = [];
  const calls: Array<{ command: string; args: string[]; cwd: string }> = [];
  const spawn: Spawner = (command, args, options) => {
    const child = new FakeChild();
    children.push(child);
    calls.push({ command, args, cwd: options.cwd });
    spawnImpl?.(child);
    return child as unknown as ReturnType<Spawner>;
  };
  const events: Array<{ status: string; error?: string }> = [];
  const runner = new Runner({ spawn, timeoutMs: 1000, onStatus: (_id, status, error) => events.push({ status, ...(error ? { error } : {}) }) });
  return { runner, children, calls, events };
}

describe('Runner', () => {
  const message = { text: 'hi', mode: 'resume' as const, permission: 'edit' as const };

  it('runs the command and reports success', () => {
    const { runner, children, calls, events } = setup();
    expect(runner.start(session(), message)).toEqual({ ok: true });
    expect(calls[0]?.cwd).toBe('/work/app');
    children[0]?.emit('exit', 0, null);
    expect(events).toEqual([{ status: 'running' }, { status: 'done' }]);
    expect(runner.isRunning('s1')).toBe(false);
  });

  it('refuses a second run for the same session', () => {
    const { runner } = setup();
    runner.start(session(), message);
    expect(runner.start(session(), message)).toEqual({ ok: false, reason: 'busy' });
  });

  it('refuses while the agent is still working', () => {
    expect(setup().runner.start(session({ state: 'running' }), message)).toEqual({ ok: false, reason: 'working' });
  });

  it('refuses Gemini and forking Codex', () => {
    const { runner } = setup();
    expect(runner.start(session({ agent: 'gemini' }), message)).toEqual({ ok: false, reason: 'unsupported' });
    expect(runner.start(session({ agent: 'codex' }), { ...message, mode: 'fork' })).toEqual({ ok: false, reason: 'unsupported' });
  });

  it('reports a failed exit with the last stderr line', () => {
    const { runner, children, events } = setup();
    runner.start(session(), message);
    children[0]?.stderr.emit('data', Buffer.from('warming up\nError: session not found\n'));
    children[0]?.emit('exit', 1, null);
    expect(events.at(-1)).toEqual({ status: 'failed', error: 'Error: session not found' });
  });

  it('reports a missing CLI clearly', () => {
    const { runner, children, events } = setup();
    runner.start(session(), message);
    children[0]?.emit('error', Object.assign(new Error('spawn claude ENOENT'), { code: 'ENOENT' }));
    expect(events.at(-1)).toEqual({ status: 'failed', error: 'claude was not found on PATH.' });
    expect(runner.isRunning('s1')).toBe(false);
  });

  it('stops a run that takes too long', () => {
    vi.useFakeTimers();
    const { runner, children, events } = setup();
    runner.start(session(), message);
    vi.advanceTimersByTime(1001);
    expect(children[0]?.killed).toBe(true);
    expect(events.at(-1)).toEqual({ status: 'failed', error: 'Stopped after 1 seconds without finishing.' });
    vi.useRealTimers();
  });

  it('masks secrets in error output', () => {
    const { runner, children, events } = setup();
    runner.start(session(), message);
    children[0]?.stderr.emit('data', Buffer.from('auth failed for key sk-ant-abc123def456ghi789\n'));
    children[0]?.emit('exit', 1, null);
    expect(events.at(-1)?.error).toBe('auth failed for key [redacted]');
  });
});
