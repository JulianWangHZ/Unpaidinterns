import type { Session } from '@unpaidinterns/core';
import { hexDistance, hexKey, neighbors, ring, spiral, type Hex } from './hex.js';

export const AMENITIES = ['coffee', 'kitchen', 'ktv', 'gym', 'massage', 'ballpit', 'pingpong', 'nap'] as const;
export type Amenity = (typeof AMENITIES)[number];

export const DISTRICT_COLORS = [
  '#ffd3df',
  '#cdeedd',
  '#d6e2ff',
  '#e9e1ff',
  '#ffe8d6',
  '#fff3c4',
  '#d3f1f4',
  '#f3dcf5',
] as const;

const WORK_RING = 3;
const MIN_RADIUS = 4;
const ORIGIN: Hex = { q: 0, r: 0 };

/** Coffee bar sits in the centre, the rest form the first ring, nap pods sit in the walkway ring. */
const AMENITY_HEXES: ReadonlyArray<{ amenity: Amenity; hex: Hex }> = [
  { amenity: 'coffee', hex: ORIGIN },
  ...ring(1).map((hex, index) => ({ amenity: AMENITIES[index + 1] as Amenity, hex })),
  { amenity: 'nap', hex: ring(2)[0] as Hex },
];

export interface Seat {
  hex: Hex;
  sessionId: string;
}

export interface District {
  project: string;
  slot: number;
  color: string;
  anchor: Hex;
  seats: Seat[];
}

export type TileKind = 'amenity' | 'district' | 'empty';

export interface Tile {
  hex: Hex;
  kind: TileKind;
  color: string;
}

export interface IslandLayout {
  radius: number;
  amenities: ReadonlyArray<{ amenity: Amenity; hex: Hex }>;
  districts: District[];
  tiles: Tile[];
}

export type SlotMap = Readonly<Record<string, number>>;

export function assignSlots(projects: readonly string[], saved: SlotMap): Record<string, number> {
  const slots: Record<string, number> = { ...saved };
  const used = new Set(Object.values(slots));
  let next = 0;
  for (const project of projects) {
    if (project in slots) continue;
    while (used.has(next)) next += 1;
    slots[project] = next;
    used.add(next);
  }
  return slots;
}

/** Anchors sit on rings 3, 6, 9… every third tile, so neighbouring districts start apart. */
function anchorFor(slot: number): Hex {
  let remaining = slot;
  for (let level = 1; ; level += 1) {
    const anchors = ring(WORK_RING * level).filter((_, index) => index % WORK_RING === 0);
    if (remaining < anchors.length) return anchors[remaining] as Hex;
    remaining -= anchors.length;
  }
}

/** Breadth-first from the anchor so a district stays one connected patch. */
function claimTiles(anchor: Hex, count: number, taken: Set<string>): Hex[] {
  const claimed: Hex[] = [];
  const queue: Hex[] = [anchor];
  const seen = new Set([hexKey(anchor)]);
  while (claimed.length < count && queue.length > 0) {
    const hex = queue.shift() as Hex;
    if (!taken.has(hexKey(hex))) {
      claimed.push(hex);
      taken.add(hexKey(hex));
    }
    for (const next of neighbors(hex)) {
      if (!seen.has(hexKey(next)) && hexDistance(next, ORIGIN) >= WORK_RING) {
        seen.add(hexKey(next));
        queue.push(next);
      }
    }
  }
  return claimed;
}

const byStart = (a: Session, b: Session) => a.startedAt - b.startedAt || a.sessionId.localeCompare(b.sessionId);

export function buildLayout(sessions: readonly Session[], slots: SlotMap): IslandLayout {
  const main = sessions.filter((session) => !session.parentSessionId);
  const projects = [...new Set(main.map((session) => session.project))].sort(
    (a, b) => (slots[a] ?? Number.MAX_SAFE_INTEGER) - (slots[b] ?? Number.MAX_SAFE_INTEGER),
  );
  const taken = new Set(AMENITY_HEXES.map(({ hex }) => hexKey(hex)));

  const districts = projects.map((project) => {
    const slot = slots[project] ?? 0;
    const anchor = anchorFor(slot);
    const members = main.filter((session) => session.project === project).sort(byStart);
    const hexes = claimTiles(anchor, members.length, taken);
    const seats = members.map((session, index) => ({ hex: hexes[index] as Hex, sessionId: session.sessionId }));
    return { project, slot, color: DISTRICT_COLORS[slot % DISTRICT_COLORS.length] as string, anchor, seats };
  });

  const farthest = Math.max(0, ...districts.flatMap((d) => d.seats.map((seat) => hexDistance(seat.hex, ORIGIN))));
  const radius = Math.max(MIN_RADIUS, farthest + 1);
  const seatColor = new Map(districts.flatMap((d) => d.seats.map((seat) => [hexKey(seat.hex), d.color] as const)));
  const amenityKeys = new Set(AMENITY_HEXES.map(({ hex }) => hexKey(hex)));

  const tiles = spiral(radius).map((hex): Tile => {
    const key = hexKey(hex);
    if (amenityKeys.has(key)) return { hex, kind: 'amenity', color: '#fbfaff' };
    const color = seatColor.get(key);
    return color ? { hex, kind: 'district', color } : { hex, kind: 'empty', color: '#ffffff' };
  });

  return { radius, amenities: AMENITY_HEXES, districts, tiles };
}
