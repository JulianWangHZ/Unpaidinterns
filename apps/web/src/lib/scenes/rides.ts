import { CatmullRomCurve3, Matrix4, Quaternion, Vector3 } from 'three';
import { COASTER_POINTS, dropTowerHeight, RIDES } from './park-layout.js';
import type { Vec3 } from './types.js';

/**
 * Where every moving seat on the park rides is at any moment. The rides draw themselves from
 * these functions and riders sit at the same points, so a rider can never drift off a seat.
 * All of them take the scene clock in seconds.
 */

export type RideId = 'carousel' | 'coaster' | 'wheel' | 'drop';

export interface RidePose {
  position: Vector3;
  quaternion: Quaternion;
}

const UP = new Vector3(0, 1, 0);
const yaw = (angle: number) => new Quaternion().setFromAxisAngle(UP, angle);

// Carousel

export const CAROUSEL = {
  /** Nose to tail of a horse, along its heading. */
  horseLength: 0.8,
  horses: 8,
  /** Distance from the centre to the horse poles. */
  ring: 1.2,
  /** Radians per second; positive runs anticlockwise seen from above. */
  spin: 0.42,
  /** Height of the horse's back above the ground at the middle of its bob. */
  saddle: 0.95,
  bob: 0.12,
  deck: 0.28,
} as const;

/** Angle round the carousel of horse `i`. */
export function horseAngle(i: number, seconds: number): number {
  return (i / CAROUSEL.horses) * Math.PI * 2 + seconds * CAROUSEL.spin;
}

/** Horse `i`'s saddle point and heading, relative to the carousel centre. Horses face the way they travel. */
export function horsePose(i: number, seconds: number): RidePose {
  const a = horseAngle(i, seconds);
  const lift = Math.sin(seconds * 2.1 + i * 1.3) * CAROUSEL.bob;
  return {
    position: new Vector3(Math.cos(a) * CAROUSEL.ring, CAROUSEL.saddle + lift, Math.sin(a) * CAROUSEL.ring),
    // Travelling anticlockwise, the direction of motion is (-sin a, cos a).
    quaternion: yaw(Math.atan2(-Math.sin(a), Math.cos(a))),
  };
}

// Ferris wheel

export const WHEEL = {
  /** Open cabin: width across the wheel, depth through it, and how far below its pivot the floor is. */
  cabin: { width: 0.9, depth: 0.62, floorDrop: 1.56, roofDrop: 0.32 },
  /** The boarding platform top, and the railing along its back edge (wheel frame z). */
  platformTop: 0.3,
  railZ: -0.95,
  cars: 10,
  radius: RIDES.ferrisWheel.wheel,
  hub: RIDES.ferrisWheel.height,
  /** The wheel turns in its own plane, which faces this way round the vertical. */
  facing: 0.62,
  spin: 0.08,
  /** How far below its pivot on the rim a car's seat is. */
  drop: 1.2,
} as const;

/** Seat of car `i` relative to the wheel's footprint centre. Cars hang level, so riders stay upright. */
export function gondolaPose(i: number, seconds: number): RidePose {
  const a = (i / WHEEL.cars) * Math.PI * 2 + seconds * WHEEL.spin;
  const local = new Vector3(Math.cos(a) * WHEEL.radius, WHEEL.hub + Math.sin(a) * WHEEL.radius - WHEEL.drop, 0);
  return { position: local.applyQuaternion(yaw(WHEEL.facing)), quaternion: yaw(WHEEL.facing) };
}

/** Rim pivot of car `i` in the wheel's own frame (x across the wheel, y up), for drawing it. */
export function gondolaPivot(i: number, seconds: number): Vec3 {
  const a = (i / WHEEL.cars) * Math.PI * 2 + seconds * WHEEL.spin;
  return [Math.cos(a) * WHEEL.radius, WHEEL.hub + Math.sin(a) * WHEEL.radius, 0];
}

// Drop tower

export const DROP = {
  /** The seat's footrest hangs this far below the seat surface; the deck top is at `deck`. */
  footrest: 0.38,
  deck: 0.28,
  seats: 8,
  /** The carriage ring round the tower. */
  ring: 0.95,
  /** Seat centres, just outside the ring, so riders face out with the tower at their backs. */
  seatRing: 1.18,
  /** Seat surface above the carriage's base height. */
  seatY: 0.06,
} as const;

/** Angle round the tower of seat `i`. */
export function dropSeatAngle(i: number): number {
  return ((i + 0.5) / DROP.seats) * Math.PI * 2;
}

/** Seat `i` of the drop tower relative to the tower base, facing outward. */
export function dropSeatPose(i: number, seconds: number): RidePose {
  const a = dropSeatAngle(i);
  return {
    position: new Vector3(Math.cos(a) * DROP.seatRing, dropTowerHeight(seconds) + DROP.seatY, Math.sin(a) * DROP.seatRing),
    quaternion: yaw(Math.atan2(Math.cos(a), Math.sin(a))),
  };
}

// Roller coaster

export const COASTER = {
  cars: 3,
  seatsPerCar: 2,
  /** Seat centres across a car. */
  seatX: 0.19,
  /** Car body: width across the rails, length along them, and wall height above the track. */
  carWidth: 0.84,
  carLength: 0.92,
  carHeight: 0.44,
} as const;

export const coasterTrack = new CatmullRomCurve3(COASTER_POINTS.map((p) => new Vector3(...p)), true, 'centripetal');

/** Track distance between car centres, as a share of one lap: a car length plus a coupling gap. */
export const CAR_GAP = (COASTER.carLength + 0.14) / coasterTrack.getLength();

/** Orientation of something on the track at `u`: forward along it, kept level side to side. */
export function trackFrame(u: number): Quaternion {
  const forward = coasterTrack.getTangentAt(u);
  const side = forward.clone().cross(UP).normalize();
  const up = side.clone().cross(forward).normalize();
  // Columns are the object's x (right), y (up) and z (forward) axes.
  return new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(side.negate(), up, forward));
}

/** Train speed in laps per second: crawls up the lift hill, races down the drops. */
function lapsPerSecond(height: number): number {
  return 0.016 + Math.max(0, 6.6 - height) * 0.009;
}

/** Elapsed time against track position over one lap, so position can be read off any clock time. */
const timetable = (() => {
  const step = 1 / 120;
  const times = [0];
  const places = [0];
  let u = 0;
  let t = 0;
  while (u < 1) {
    u += lapsPerSecond(coasterTrack.getPointAt(Math.min(u, 1)).y) * step;
    t += step;
    times.push(t);
    places.push(Math.min(u, 1));
  }
  return { times, places, lap: t };
})();

export const COASTER_LAP_SECONDS = timetable.lap;

/** Where the front of the train is on the track (0..1) at a clock time. */
export function trainProgress(seconds: number): number {
  const { times, places, lap } = timetable;
  const t = ((seconds % lap) + lap) % lap;
  let low = 0;
  let high = times.length - 1;
  while (high - low > 1) {
    const middle = (low + high) >> 1;
    if ((times[middle] as number) <= t) low = middle;
    else high = middle;
  }
  const span = (times[high] as number) - (times[low] as number);
  const share = span > 0 ? (t - (times[low] as number)) / span : 0;
  return (places[low] as number) + ((places[high] as number) - (places[low] as number)) * share;
}

/** Track position of car `car` (0 at the front). */
export function carProgress(car: number, seconds: number): number {
  return (((trainProgress(seconds) - car * CAR_GAP) % 1) + 1) % 1;
}

/** Car `car`'s base point on the rails and its orientation. */
export function carPose(car: number, seconds: number): RidePose {
  const u = carProgress(car, seconds);
  return { position: coasterTrack.getPointAt(u), quaternion: trackFrame(u) };
}

// Riders

/** How far above a seat surface a seated figure's origin sits (its hips rest on the seat). */
export const SIT_DROP = 0.15;

/** Height of a seated figure from its origin to the top of its head. */
export const SEATED_HEIGHT = 0.94;

/** Car-relative seat surface: the floor of the tub plus the cushion. */
const COASTER_SEAT_Y = 0.2;

/**
 * Where rider `seat` of a ride is, in world space. Carousel and wheel poses are relative to the ride
 * centre, which the caller passes in; coaster poses are already in world space.
 */
export function riderPose(ride: RideId, seat: number, seconds: number, centre: Vec3): RidePose {
  const origin = new Vector3(...centre);
  if (ride === 'carousel') {
    const horse = horsePose(seat % CAROUSEL.horses, seconds);
    return { position: horse.position.add(origin).add(new Vector3(0, -SIT_DROP, 0)), quaternion: horse.quaternion };
  }
  if (ride === 'drop') {
    const seatPose = dropSeatPose(seat % DROP.seats, seconds);
    return { position: seatPose.position.add(origin).add(new Vector3(0, -SIT_DROP, 0)), quaternion: seatPose.quaternion };
  }
  if (ride === 'wheel') {
    const car = gondolaPose(seat % WHEEL.cars, seconds);
    return { position: car.position.add(origin).add(new Vector3(0, -SIT_DROP, 0)), quaternion: car.quaternion };
  }
  const index = seat % (COASTER.cars * COASTER.seatsPerCar);
  const car = carPose(Math.floor(index / COASTER.seatsPerCar), seconds);
  const across = (index % COASTER.seatsPerCar ? 1 : -1) * COASTER.seatX;
  const offset = new Vector3(across, COASTER_SEAT_Y - SIT_DROP, -0.05).applyQuaternion(car.quaternion);
  return { position: car.position.add(offset), quaternion: car.quaternion };
}

/** How many riders each ride carries. */
export const RIDE_SEATS: Readonly<Record<RideId, number>> = {
  carousel: CAROUSEL.horses,
  coaster: COASTER.cars * COASTER.seatsPerCar,
  wheel: WHEEL.cars,
  drop: DROP.seats,
};
