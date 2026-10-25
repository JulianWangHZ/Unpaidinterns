import { hexToWorld, type Hex } from './hex.js';

export const HEX_SIZE = 1;

export type Vec3 = [number, number, number];

export interface Spot {
  position: Vec3;
  /** Rotation around Y. Characters face +Z at rotation 0. */
  facing: number;
}

export function tileCentre(hex: Hex): Vec3 {
  const [x, z] = hexToWorld(hex, HEX_SIZE);
  return [x, 0, z];
}

/** The desk sits slightly back on the tile; the agent sits in front of it, facing it. */
export function deskSpot(hex: Hex): Spot {
  const [x, , z] = tileCentre(hex);
  return { position: [x, 0, z + 0.32], facing: Math.PI };
}

const SEATS_PER_CIRCLE = 4;

export function amenitySeat(hex: Hex, seat: number): Spot {
  const [cx, , cz] = tileCentre(hex);
  const circle = Math.floor(seat / SEATS_PER_CIRCLE);
  const angle = ((seat % SEATS_PER_CIRCLE) / SEATS_PER_CIRCLE) * Math.PI * 2 + Math.PI / 4 + circle * 0.4;
  const radius = 0.52 + circle * 0.3;
  const x = Math.sin(angle) * radius;
  const z = Math.cos(angle) * radius;
  return { position: [cx + x, 0, cz + z], facing: Math.atan2(-x, -z) };
}

export function internOffset([x, y, z]: Vec3): Vec3 {
  return [x + 0.42, y, z + 0.18];
}
