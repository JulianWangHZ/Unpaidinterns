import { CatmullRomCurve3, Quaternion, Vector3 } from 'three';
import type { Vec3 } from './types.js';

/**
 * Layout of the pool club: a tiled deck by the sea with a lap pool, a hot tub, a splash pool fed
 * by a water slide, a tiki bar and loungers. Heights are from the deck surface (0).
 */

export const DECK = { x1: -9.5, x2: 11, z1: -7.5, z2: 9 } as const;

/** Water sits a little below the coping, as in a real pool. */
export const WATER = -0.12;

export const LANES = 6;
export const LANE_WIDTH = 1.05;
export const ROWS = 6;
export const ROW_GAP = 1.4;
const FIRST_LANE = -6.2;
const FIRST_ROW = -2.4;

/** Lap pool around the swimming lanes, with room at either end for the walls and blocks. */
export const LAP_POOL = {
  x1: FIRST_LANE - LANE_WIDTH / 2 - 0.15,
  x2: FIRST_LANE + (LANES - 0.5) * LANE_WIDTH + 0.15,
  z1: FIRST_ROW - 1.0,
  z2: FIRST_ROW + (ROWS - 1) * ROW_GAP + 1.0,
  depth: 1.5,
} as const;

/** Swimmers tread water: origin this far below the surface leaves the head and shoulders above it. */
export const TREAD_DEPTH = 0.62;

/**
 * Where swimmer `index` holds its lane: lanes fill first, then rows further down the pool. Once
 * every row is full, later swimmers take the gaps halfway between rows.
 */
export function laneSpot(index: number): Vec3 {
  const lane = index % LANES;
  const slot = Math.floor(index / LANES);
  const row = slot % ROWS;
  const between = Math.floor(slot / ROWS) % 2 ? ROW_GAP / 2 : 0;
  return [FIRST_LANE + lane * LANE_WIDTH, WATER - TREAD_DEPTH, FIRST_ROW + row * ROW_GAP + between];
}

/** Round hot tub raised on the deck, with a bench ring inside; heights are from the deck. */
export const HOT_TUB = { at: [2.6, 0, -4.6] as Vec3, radius: 1.25, rim: 0.66, water: 0.52, bench: 0.14, floor: 0.04, seats: 5 } as const;

/** Seat `i` on the hot tub bench, facing the middle. */
export function hotTubSeat(i: number): { position: Vec3; facing: number } {
  const a = (i / HOT_TUB.seats) * Math.PI * 2 + 0.3;
  const r = HOT_TUB.radius - 0.32;
  return { position: [Math.cos(a) * r, HOT_TUB.bench, Math.sin(a) * r], facing: Math.atan2(-Math.cos(a), -Math.sin(a)) };
}

/** Shallow splash pool at the foot of the slide. */
export const SPLASH_POOL = { x1: 2.6, x2: 7.4, z1: 1.2, z2: 5.6, depth: 0.7 } as const;

/** Slide tower: a platform reached by stairs, from which the flume spirals down into the splash pool. */
export const SLIDE = { tower: [8.9, 0, -0.6] as Vec3, top: 3.4, width: 0.62, riders: 3, lap: 7 } as const;

/** The slide tower's four legs, at the corners of its platform. */
export const SLIDE_LEGS: readonly Vec3[] = [-0.75, 0.75].flatMap((dx) => [-0.75, 0.75].map((dz) => [SLIDE.tower[0] + dx, 0, SLIDE.tower[2] + dz] as Vec3));

/**
 * Centre line of the flume's floor, start (front edge of the platform) to end (just above the
 * splash pool water): straight off the platform, one smooth quarter turn, then straight in.
 */
export const SLIDE_POINTS: readonly Vec3[] = [
  [8.9, SLIDE.top + 0.05, 0.22],
  [8.9, 3.05, 1.0],
  [8.85, 2.45, 1.9],
  [8.55, 1.75, 2.85],
  [7.9, 1.1, 3.45],
  [7.1, 0.55, 3.6],
  [6.3, WATER + 0.18, 3.6],
];

export const slideCurve = new CatmullRomCurve3(SLIDE_POINTS.map((p) => new Vector3(...p)), false, 'centripetal');

/** How far along the flume rider `seat` is (0 at the top, 1 in the pool) at a clock time. Riders are spread out. */
export function slideProgress(seat: number, seconds: number): number {
  const t = (seconds / SLIDE.lap + seat / SLIDE.riders) % 1;
  // A short wait at the top before pushing off, then accelerating down.
  const wait = 0.18;
  return t < wait ? 0 : ((t - wait) / (1 - wait)) ** 1.35;
}

/** Rider on the flume: sitting on its floor, facing down the slide. */
export function slideRider(seat: number, seconds: number, sitDrop: number): { position: Vector3; quaternion: Quaternion } {
  const u = slideProgress(seat, seconds);
  const at = slideCurve.getPointAt(u);
  const tangent = slideCurve.getTangentAt(u);
  const heading = Math.atan2(tangent.x, tangent.z);
  // Lean back a little with the slope, as a slider does.
  const pitch = Math.atan2(-tangent.y, Math.hypot(tangent.x, tangent.z)) * 0.6;
  const quaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), heading).multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), pitch));
  return { position: at.add(new Vector3(0, 0.06 - sitDrop, 0)), quaternion };
}

/** Bar with stools along its front, facing the counter. */
export const BAR = { at: [6.6, 0, -6.0] as Vec3, length: 3.0, stools: 4 } as const;

export function barStool(i: number): Vec3 {
  return [-BAR.length / 2 + 0.5 + i * ((BAR.length - 1) / (BAR.stools - 1)), 0, 0.85];
}

/** Row of loungers along the front of the deck, and a cabana with a daybed. */
export const LOUNGERS = { at: [-3.8, 0, 7.3] as Vec3, count: 4, gap: 1.2 } as const;
export const CABANA = { at: [-8.0, 0, -5.6] as Vec3, width: 2.2, depth: 1.8 } as const;

export function loungerSpot(i: number): Vec3 {
  return [LOUNGERS.at[0] + (i - (LOUNGERS.count - 1) / 2) * LOUNGERS.gap, 0, LOUNGERS.at[2]];
}

export const LIFEGUARD: Vec3 = [-0.1 + 0.6, 0, 1.6];

export const PALMS: readonly Vec3[] = [
  [-9.0, 0, 7.3],
  [-9.1, 0, 1.4],
  [10.4, 0, 7.3],
  [10.5, 0, -7.0],
  [-0.2, 0, 7.4],
  [4.0, 0, -7.0],
  [-4.4, 0, -7.0],
];

export interface Footprint {
  at: Vec3;
  radius: number;
}

/** Ground distance between two points, ignoring height. */
export function groundDistance(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[2] - b[2]);
}

/** Is a point (on the ground plan) inside a rectangle grown by `margin`? */
export function inRect(p: Vec3, r: { x1: number; x2: number; z1: number; z2: number }, margin = 0): boolean {
  return p[0] > r.x1 - margin && p[0] < r.x2 + margin && p[2] > r.z1 - margin && p[2] < r.z2 + margin;
}

/**
 * Where a lap swimmer is along its lane at a clock time: out to the far wall and back, slowing to
 * turn at each end. Returns the z position and which way the swimmer faces.
 */
export function lapAt(lap: { from: number; to: number; seconds: number }, seconds: number, phase = 0): { z: number; facing: number } {
  const t = (((seconds / lap.seconds + phase) % 1) + 1) % 1;
  const out = t < 0.5;
  const leg = out ? t * 2 : (t - 0.5) * 2;
  const eased = (1 - Math.cos(leg * Math.PI)) / 2;
  const z = out ? lap.from + (lap.to - lap.from) * eased : lap.to + (lap.from - lap.to) * eased;
  return { z, facing: out === lap.to > lap.from ? 0 : Math.PI };
}
