import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, type Mesh } from 'three';
import { FOUNTAIN, GATE, GROUNDS, groundDistance, PATHS, PLAZA } from '../../../lib/scenes/park-layout.js';
import { seeded } from '../../../lib/scenes/skyline.js';
import type { Vec3 } from '../../../lib/scenes/types.js';
import { useCanvasTexture } from '../office/canvas-texture.js';
import { Amenities } from './Amenities.js';
import { NightLights } from './NightLights.js';
import { Coaster } from './Coaster.js';
import { surfaces } from './materials.js';
import { DropTower } from './DropTower.js';
import { FerrisWheel } from './FerrisWheel.js';
import { Bulb, CANDY, Strut } from './parts.js';

type Time = 'day' | 'night';


/** One sett-paving texture tile covers this many metres. */
const SETT_TILE = 1.6;
const LAWN_TILE = 4;

/** A paved path with a low kerb along each side. */
function Path({ from, to, width, night }: { from: Vec3; to: Vec3; width: number; night: boolean }) {
  const length = groundDistance(from, to);
  const yaw = Math.atan2(to[0] - from[0], to[2] - from[2]);
  const paving = useMemo(() => surfaces.paving(night, width / SETT_TILE, length / SETT_TILE), [night, width, length]);
  return (
    <group position={[(from[0] + to[0]) / 2, 0, (from[2] + to[2]) / 2]} rotation={[0, yaw, 0]}>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial {...paving} roughness={1} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[(side * width) / 2, 0.035, 0]} receiveShadow>
          <boxGeometry args={[0.12, 0.07, length]} />
          <meshStandardMaterial color={night ? '#544b70' : '#d9cbb3'} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/** Low picket fence round the grounds, open at the gate. */
function Fence() {
  const { x1, x2, z1, z2 } = GROUNDS;
  const gateLeft = GATE.x - GATE.width / 2;
  const gateRight = GATE.x + GATE.width / 2;
  const runs: Array<[Vec3, Vec3]> = [
    [[x1, 0, z1], [x2, 0, z1]],
    [[x1, 0, z1], [x1, 0, z2]],
    [[x2, 0, z1], [x2, 0, z2]],
    [[x1, 0, z2], [gateLeft, 0, z2]],
    [[gateRight, 0, z2], [x2, 0, z2]],
  ];
  return (
    <group>
      {runs.map(([from, to]) => {
        const length = groundDistance(from, to);
        const posts = Math.max(2, Math.round(length / 1.2));
        return (
          <group key={`${from}`}>
            {[0.35, 0.65].map((y) => (
              <Strut key={y} from={[from[0], y, from[2]]} to={[to[0], y, to[2]]} radius={0.03} color="#ffffff" metal={false} />
            ))}
            {Array.from({ length: posts + 1 }, (_, i) => {
              const t = i / posts;
              return (
                <mesh key={i} position={[from[0] + (to[0] - from[0]) * t, 0.4, from[2] + (to[2] - from[2]) * t]}>
                  <boxGeometry args={[0.08, 0.8, 0.08]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.8} />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

function drawSign(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = '#ff5d6c';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#ffd25e';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, width - 16, height - 16);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 64px "Baloo 2", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('UNPAIDINTERNS PARK', width / 2, height / 2 + 4);
}

/** Entrance arch: striped pillars, a sign across the top and bulbs round the arch. */
function Gate({ night }: { night: boolean }) {
  const sign = useCanvasTexture(1024, 160, drawSign, 'park-sign');
  const half = GATE.width / 2;
  return (
    <group position={[GATE.x, 0, GATE.z]}>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (half + 0.3), 0, 0]}>
          {Array.from({ length: 6 }, (_, i) => (
            <mesh key={i} position={[0, 0.3 + i * 0.6, 0]} castShadow>
              <boxGeometry args={[0.55, 0.6, 0.55]} />
              <meshStandardMaterial color={i % 2 ? '#ffffff' : '#ff5d6c'} roughness={0.7} />
            </mesh>
          ))}
          <mesh position={[0, 3.85, 0]}>
            <coneGeometry args={[0.45, 0.6, 4]} />
            <meshStandardMaterial color="#ffd25e" roughness={0.5} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 3.25, 0]} castShadow>
        <boxGeometry args={[GATE.width + 1.2, 0.75, 0.2]} />
        <meshStandardMaterial color="#ff5d6c" />
      </mesh>
      <mesh position={[0, 3.25, 0.11]}>
        <planeGeometry args={[GATE.width + 1.0, 0.62]} />
        <meshBasicMaterial map={sign} toneMapped={false} />
      </mesh>
      {Array.from({ length: 13 }, (_, i) => {
        const a = Math.PI * (i / 12);
        return <Bulb key={i} at={[Math.cos(a) * half, 2.55 + Math.sin(a) * 0.4, 0.15]} night={night} color={CANDY[i % CANDY.length]} size={0.06} />;
      })}
    </group>
  );
}

/** Two-tier fountain with a spray that shimmers. */
function Fountain({ night }: { night: boolean }) {
  const spray = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (spray.current) spray.current.scale.y = 1 + Math.sin(clock.elapsedTime * 3) * 0.08;
  });
  const water = night ? '#4f8fd6' : '#7fd0f5';
  return (
    <group position={FOUNTAIN.at}>
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[FOUNTAIN.radius, FOUNTAIN.radius + 0.05, 0.4, 32, 1, true]} />
        <meshStandardMaterial color="#f2ece2" roughness={0.8} side={2} />
      </mesh>
      <mesh position={[0, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[FOUNTAIN.radius - 0.1, FOUNTAIN.radius + 0.05, 32]} />
        <meshStandardMaterial color="#f2ece2" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[FOUNTAIN.radius - 0.05, 32]} />
        <meshStandardMaterial color={water} roughness={0.1} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.65, 0]}>
        <cylinderGeometry args={[0.12, 0.18, 0.7, 12]} />
        <meshStandardMaterial color="#f2ece2" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.45, 0.25, 0.14, 24]} />
        <meshStandardMaterial color="#f2ece2" roughness={0.8} />
      </mesh>
      <mesh ref={spray} position={[0, 1.35, 0]}>
        <coneGeometry args={[0.32, 0.7, 16, 1, true]} />
        <meshStandardMaterial color={water} transparent opacity={0.45} roughness={0.1} side={2} depthWrite={false} />
      </mesh>
      {night ? <pointLight position={[0, 0.6, 0]} color="#8fd0ff" intensity={3} distance={4} decay={1.6} /> : null}
    </group>
  );
}

/** Old-style lamp post with a round glass globe. */
function Lamp({ at, night }: { at: Vec3; night: boolean }) {
  return (
    <group position={at}>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.2, 10]} />
        <meshStandardMaterial color="#2f3446" metalness={0.5} roughness={0.5} />
      </mesh>
      <Strut from={[0, 0, 0]} to={[0, 2.4, 0]} radius={0.045} color="#2f3446" />
      <mesh position={[0, 2.62, 0]}>
        <sphereGeometry args={[0.2, 14, 12]} />
        <meshBasicMaterial color={night ? '#ffe2a8' : '#f4f1ea'} toneMapped={false} />
      </mesh>
      {night ? (
        <>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[2.2, 28]} />
            <meshBasicMaterial color="#ffd38a" transparent opacity={0.22} depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh position={[0, 2.62, 0]}>
            <sphereGeometry args={[0.6, 12, 10]} />
            <meshBasicMaterial color="#ffd38a" transparent opacity={0.18} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
          </mesh>
          <pointLight position={[0, 2.4, 0]} color="#ffd9a0" intensity={3.5} distance={5} decay={1.5} />
        </>
      ) : null}
    </group>
  );
}

/** Round flower bed with a timber edge and dots of colour. */
function FlowerBed({ at, radius, seed }: { at: Vec3; radius: number; seed: number }) {
  const flowers = useMemo(() => {
    const random = seeded(seed);
    return Array.from({ length: Math.round(radius * 22) }, () => {
      const a = random() * Math.PI * 2;
      const r = Math.sqrt(random()) * (radius - 0.15);
      return { at: [Math.cos(a) * r, 0.2 + random() * 0.06, Math.sin(a) * r] as Vec3, color: CANDY[Math.floor(random() * CANDY.length)] as string };
    });
  }, [radius, seed]);
  return (
    <group position={at}>
      <mesh position={[0, 0.08, 0]} receiveShadow>
        <cylinderGeometry args={[radius, radius, 0.16, 28]} />
        <meshStandardMaterial color="#c99d76" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.165, 0]}>
        <cylinderGeometry args={[radius - 0.08, radius - 0.08, 0.02, 28]} />
        <meshStandardMaterial color="#5aa865" roughness={1} />
      </mesh>
      {flowers.map(({ at: p, color }, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.06, 6, 5]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function Tree({ at, scale = 1 }: { at: Vec3; scale?: number }) {
  return (
    <group position={at} scale={scale}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.11, 1, 8]} />
        <meshStandardMaterial color="#8a6446" />
      </mesh>
      {[[0, 1.35, 0, 0.6], [0.3, 1.15, 0.15, 0.42], [-0.28, 1.2, -0.12, 0.45]].map(([x, y, z, r]) => (
        <mesh key={`${x}`} position={[x as number, y as number, z as number]} castShadow>
          <icosahedronGeometry args={[r as number, 1]} />
          <meshStandardMaterial color="#5aa865" roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  );
}

const LAMPS: readonly Vec3[] = [
  [-3.6, 0, 4.6],
  [6.4, 0, 3.4],
  [6.8, 0, -3.0],
  [-3.2, 0, -4.4],
  [2.2, 0, 9.4],
  [-1.8, 0, 9.4],
  [-7.6, 0, -6.4],
];
const BEDS: ReadonlyArray<[Vec3, number]> = [
  [[-2.8, 0, 8.4], 0.9],
  [[3.4, 0, 8.4], 0.9],
  [[10.8, 0, 6.6], 1.2],
  [[-9.6, 0, 6.2], 1.1],
];
const TREES: readonly Vec3[] = [
  [-11.6, 0, 9.2], [-11.8, 0, 1.4], [-11.5, 0, -12.6], [-6.5, 0, -12.8], [1.2, 0, -12.6],
  [15.6, 0, 9.2], [15.8, 0, 2.6], [12.8, 0, 9.6], [-7.2, 0, 9.8], [5.8, 0, 9.8],
];

/** Theme park grounds: lawns, paved plaza and paths, fence and gate, rides, lamps and planting. */
export function ParkGrounds({ time }: { time: Time }) {
  const night = time === 'night';
  const width = GROUNDS.x2 - GROUNDS.x1;
  const depth = GROUNDS.z2 - GROUNDS.z1;
  const lawn = useMemo(() => surfaces.lawn(night, (width + 1) / LAWN_TILE, (depth + 1) / LAWN_TILE), [night, width, depth]);
  const plaza = useMemo(() => surfaces.paving(night, (PLAZA.radius * 2) / SETT_TILE, (PLAZA.radius * 2) / SETT_TILE), [night]);
  return (
    <group>
      <mesh position={[(GROUNDS.x1 + GROUNDS.x2) / 2, -0.1, (GROUNDS.z1 + GROUNDS.z2) / 2]} receiveShadow>
        <boxGeometry args={[width + 1, 0.2, depth + 1]} />
        <meshStandardMaterial {...lawn} roughness={1} />
      </mesh>
      <mesh position={[PLAZA.centre[0], 0.01, PLAZA.centre[2]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[PLAZA.radius, 64]} />
        <meshStandardMaterial {...plaza} roughness={1} />
      </mesh>
      <mesh position={[PLAZA.centre[0], 0.014, PLAZA.centre[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[PLAZA.radius - 0.25, PLAZA.radius, 48]} />
        <meshStandardMaterial color={night ? '#544b70' : '#d9c6a6'} roughness={0.95} />
      </mesh>
      {PATHS.map(([from, to]) => (
        <Path key={`${from}${to}`} from={from} to={to} width={2.2} night={night} />
      ))}
      <Fence />
      <Gate night={night} />
      <Fountain night={night} />
      <FerrisWheel night={night} />
      <DropTower night={night} />
      <Coaster night={night} />
      <Amenities night={night} />
      {night ? <NightLights /> : null}
      {LAMPS.map((at) => (
        <Lamp key={`${at}`} at={at} night={night} />
      ))}
      {BEDS.map(([at, radius], i) => (
        <FlowerBed key={`${at}`} at={at} radius={radius} seed={90 + i} />
      ))}
      {TREES.map((at, i) => (
        <Tree key={`${at}`} at={at} scale={1.1 + (i % 3) * 0.15} />
      ))}
    </group>
  );
}
