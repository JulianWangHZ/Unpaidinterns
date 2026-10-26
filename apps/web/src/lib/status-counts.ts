import { stateGroup, type Session } from '@unpaidinterns/core';

export interface StatusCounts {
  needsYou: number;
  working: number;
  done: number;
}

/** Headline counts for the top bar. Interns follow their parent, so only main agents are counted. */
export function statusCounts(sessions: readonly Session[]): StatusCounts {
  const counts: StatusCounts = { needsYou: 0, working: 0, done: 0 };
  for (const session of sessions) {
    if (session.parentSessionId) continue;
    const group = stateGroup(session.state);
    if (group === 'working') counts.working += 1;
    else if (group === 'resting') counts.done += 1;
    else counts.needsYou += 1;
  }
  return counts;
}
