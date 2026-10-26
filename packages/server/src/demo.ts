import { projectName, type AgentEvent } from '@unpaidinterns/core';
import type { SessionHub } from './session-hub.js';

type DemoIdentity = Pick<AgentEvent, 'agent' | 'sessionId' | 'cwd' | 'parentSessionId' | 'worktree'> & { project?: string };
type DemoStep = Pick<AgentEvent, 'state' | 'tool' | 'detail'>;

const DEMO_SESSIONS: readonly DemoIdentity[] = [
  { agent: 'claude', sessionId: 'demo-1', cwd: '/demo/web-app' },
  { agent: 'claude', sessionId: 'demo-1/agent-a', cwd: '/demo/web-app', parentSessionId: 'demo-1' },
  { agent: 'codex', sessionId: 'demo-2', cwd: '/demo/api-server' },
  { agent: 'gemini', sessionId: 'demo-3', cwd: '/demo/docs-site' },
  { agent: 'claude', sessionId: 'demo-4', cwd: '/demo/api-server/.claude/worktrees/fix-auth', project: 'api-server', worktree: 'fix-auth' },
];

// The script length equals the session count so each tick shows every state once.
const SCRIPT: readonly DemoStep[] = [
  { state: 'thinking' },
  { state: 'running', tool: 'Bash: npm test' },
  { state: 'writing' },
  { state: 'waiting', tool: 'AskUserQuestion' },
  { state: 'done', detail: 'Refactor finished and tests pass.' },
];

export const DEMO_SESSION_COUNT = DEMO_SESSIONS.length;

export function startDemo(
  hub: SessionHub,
  { intervalMs = 5000, now = Date.now }: { intervalMs?: number; now?: () => number } = {},
): () => void {
  let tick = 0;
  const emit = () => {
    DEMO_SESSIONS.forEach((identity, index) => {
      const step = SCRIPT[(tick + index) % SCRIPT.length] ?? { state: 'idle' };
      hub.publish({ ...identity, project: identity.project ?? projectName(identity.cwd), ...step, ts: now() });
    });
    tick += 1;
  };
  emit();
  const timer = setInterval(emit, intervalMs);
  return () => clearInterval(timer);
}
