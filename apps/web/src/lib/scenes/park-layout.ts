import type { Vec3 } from './types.js';

/** The fenced grounds of the theme park. The entrance gate is in the middle of the front fence. */
export const GROUNDS = { x1: -13, x2: 17, z1: -14, z2: 11 } as const;

/** The paved square in the middle, where most of the activities sit. */
export const PLAZA = { centre: [1.6, 0, 0.6] as Vec3, radius: 5.6 } as const;

export const GATE = { x: 0.2, z: GROUNDS.z2, width: 3.6 } as const;

export const FOUNTAIN = { at: [0.4, 0, 7.4] as Vec3, radius: 1.1 } as const;

/** Big rides and how much ground each one covers, measured from its centre. */
export const RIDES = {
  ferrisWheel: { at: [-4.5, 0, -10] as Vec3, radius: 3.2, height: 6.0, wheel: 4 },
  dropTower: { at: [-10, 0, -5.5] as Vec3, radius: 1.3, height: 11 },
} as const;

/**
 * Roller coaster circuit, closed: the station straight along the front, the lift hill up to the
 * right, a turn across the back, the big drop, a camel hill and the turn back into the station.
 */
export const COASTER_POINTS: readonly Vec3[] = [
  [5, 1, -6],
  [8, 1, -6],
  [10.5, 2.4, -6],
  [13, 6.4, -6.2],
  [15, 6.2, -8.2],
  [14.6, 4.8, -10.6],
  [12, 1.2, -11.6],
  [8.6, 4, -12.2],
  [5.4, 1.5, -11.4],
  [3.4, 1.6, -9],
];

/** The station straight is the first two points: where riders board under the canopy. */
export const STATION = { from: COASTER_POINTS[0] as Vec3, to: COASTER_POINTS[1] as Vec3 } as const;

/**
 * Canopy posts at the coaster station, at each end of the straight: two on the platform side and
 * two across the track, set back far enough that the train passes between them.
 */
export const STATION_POSTS: readonly Vec3[] = [STATION.from[0] - 0.2, STATION.to[0] + 0.2].flatMap((x) => [
  [x, 0, STATION.from[2] - 1.0] as Vec3,
  [x, 0, STATION.from[2] + 1.6] as Vec3,
]);
export const STATION_PLATFORM = { top: 0.8, near: STATION.from[2] + 0.4 } as const;
export const STATION_CANOPY = { bottom: 3.1 } as const;

/** Paths fanning out from the plaza to the gate and the rides. Each is [from, to] on the ground. */
export const PATHS: ReadonlyArray<readonly [Vec3, Vec3]> = [
  [PLAZA.centre, [GATE.x, 0, GATE.z]],
  [PLAZA.centre, [5.8, 0, -4.8]],
  [PLAZA.centre, [-4.5, 0, -6.4]],
  [[-4.5, 0, -6.4], [-9, 0, -5.2]],
];

/** Small street furniture placed round the paths. */
export const BINS: readonly Vec3[] = [
  [-1.4, 0, 6.2],
  [4.6, 0, 5.4],
  [9.6, 0, 0.8],
  [-6.4, 0, -7.2],
  [4.0, 0, -5.2],
];
export const BALLOON_CART: Vec3 = [-4.4, 0, 7.4];

/** Benches along the paths, each with the way it faces. */
export const BENCHES: ReadonlyArray<{ at: Vec3; facing: number }> = [
  { at: [4.4, 0, -1.4], facing: 0.4 },
  { at: [9.4, 0, 5.4], facing: -2.2 },
  { at: [-6.2, 0, 4.6], facing: 2.0 },
];

/**
 * A switchback queue of stanchions in front of a ride's gate. In its own frame the gate is at the
 * origin and the queue runs out along +z: `rows` lanes side by side, each `width` wide.
 */
export interface QueueLane {
  gate: Vec3;
  /** Heading of the queue's +z axis round the vertical, as a rotation.y. */
  facing: number;
  rows: number;
  width: number;
  /** How far out from the gate the first rope line stands; the stretch before it is the walk-up. */
  start?: number;
  /** Mirror the switchback so the entrance opens on the other side. */
  mirror?: boolean;
}

const WHEEL_YAW = 0.62;
/** The drop tower's entrance faces the front of the park, turned a little off the plaza so its queue
 * stays clear of the ticket booths and the ferris wheel queue. */
const DROP_YAW = Math.atan2(1.6 - -10, 0.6 - -5.5) - 0.3;

/** The ferris wheel boards up the steps at the front of its platform; the drop tower from the plaza side. */
export const QUEUE_LANES = {
  wheel: {
    gate: [RIDES.ferrisWheel.at[0] + Math.sin(WHEEL_YAW) * 2.05, 0, RIDES.ferrisWheel.at[2] + Math.cos(WHEEL_YAW) * 2.05] as Vec3,
    facing: WHEEL_YAW,
    rows: 2,
    width: 2.4,
    start: 0.7,
  },
  drop: {
    gate: [RIDES.dropTower.at[0] + Math.sin(DROP_YAW) * 2.0, 0, RIDES.dropTower.at[2] + Math.cos(DROP_YAW) * 2.0] as Vec3,
    facing: DROP_YAW,
    rows: 2,
    width: 2.0,
    mirror: true,
  },
  coaster: { gate: [STATION.from[0] + 1.5, 0, STATION.from[2] + 1.7] as Vec3, facing: 0, rows: 2, width: 2.2 },
} as const satisfies Record<string, QueueLane>;

const LINE_GAP = 0.7;
const FIRST_LINE = 0.4;
const OPENING = 0.8;
const POST_SPACING = 0.7;

/** Turn a point in a queue's own frame into world space. */
function toWorld(lane: QueueLane, x: number, z: number): Vec3 {
  const c = Math.cos(lane.facing);
  const s = Math.sin(lane.facing);
  return [lane.gate[0] + x * c + z * s, 0, lane.gate[2] - x * s + z * c];
}

/** The side (+1 or -1) where line `k` leaves an opening into the next lane. */
const openSide = (lane: QueueLane, k: number) => (k % 2 ? -1 : 1) * (lane.mirror ? -1 : 1);

/**
 * Rope lines of a queue, each as its posts in order. Every inner line stops short at alternate
 * ends, so the lanes join into one path that snakes back and forth to the gate; the outer line is
 * whole. Posts along a line are evenly spaced so the rope hangs between neighbours.
 */
export function queueLines(lane: QueueLane): Vec3[][] {
  return Array.from({ length: lane.rows + 1 }, (_, k) => {
    const z = (lane.start ?? FIRST_LINE) + k * LINE_GAP;
    const half = lane.width / 2;
    const inner = k < lane.rows;
    const from = inner && openSide(lane, k) < 0 ? -half + OPENING : -half;
    const to = inner && openSide(lane, k) > 0 ? half - OPENING : half;
    const posts = Math.max(1, Math.ceil((to - from) / POST_SPACING));
    return Array.from({ length: posts + 1 }, (_, i) => toWorld(lane, from + ((to - from) * i) / posts, z));
  });
}

/** Where people gather to join the queue: just past the open end of the outermost lane. */
export function queueEntrance(lane: QueueLane): Vec3 {
  const last = lane.rows - 1;
  const side = -openSide(lane, last);
  return toWorld(lane, side * (lane.width / 2 + 1.1), (lane.start ?? FIRST_LINE) + (last + 0.5) * LINE_GAP);
}

/** A point beside the entrance, along the outside of the queue, for the ride's name board. */
export function queueSignSpot(lane: QueueLane): Vec3 {
  const last = lane.rows - 1;
  const side = -openSide(lane, last);
  return toWorld(lane, side * (lane.width / 2 + 0.5), (lane.start ?? FIRST_LINE) + lane.rows * LINE_GAP + 0.35);
}

export interface Footprint {
  at: Vec3;
  radius: number;
}

/** Everything big standing on the ground, so tests can check nothing else is built on top of it. */
export function footprints(): Footprint[] {
  const track = COASTER_POINTS.map((at) => ({ at, radius: 0.9 }));
  const small = [...BINS, BALLOON_CART, ...BENCHES.map((bench) => bench.at)].map((at) => ({ at, radius: 0.4 }));
  const queues = Object.values(QUEUE_LANES).flatMap((lane) => queueLines(lane).flat().map((at) => ({ at, radius: 0.18 })));
  return [
    { at: RIDES.ferrisWheel.at, radius: RIDES.ferrisWheel.radius },
    { at: RIDES.dropTower.at, radius: RIDES.dropTower.radius },
    FOUNTAIN,
    ...track,
    ...small,
    ...queues,
  ];
}

/** Ground distance between two points, ignoring height. */
export function groundDistance(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[2] - b[2]);
}

/** Seconds for one drop-tower ride, start to start. */
export const DROP_CYCLE = 9;

/** Height of the drop-tower seats through one ride: a slow climb, a pause at the top, a drop and a soft landing. */
export function dropTowerHeight(seconds: number): number {
  const t = ((seconds % DROP_CYCLE) + DROP_CYCLE) % DROP_CYCLE;
  // Low enough to step on from the deck, high enough that the footrests stay clear of it.
  const bottom = 0.75;
  const top = RIDES.dropTower.height - 1.4;
  if (t < 5) return bottom + (top - bottom) * (t / 5);
  if (t < 6.2) return top;
  if (t < 6.9) return top - (top - 1.2) * ((t - 6.2) / 0.7) ** 2;
  if (t < 7.6) return 1.2 - (1.2 - bottom) * ((t - 6.9) / 0.7);
  return bottom;
}
