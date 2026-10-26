import { spawn as nodeSpawn, type ChildProcess } from 'node:child_process';
import { stateGroup, type AgentKind, type Permission, type RunStatus, type Session } from '@unpaidinterns/core';

export interface RunRequest {
  text: string;
  mode: 'resume' | 'fork';
  permission: Permission;
}

export interface Command {
  command: string;
  args: string[];
  cwd: string;
}

export type Binaries = Partial<Record<AgentKind, string>>;

const CLAUDE_TOOLS: Record<Permission, string> = {
  readOnly: 'Read Glob Grep',
  edit: 'Read Glob Grep Edit Write',
  full: 'Read Glob Grep Edit Write Bash',
};

const CODEX_SANDBOX: Record<Permission, string> = {
  readOnly: 'read-only',
  edit: 'workspace-write',
  full: 'danger-full-access',
};

/** Arguments are passed as an array straight to the CLI, never through a shell. */
export function buildCommand(session: Session, request: RunRequest, binaries: Binaries = {}): Command {
  const id = session.parentSessionId ?? session.sessionId;
  if (session.agent === 'codex') {
    return {
      command: binaries.codex ?? 'codex',
      args: ['exec', 'resume', '-c', `sandbox_mode="${CODEX_SANDBOX[request.permission]}"`, id, request.text],
      cwd: session.cwd,
    };
  }
  return {
    command: binaries.claude ?? 'claude',
    args: [
      '-p',
      request.text,
      '--resume',
      id,
      ...(request.mode === 'fork' ? ['--fork-session'] : []),
      '--permission-mode',
      request.permission === 'readOnly' ? 'dontAsk' : 'acceptEdits',
      '--allowedTools',
      CLAUDE_TOOLS[request.permission],
    ],
    cwd: session.cwd,
  };
}

export type Spawner = (command: string, args: string[], options: { cwd: string }) => ChildProcess;

export type StartResult = { ok: true } | { ok: false; reason: 'busy' | 'working' | 'unsupported' };

interface RunnerOptions {
  spawn?: Spawner;
  binaries?: Binaries;
  timeoutMs?: number;
  onStatus(sessionId: string, status: RunStatus, error?: string): void;
}

const SECRET = /(sk-[A-Za-z0-9-]{12,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})/g;

function lastLine(text: string): string {
  return (text.trim().split('\n').at(-1) ?? '').replace(SECRET, '[redacted]').slice(0, 300);
}

/** Sends one message to an agent by resuming its session, one run per session at a time. */
export class Runner {
  readonly #running = new Set<string>();
  readonly #spawn: Spawner;
  readonly #options: RunnerOptions;

  constructor(options: RunnerOptions) {
    this.#options = options;
    this.#spawn = options.spawn ?? ((command, args, { cwd }) => nodeSpawn(command, args, { cwd, stdio: ['ignore', 'ignore', 'pipe'] }));
  }

  isRunning(sessionId: string): boolean {
    return this.#running.has(sessionId);
  }

  start(session: Session, request: RunRequest): StartResult {
    if (session.agent === 'gemini' || (session.agent === 'codex' && request.mode === 'fork')) return { ok: false, reason: 'unsupported' };
    if (this.#running.has(session.sessionId)) return { ok: false, reason: 'busy' };
    if (stateGroup(session.state) !== 'resting') return { ok: false, reason: 'working' };

    const { command, args, cwd } = buildCommand(session, request, this.#options.binaries);
    const id = session.sessionId;
    const timeoutMs = this.#options.timeoutMs ?? 10 * 60_000;
    this.#running.add(id);
    this.#options.onStatus(id, 'running');

    let stderr = '';
    let settled = false;
    const finish = (status: RunStatus, error?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      this.#running.delete(id);
      this.#options.onStatus(id, status, error);
    };

    const child = this.#spawn(command, args, { cwd });
    const timer = setTimeout(() => {
      finish('failed', `Stopped after ${Math.round(timeoutMs / 1000)} seconds without finishing.`);
      child.kill('SIGTERM');
    }, timeoutMs);
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr = (stderr + chunk.toString('utf8')).slice(-4000);
    });
    child.on('error', (error: NodeJS.ErrnoException) => {
      finish('failed', error.code === 'ENOENT' ? `${command} was not found on PATH.` : lastLine(error.message));
    });
    child.on('exit', (code: number | null) => {
      if (code === 0) finish('done');
      else finish('failed', lastLine(stderr) || `${command} exited with code ${code ?? 'unknown'}.`);
    });
    return { ok: true };
  }
}
