import { useMemo } from 'react';
import { BUILDING, FLOOR_HEIGHT, FLOOR_TAG, FLOORS, ROOMS, STAIR_OPENING, type Room } from '../../../lib/scenes/office.js';
import { slabAround } from '../../../lib/scenes/slab.js';
import { cityViewTexture, facade, nightFacade } from '../textures.js';
import { Rooftop } from './Rooftop.js';
import { FRAME, ROOM_ACCENT, WALL, WALL_LOW, WOOD } from './palette.js';

const SLAB = 0.26;
const WALL_DEPTH = 0.22;
const WINDOW_BOTTOM = 1.0;
const WINDOW_TOP = 2.75;

const SLAB_EDGE = 0.2;

type Time = 'day' | 'night';

function Slab({ y, floor, accentRooms }: { y: number; floor: number; accentRooms: Room[] }) {
  const full = { x1: BUILDING.left, x2: BUILDING.right, z1: BUILDING.back, z2: BUILDING.front };
  const hole = STAIR_OPENING.floor === floor ? STAIR_OPENING : null;
  const pieces = slabAround(full, hole);
  const floorPieces = slabAround({ ...full, x1: full.x1 + SLAB_EDGE, x2: full.x2 - SLAB_EDGE }, hole);
  return (
    <group>
      {pieces.map((r) => (
        <mesh key={`s${r.x1},${r.z1}`} position={[(r.x1 + r.x2) / 2, y - SLAB / 2, (r.z1 + r.z2) / 2]} receiveShadow castShadow>
          <boxGeometry args={[r.x2 - r.x1, SLAB, r.z2 - r.z1]} />
          <meshStandardMaterial color={FRAME} roughness={0.8} />
        </mesh>
      ))}
      {floorPieces.map((r) => (
        <mesh key={`f${r.x1},${r.z1}`} position={[(r.x1 + r.x2) / 2, y + 0.004, (r.z1 + r.z2) / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[r.x2 - r.x1, r.z2 - r.z1]} />
          <meshStandardMaterial color={WOOD} roughness={0.85} />
        </mesh>
      ))}
      {/* Light strip along each room's front edge, starting where the floor tag ends so they never overlap. */}
      {accentRooms.map((room) => {
        const start = room.left + FLOOR_TAG.inset + FLOOR_TAG.width + 0.1;
        const end = room.right - 0.1;
        return (
          <mesh key={room.id} position={[(start + end) / 2, y - SLAB + 0.05, BUILDING.front + 0.01]}>
            <boxGeometry args={[end - start, 0.05, 0.02]} />
            <meshBasicMaterial color={ROOM_ACCENT[room.id]} />
          </mesh>
        );
      })}
    </group>
  );
}

/** Glass guard rail around the stairwell on the upper floor. The end where the stair arrives stays open. */
function StairwellRail() {
  const y = STAIR_OPENING.floor * FLOOR_HEIGHT;
  const { x1, x2, z1, z2 } = STAIR_OPENING;
  const height = 0.95;
  const runs = [
    { x: (x1 + x2) / 2, z: z2, length: x2 - x1, rotation: 0 },
    { x: x1, z: (z1 + z2) / 2, length: z2 - z1, rotation: Math.PI / 2 },
  ];
  const posts: Array<[number, number]> = [
    [x1, z2],
    [(x1 + x2) / 2, z2],
    [x2, z2],
    [x1, z1 + 0.25],
  ];
  return (
    <group position={[0, y, 0]}>
      {runs.map((run) => (
        <group key={run.rotation} position={[run.x, 0, run.z]} rotation={[0, run.rotation, 0]}>
          <mesh position={[0, height / 2, 0]}>
            <boxGeometry args={[run.length, height - 0.08, 0.015]} />
            <meshPhysicalMaterial color="#dff2ff" transparent opacity={0.22} roughness={0.05} />
          </mesh>
          <mesh position={[0, height, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.025, 0.025, run.length + 0.05, 12]} />
            <meshStandardMaterial color="#9a6a42" roughness={0.4} />
          </mesh>
          {/* Edge trim where the floor stops, so the cut reads clearly from below. */}
          <mesh position={[0, -SLAB / 2, 0]}>
            <boxGeometry args={[run.length, SLAB, 0.04]} />
            <meshStandardMaterial color="#e6d2bb" roughness={0.8} />
          </mesh>
        </group>
      ))}
      {posts.map(([px, pz]) => (
        <mesh key={`${px},${pz}`} position={[px, height / 2, pz]}>
          <cylinderGeometry args={[0.02, 0.02, height, 10]} />
          <meshStandardMaterial color="#c6cacd" metalness={0.85} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

function BackWall({ room, seed, time }: { room: Room; seed: number; time: Time }) {
  const y = room.floor * FLOOR_HEIGHT;
  const width = room.right - room.left;
  const x = (room.left + room.right) / 2;
  const view = cityViewTexture(seed, time);
  const panes = Math.max(2, Math.round(width / 2.2));
  const z = BUILDING.back + WALL_DEPTH / 2;
  return (
    <group position={[x, y, 0]}>
      <mesh position={[0, WINDOW_BOTTOM / 2, z]} receiveShadow>
        <boxGeometry args={[width, WINDOW_BOTTOM, WALL_DEPTH]} />
        <meshStandardMaterial color={WALL_LOW} roughness={0.9} />
      </mesh>
      <mesh position={[0, (WINDOW_TOP + FLOOR_HEIGHT) / 2, z]} receiveShadow>
        <boxGeometry args={[width, FLOOR_HEIGHT - WINDOW_TOP, WALL_DEPTH]} />
        <meshStandardMaterial color={WALL} roughness={0.9} />
      </mesh>
      <mesh position={[0, (WINDOW_BOTTOM + WINDOW_TOP) / 2, BUILDING.back + 0.02]}>
        <planeGeometry args={[width, WINDOW_TOP - WINDOW_BOTTOM]} />
        <meshBasicMaterial map={view} toneMapped={false} />
      </mesh>
      {Array.from({ length: panes + 1 }, (_, i) => (
        <mesh key={i} position={[-width / 2 + (i * width) / panes, (WINDOW_BOTTOM + WINDOW_TOP) / 2, z]}>
          <boxGeometry args={[0.08, WINDOW_TOP - WINDOW_BOTTOM, WALL_DEPTH + 0.02]} />
          <meshStandardMaterial color={WALL} />
        </mesh>
      ))}
      <mesh position={[0, WINDOW_BOTTOM + 0.03, z + 0.12]} castShadow>
        <boxGeometry args={[width, 0.06, 0.2]} />
        <meshStandardMaterial color={WALL} />
      </mesh>
    </group>
  );
}

function CeilingLights({ room, time }: { room: Room; time: Time }) {
  const y = room.floor * FLOOR_HEIGHT + FLOOR_HEIGHT - SLAB - 0.06;
  const width = room.right - room.left;
  const bars = Math.max(2, Math.round(width / 3.2));
  const x = (room.left + room.right) / 2;
  return (
    <group>
      {Array.from({ length: bars }, (_, i) => (
        <mesh key={i} position={[room.left + ((i + 0.5) * width) / bars, y, 0]}>
          <boxGeometry args={[1.3, 0.06, 0.22]} />
          <meshBasicMaterial color="#fff3dc" />
        </mesh>
      ))}
      {/* Office lights still glow by day, just less: daylight does most of the work. */}
      <pointLight position={[x, y - 0.5, 0.6]} color="#ffd6a3" intensity={width * (time === 'night' ? 3.2 : 1.2)} distance={width + 4} decay={1.6} />
    </group>
  );
}

function Divider({ floor }: { floor: number }) {
  return (
    <mesh position={[0, floor * FLOOR_HEIGHT + (FLOOR_HEIGHT - SLAB) / 2, -0.4]} castShadow receiveShadow>
      <boxGeometry args={[0.3, FLOOR_HEIGHT - SLAB, BUILDING.front - BUILDING.back - 0.8]} />
      <meshStandardMaterial color={WALL_LOW} roughness={0.9} />
    </mesh>
  );
}

/** Floor-to-ceiling glass with slim mullions, so each side of the tower is see-through. */
function GlassSide({ x, time }: { x: number; time: Time }) {
  const height = FLOORS * FLOOR_HEIGHT;
  const depth = BUILDING.front - BUILDING.back;
  const mullions = 2;
  // Light aluminium by day so the side reads as glass, the dark frame colour at night.
  const frame = time === 'night' ? FRAME : '#b4bdd6';
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[0.04, height, depth]} />
        <meshPhysicalMaterial color={time === 'night' ? '#9fb4ff' : '#cfe6ff'} transparent opacity={time === 'night' ? 0.12 : 0.22} roughness={0.05} metalness={0.1} />
      </mesh>
      {Array.from({ length: mullions + 1 }, (_, i) => (
        <mesh key={`v${i}`} position={[0, height / 2, BUILDING.back + (i * depth) / mullions]}>
          <boxGeometry args={[0.07, height, 0.05]} />
          <meshStandardMaterial color={frame} roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
      {Array.from({ length: FLOORS + 1 }, (_, floor) => (
        <mesh key={`h${floor}`} position={[0, floor * FLOOR_HEIGHT - SLAB / 2, 0]}>
          <boxGeometry args={[0.1, SLAB, depth + 0.02]} />
          <meshStandardMaterial color={frame} roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Outer skin on the back of the tower. Seen from behind it is a plain window facade, and it hides the
 * inside faces of the back walls and slabs, which share a plane and would otherwise flicker.
 */
function BackFacade({ time }: { time: Time }) {
  const width = BUILDING.right - BUILDING.left + 0.2;
  const height = FLOORS * FLOOR_HEIGHT + SLAB;
  const map = useMemo(() => (time === 'night' ? nightFacade(5, 1.25) : facade(5, 1.25)), [time]);
  return (
    <mesh position={[0, height / 2 - SLAB, BUILDING.back - 0.08]}>
      <boxGeometry args={[width, height, 0.12]} />
      {time === 'night' ? (
        <meshStandardMaterial color="#ffffff" map={map} emissiveMap={map} emissive="#ffffff" emissiveIntensity={0.7} />
      ) : (
        <meshStandardMaterial color="#c9d3ec" map={map} roughness={0.8} />
      )}
    </mesh>
  );
}

/** Glass sides, back skin and the roof seen from outside. */
function Exterior({ time }: { time: Time }) {
  return (
    <group>
      <GlassSide x={BUILDING.left - 0.06} time={time} />
      <GlassSide x={BUILDING.right + 0.06} time={time} />
      <BackFacade time={time} />
      <Rooftop time={time} />
    </group>
  );
}

export function OfficeShell({ time }: { time: Time }) {
  const rooms = Object.values(ROOMS);
  return (
    <group>
      {Array.from({ length: FLOORS }, (_, floor) => (
        <Slab key={floor} y={floor * FLOOR_HEIGHT} floor={floor} accentRooms={rooms.filter((room) => room.floor === floor)} />
      ))}
      <mesh position={[0, FLOORS * FLOOR_HEIGHT - SLAB / 2, 0]}>
        <boxGeometry args={[BUILDING.right - BUILDING.left, SLAB, BUILDING.front - BUILDING.back]} />
        <meshStandardMaterial color={FRAME} />
      </mesh>
      {rooms.map((room, index) => (
        <group key={room.id}>
          <BackWall room={room} seed={41 + index * 7} time={time} />
          <CeilingLights room={room} time={time} />
        </group>
      ))}
      <StairwellRail />
      <Divider floor={1} />
      <Divider floor={2} />
      <Exterior time={time} />
    </group>
  );
}
