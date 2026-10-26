import type { Session } from '@unpaidinterns/core';

/** Project name as shown to people; worktree sessions read as `project · worktree`. */
export function projectLabel(session: Pick<Session, 'project' | 'worktree'>): string {
  return session.worktree ? `${session.project} · ${session.worktree}` : session.project;
}
