import type { SessionState } from './schema.js';

export type StateGroup = 'working' | 'needsYou' | 'resting' | 'trouble';

const GROUPS: Readonly<Record<SessionState, StateGroup>> = {
  thinking: 'working',
  running: 'working',
  writing: 'working',
  waiting: 'needsYou',
  done: 'resting',
  interrupted: 'resting',
  idle: 'resting',
  error: 'trouble',
};

export function stateGroup(state: SessionState): StateGroup {
  return GROUPS[state];
}

export function projectName(cwd: string): string {
  const segments = cwd.split(/[\\/]/).filter((segment) => segment.length > 0);
  return segments.at(-1) ?? cwd;
}
