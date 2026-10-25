import { stateGroup, type Session, type SessionState } from '@unpaidinterns/core';
import type { Amenity } from './layout.js';

export type Pose = 'think' | 'type' | 'typeSlow' | 'wave' | 'slump' | 'sip' | 'sing' | 'play' | 'lounge' | 'workout' | 'nap';

export type Spot =
  | { kind: 'desk' }
  | { kind: 'amenity'; amenity: Amenity; seat: number }
  | { kind: 'withParent'; parentSessionId: string };

export interface Placement {
  at: Spot;
  pose: Pose;
}

const COFFEE_MS = 60_000;
const NAP_MS = 25 * 60_000;

const DESK_POSES: Partial<Record<SessionState, Pose>> = {
  thinking: 'think',
  running: 'type',
  writing: 'typeSlow',
  waiting: 'wave',
  error: 'slump',
};

const PAIRS: ReadonlyArray<{ amenity: Amenity; pose: Pose }> = [
  { amenity: 'ktv', pose: 'sing' },
  { amenity: 'pingpong', pose: 'play' },
];

const SOLO: ReadonlyArray<{ amenity: Amenity; pose: Pose }> = [
  { amenity: 'kitchen', pose: 'sip' },
  { amenity: 'massage', pose: 'lounge' },
  { amenity: 'gym', pose: 'workout' },
  { amenity: 'ballpit', pose: 'play' },
];

function restingPose(session: Session): Pose {
  return DESK_POSES[session.state] ?? 'sip';
}

/** Decides where every agent stands and what it does. Pure, so the scene just follows it. */
export function placeAgents(sessions: readonly Session[], now: number): Map<string, Placement> {
  const placed = new Map<string, Placement>();
  const seatsTaken = new Map<Amenity, number>();
  const sit = (sessionId: string, amenity: Amenity, pose: Pose) => {
    const seat = seatsTaken.get(amenity) ?? 0;
    seatsTaken.set(amenity, seat + 1);
    placed.set(sessionId, { at: { kind: 'amenity', amenity, seat }, pose });
  };

  const main = [...sessions].filter((s) => !s.parentSessionId).sort((a, b) => a.sessionId.localeCompare(b.sessionId));
  const loungers: Session[] = [];

  for (const session of main) {
    const idleFor = now - session.updatedAt;
    if (stateGroup(session.state) !== 'resting') {
      placed.set(session.sessionId, { at: { kind: 'desk' }, pose: restingPose(session) });
    } else if (idleFor < COFFEE_MS) {
      sit(session.sessionId, 'coffee', 'sip');
    } else if (idleFor > NAP_MS) {
      sit(session.sessionId, 'nap', 'nap');
    } else {
      loungers.push(session);
    }
  }

  const paired = loungers.length >= 2 ? Math.min(PAIRS.length * 2, loungers.length - (loungers.length % 2)) : 0;
  loungers.forEach((session, index) => {
    const activity = index < paired ? PAIRS[Math.floor(index / 2)] : SOLO[(index - paired) % SOLO.length];
    if (activity) sit(session.sessionId, activity.amenity, activity.pose);
  });

  for (const intern of sessions.filter((s) => s.parentSessionId)) {
    const parentSessionId = intern.parentSessionId as string;
    placed.set(intern.sessionId, { at: { kind: 'withParent', parentSessionId }, pose: DESK_POSES[intern.state] ?? 'sip' });
  }
  return placed;
}
