import { useMemo } from 'react';
import { BUILDING, FLOORS, FLOOR_HEIGHT } from '../../../lib/scenes/office.js';
import { seeded } from '../../../lib/scenes/skyline.js';
import { Helipad } from '../furniture/Helipad.js';
import { WALL, WALL_LOW, WOOD, WOOD_DARK } from './palette.js';

type Time = 'day' | 'night';

const THICKNESS = 0.5;
const ROOF = {
  x1: BUILDING.left - 0.3,
  x2: BUILDING.right + 0.3,
  z1: BUILDING.back - 0.15,
  z2: BUILDING.front + 0.15,
} as const;
const GARDEN = { x1: -9.6, x2: -2.7, z1: -2.15, z2: 2.15 } as const;
const RAIL = 1.0;

/** Concrete slab with a pale fascia along the front, so the roof edge reads as a finished top. */
function Slab({ night }: { night: boolean }) {
  const width = ROOF.x2 - ROOF.x1;
  const depth = ROOF.z2 - ROOF.z1;
  return (
    <group>
      <mesh position={[0, -THICKNESS / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, THICKNESS, depth]} />
        <meshStandardMaterial color={night ? '#5a5672' : '#cdc8bf'} roughness={0.95} />
      </mesh>
      <mesh position={[0, -THICKNESS / 2, ROOF.z2 + 0.01]}>
        <boxGeometry args={[width + 0.02, THICKNESS, 0.04]} />
        <meshStandardMaterial color={night ? '#8a85a6' : '#ece6db'} roughness={0.7} />
      </mesh>
      <mesh position={[0, -THICKNESS + 0.07, ROOF.z2 + 0.035]}>
        <boxGeometry args={[width + 0.02, 0.04, 0.02]} />
        <meshBasicMaterial color={night ? '#ffd38a' : '#b9b2a6'} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Glass balustrade round the roof edge with a slim steel handrail. */
function Railing() {
  const runs = [
    { x: 0, z: ROOF.z2 - 0.05, length: ROOF.x2 - ROOF.x1, turn: 0 },
    { x: 0, z: ROOF.z1 + 0.05, length: ROOF.x2 - ROOF.x1, turn: 0 },
    { x: ROOF.x1 + 0.05, z: 0, length: ROOF.z2 - ROOF.z1, turn: Math.PI / 2 },
    { x: ROOF.x2 - 0.05, z: 0, length: ROOF.z2 - ROOF.z1, turn: Math.PI / 2 },
  ];
  return (
    <group>
      {runs.map((run) => (
        <group key={`${run.x},${run.z}`} position={[run.x, 0, run.z]} rotation={[0, run.turn, 0]}>
          <mesh position={[0, RAIL / 2, 0]}>
            <boxGeometry args={[run.length, RAIL - 0.06, 0.02]} />
            <meshPhysicalMaterial color="#dff2ff" transparent opacity={0.2} roughness={0.05} depthWrite={false} />
          </mesh>
          <mesh position={[0, RAIL, 0]}>
            <boxGeometry args={[run.length, 0.04, 0.06]} />
            <meshStandardMaterial color="#c3c8d1" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Shrub({ at, size, color }: { at: [number, number, number]; size: number; color: string }) {
  return (
    <mesh position={at} scale={[size, size * 0.8, size]} castShadow>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color={color} roughness={0.9} flatShading />
    </mesh>
  );
}

function SmallTree({ x, z, seed }: { x: number; z: number; seed: number }) {
  const crown = useMemo(() => {
    const random = seeded(seed);
    return Array.from({ length: 3 }, () => ({
      at: [(random() - 0.5) * 0.5, 1.7 + random() * 0.35, (random() - 0.5) * 0.5] as [number, number, number],
      size: 0.45 + random() * 0.2,
    }));
  }, [seed]);
  return (
    <group position={[x, 0.45, z]}>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 1.4, 8]} />
        <meshStandardMaterial color="#6e5440" roughness={0.9} />
      </mesh>
      {crown.map(({ at, size }, i) => (
        <Shrub key={i} at={at} size={size} color={i % 2 ? '#5aa865' : '#4f9a5a'} />
      ))}
    </group>
  );
}

/** Raised bed along the back of the garden: timber-clad box, lawn on top, shrubs and two trees. */
function PlanterBed() {
  const x1 = GARDEN.x1 + 0.2;
  const x2 = GARDEN.x2 - 0.2;
  const z = GARDEN.z1 + 0.45;
  const width = x2 - x1;
  const shrubs = useMemo(() => {
    const random = seeded(61);
    return Array.from({ length: 9 }, (_, i) => ({
      at: [x1 + 0.4 + (i * (width - 0.8)) / 8, 0.6, z + (random() - 0.5) * 0.3] as [number, number, number],
      size: 0.22 + random() * 0.12,
      color: ['#4f9a5a', '#6bb86e', '#3f8a52'][i % 3] as string,
    }));
  }, [x1, width, z]);
  return (
    <group>
      <mesh position={[(x1 + x2) / 2, 0.22, z]} castShadow>
        <boxGeometry args={[width, 0.44, 0.7]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.85} />
      </mesh>
      <mesh position={[(x1 + x2) / 2, 0.45, z]}>
        <boxGeometry args={[width - 0.08, 0.04, 0.62]} />
        <meshStandardMaterial color="#6fbf6a" roughness={1} />
      </mesh>
      {shrubs.map((shrub, i) => (
        <Shrub key={i} {...shrub} />
      ))}
      <SmallTree x={x1 + 0.9} z={z} seed={71} />
      <SmallTree x={x2 - 0.9} z={z} seed={72} />
    </group>
  );
}

/** Timber pergola with string lights that glow at night. */
function Pergola({ night }: { night: boolean }) {
  const x1 = -7.9;
  const x2 = -4.5;
  const z1 = -0.9;
  const z2 = 1.5;
  const height = 2.1;
  const bulbs = useMemo(() => Array.from({ length: 9 }, (_, i) => x1 + 0.2 + (i * (x2 - x1 - 0.4)) / 8), []);
  return (
    <group>
      {[x1, x2].flatMap((x) =>
        [z1, z2].map((z) => (
          <mesh key={`${x},${z}`} position={[x, height / 2, z]} castShadow>
            <boxGeometry args={[0.12, height, 0.12]} />
            <meshStandardMaterial color={WOOD_DARK} roughness={0.8} />
          </mesh>
        )),
      )}
      {[z1, z2].map((z) => (
        <mesh key={z} position={[(x1 + x2) / 2, height, z]}>
          <boxGeometry args={[x2 - x1 + 0.3, 0.14, 0.1]} />
          <meshStandardMaterial color={WOOD_DARK} roughness={0.8} />
        </mesh>
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[x1 + (i * (x2 - x1)) / 7, height + 0.1, (z1 + z2) / 2]}>
          <boxGeometry args={[0.06, 0.08, z2 - z1 + 0.3]} />
          <meshStandardMaterial color={WOOD} roughness={0.8} />
        </mesh>
      ))}
      {/* Two strings of bulbs hanging just under the beams. */}
      {[z1 + 0.6, z2 - 0.6].flatMap((z) =>
        bulbs.map((x, i) => (
          <mesh key={`${x},${z}`} position={[x, height - 0.18 - Math.sin((i / (bulbs.length - 1)) * Math.PI) * 0.15, z]}>
            <sphereGeometry args={[0.045, 8, 6]} />
            <meshBasicMaterial color={night ? '#ffd892' : '#f3eee2'} toneMapped={false} />
          </mesh>
        )),
      )}
      {night ? <pointLight position={[(x1 + x2) / 2, height - 0.4, (z1 + z2) / 2]} color="#ffcf8a" intensity={4} distance={5} decay={1.6} /> : null}
    </group>
  );
}

/** Sun lounger: a low frame with a cushion and a raised back. */
function Lounger({ x, z, cushion }: { x: number; z: number; cushion: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.2, 0.1]}>
        <boxGeometry args={[0.6, 0.08, 1.2]} />
        <meshStandardMaterial color={WOOD} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.28, 0.15]}>
        <boxGeometry args={[0.54, 0.08, 1.05]} />
        <meshStandardMaterial color={cushion} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.48, -0.5]} rotation={[-0.55, 0, 0]}>
        <boxGeometry args={[0.54, 0.5, 0.08]} />
        <meshStandardMaterial color={cushion} roughness={0.95} />
      </mesh>
      {[-0.25, 0.25].flatMap((dx) =>
        [-0.4, 0.6].map((dz) => (
          <mesh key={`${dx},${dz}`} position={[dx, 0.08, dz]}>
            <boxGeometry args={[0.05, 0.16, 0.05]} />
            <meshStandardMaterial color={WOOD_DARK} />
          </mesh>
        )),
      )}
    </group>
  );
}

/** Garden on the left of the roof: timber deck, planting, pergola and loungers. */
function SkyGarden({ night }: { night: boolean }) {
  const width = GARDEN.x2 - GARDEN.x1;
  const depth = GARDEN.z2 - GARDEN.z1;
  const planks = Math.round(depth / 0.3);
  return (
    <group>
      <mesh position={[(GARDEN.x1 + GARDEN.x2) / 2, 0.04, 0]} receiveShadow>
        <boxGeometry args={[width, 0.08, depth]} />
        <meshStandardMaterial color={WOOD} roughness={0.85} />
      </mesh>
      {Array.from({ length: planks - 1 }, (_, i) => (
        <mesh key={i} position={[(GARDEN.x1 + GARDEN.x2) / 2, 0.082, GARDEN.z1 + ((i + 1) * depth) / planks]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width, 0.02]} />
          <meshBasicMaterial color={WOOD_DARK} />
        </mesh>
      ))}
      <PlanterBed />
      <Pergola night={night} />
      <Lounger x={-6.9} z={0.35} cushion="#f2efe8" />
      <Lounger x={-5.5} z={0.35} cushion="#7fb7c9" />
      <mesh position={[-6.2, 0.25, 0.9]}>
        <cylinderGeometry args={[0.22, 0.22, 0.04, 20]} />
        <meshStandardMaterial color={WALL} />
      </mesh>
      <mesh position={[-6.2, 0.12, 0.9]}>
        <cylinderGeometry args={[0.03, 0.03, 0.24, 8]} />
        <meshStandardMaterial color="#9aa0aa" metalness={0.7} />
      </mesh>
      {/* Low box hedge along the front, kept short so the garden stays visible. */}
      <mesh position={[(GARDEN.x1 + GARDEN.x2) / 2 - 0.9, 0.2, GARDEN.z2 - 0.3]}>
        <boxGeometry args={[width - 2.4, 0.3, 0.3]} />
        <meshStandardMaterial color="#4f9a5a" roughness={1} flatShading />
      </mesh>
    </group>
  );
}

/** Stair hut for roof access, with the antenna and its warning light on top. */
function AccessHut({ night }: { night: boolean }) {
  const x = 8.3;
  const z = -0.9;
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <boxGeometry args={[2.2, 2.2, 2.2]} />
        <meshStandardMaterial color={WALL_LOW} roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.26, 0]}>
        <boxGeometry args={[2.4, 0.12, 2.4]} />
        <meshStandardMaterial color={night ? '#8a85a6' : '#ece6db'} />
      </mesh>
      {/* Door facing the helipad, with a lamp above it. */}
      <mesh position={[-1.105, 0.95, 0.3]}>
        <boxGeometry args={[0.02, 1.9, 0.9]} />
        <meshStandardMaterial color="#5d6273" roughness={0.6} />
      </mesh>
      <mesh position={[-1.12, 2.0, 0.3]}>
        <boxGeometry args={[0.04, 0.08, 0.3]} />
        <meshBasicMaterial color={night ? '#ffe2a8' : '#d9dde6'} toneMapped={false} />
      </mesh>
      <mesh position={[0.4, 3.5, -0.4]}>
        <cylinderGeometry args={[0.04, 0.04, 2.4, 6]} />
        <meshStandardMaterial color="#9aa0c8" />
      </mesh>
      <mesh position={[0.4, 4.75, -0.4]}>
        <sphereGeometry args={[0.1, 10, 8]} />
        <meshBasicMaterial color="#ff5d6c" />
      </mesh>
    </group>
  );
}

/** Two rows of tilted solar panels between the helipad and the stair hut. */
function SolarPanels() {
  const columns = [3.6, 5.0];
  const rows = [-1.3, 0.6];
  return (
    <group>
      {columns.flatMap((x) =>
        rows.map((z) => (
          <group key={`${x},${z}`} position={[x, 0, z]}>
            <mesh position={[0, 0.2, 0.25]}>
              <boxGeometry args={[1.2, 0.4, 0.06]} />
              <meshStandardMaterial color="#9aa0aa" metalness={0.6} />
            </mesh>
            <mesh position={[0, 0.4, 0]} rotation={[-0.5, 0, 0]} castShadow>
              <boxGeometry args={[1.3, 0.04, 1.1]} />
              <meshStandardMaterial color="#24325c" metalness={0.5} roughness={0.25} />
            </mesh>
            {[-0.33, 0, 0.33].map((dx) => (
              <mesh key={dx} position={[dx, 0.425, 0]} rotation={[-0.5, 0, 0]}>
                <boxGeometry args={[0.015, 0.01, 1.1]} />
                <meshBasicMaterial color="#8ea2d6" />
              </mesh>
            ))}
          </group>
        )),
      )}
    </group>
  );
}

/** The roof: finished slab, glass railing, sky garden, helipad, solar panels and the stair hut. */
export function Rooftop({ time }: { time: Time }) {
  const night = time === 'night';
  return (
    <group position={[0, FLOORS * FLOOR_HEIGHT + THICKNESS, 0]}>
      <Slab night={night} />
      <Railing />
      <SkyGarden night={night} />
      <Helipad night={night} />
      <SolarPanels />
      <AccessHut night={night} />
    </group>
  );
}
