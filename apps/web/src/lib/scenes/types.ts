import type { AgentKind, StateGroup } from '@unpaidinterns/core';
import type { Pose } from '../island/behavior.js';

export type Vec3 = [number, number, number];

/** Activity spots every scene must provide. Each scene dresses them differently. */
export const ACTIVITIES = ['coffee', 'kitchen', 'ktv', 'gym', 'massage', 'ballpit', 'pingpong', 'sofa', 'nap'] as const;
export type Activity = (typeof ACTIVITIES)[number];

export interface Spot {
  position: Vec3;
  /** Rotation around Y. Characters face +Z at rotation 0. */
  facing: number;
  /** The character sits here (chair, stool, sofa) rather than standing. */
  seated?: boolean;
}

export type Headwear = 'none' | 'cap' | 'swimcap' | 'mascot';
export type Extra = 'none' | 'apron' | 'balloon' | 'clownNose' | 'floatRing' | 'whistle' | 'tie';

/** How a character is dressed for one state group in one scene. */
export interface Outfit {
  /** Body colour; null keeps the agent's brand colour. */
  body: string | null;
  headwear: Headwear;
  headwearColor: string;
  extra: Extra;
}

export const SCENE_IDS = ['office', 'park', 'pool'] as const;
export type SceneId = (typeof SCENE_IDS)[number];

export interface SceneDefinition {
  id: SceneId;
  /**
   * Workstation for an agent. `index` counts every main agent; `agentIndex` counts only agents of the same kind,
   * for scenes that seat each kind in its own room. Must give a distinct spot per (agent, agentIndex).
   */
  seatAt(index: number, agent: AgentKind, agentIndex: number): Spot;
  activities: Readonly<Record<Activity, Vec3>>;
  /** How far from an activity's centre people stand. Large props such as tables need more room. */
  activityRadius?: Readonly<Partial<Record<Activity, number>>>;
  /** Scenes can dress an activity differently, e.g. the office plays arcade games where others work out. */
  activityPose?: Readonly<Partial<Record<Activity, Pose>>>;
  /** Fixed seats for furniture people sit on in a row, such as a sofa. Extra people stand around it. */
  activitySeats?: Readonly<Partial<Record<Activity, readonly Spot[]>>>;
  outfits: Readonly<Record<StateGroup, Outfit>>;
  lighting: 'day' | 'night';
  /** Characters are scaled up indoors so they read clearly behind desks and monitors. */
  characterScale: number;
  /** Show a name tag over every agent, not only the ones that need attention. */
  nameTags: boolean;
  cameraTarget: Vec3;
  cameraOffset: Vec3;
  /** Camera offset from an agent when it is selected. */
  closeOffset: Vec3;
}
