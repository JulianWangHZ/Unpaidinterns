import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { AdditiveBlending, CatmullRomCurve3, Color, Object3D, TubeGeometry, Vector3, type Group, type InstancedMesh } from 'three';
import {
  DECK,
  LANE_WIDTH,
  LANES,
  LAP_POOL,
  LIFEGUARD,
  PALMS,
  SPLASH_POOL,
  WATER,
} from '../../../lib/scenes/pool-layout.js';
import { seeded } from '../../../lib/scenes/skyline.js';
import { slabAroundAll, type Rect } from '../../../lib/scenes/slab.js';
import type { Vec3 } from '../../../lib/scenes/types.js';
import { surfaces } from '../park/materials.js';
import { Strut } from '../park/parts.js';
import { PoolNightLights } from './PoolNightLights.js';
import { WaterSlide } from './WaterSlide.js';
import { WaterSurface } from './Water.js';

type Time = 'day' | 'night';

const DECK_THICKNESS = 0.3;
const COPING = 0.18;
const TILE = 1.2;

/** Pale stone deck in slabs that leave the pools open. */
function Deck({ night }: { night: boolean }) {
  const pieces = useMemo(() => slabAroundAll(DECK, [LAP_POOL, SPLASH_POOL]), []);
  return (
    <group>
      {pieces.map((r) => (
        <DeckPiece key={`${r.x1},${r.z1}`} rect={r} night={night} />
      ))}
      {/* Stone plinth under the deck down to the shore, so the deck reads as built, not floating. */}
      {pieces.map((r) => (
        <mesh key={`p${r.x1},${r.z1}`} position={[(r.x1 + r.x2) / 2, -DECK_THICKNESS - 0.45, (r.z1 + r.z2) / 2]} receiveShadow>
          <boxGeometry args={[r.x2 - r.x1, 0.9, r.z2 - r.z1]} />
          <meshStandardMaterial color={night ? '#5d5878' : '#d9cfbd'} roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

function DeckPiece({ rect, night }: { rect: Rect; night: boolean }) {
  const width = rect.x2 - rect.x1;
  const depth = rect.z2 - rect.z1;
  const stone = useMemo(() => surfaces.travertine(night, width / TILE, depth / TILE), [night, width, depth]);
  return (
    <mesh position={[(rect.x1 + rect.x2) / 2, -DECK_THICKNESS / 2, (rect.z1 + rect.z2) / 2]} receiveShadow>
      <boxGeometry args={[width, DECK_THICKNESS, depth]} />
      <meshStandardMaterial {...stone} roughness={1} />
    </mesh>
  );
}

/**
 * The basin of a pool: mosaic walls and floor, a bullnose coping round the edge, and the water.
 * Walls face inward, so the inside of the basin is what shows.
 */
function Basin({ rect, depth, colour, night, children }: { rect: Rect; depth: number; colour: string; night: boolean; children?: React.ReactNode }) {
  const width = rect.x2 - rect.x1;
  const length = rect.z2 - rect.z1;
  const floor = useMemo(() => surfaces.mosaic(colour, width / 0.8, length / 0.8), [colour, width, length]);
  const wallsX = useMemo(() => surfaces.mosaic(colour, width / 0.8, depth / 0.8), [colour, width, depth]);
  const wallsZ = useMemo(() => surfaces.mosaic(colour, length / 0.8, depth / 0.8), [colour, length, depth]);
  const cx = (rect.x1 + rect.x2) / 2;
  const cz = (rect.z1 + rect.z2) / 2;
  const bottom = WATER - depth + 0.12;
  return (
    <group>
      <mesh position={[cx, bottom, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial {...floor} roughness={1} />
      </mesh>
      {[
        { at: [cx, rect.z1], turn: 0, span: width, maps: wallsX },
        { at: [cx, rect.z2], turn: Math.PI, span: width, maps: wallsX },
        { at: [rect.x1, cz], turn: Math.PI / 2, span: length, maps: wallsZ },
        { at: [rect.x2, cz], turn: -Math.PI / 2, span: length, maps: wallsZ },
      ].map(({ at, turn, span, maps }) => (
        <mesh key={`${at}`} position={[at[0] as number, bottom + (0 - bottom) / 2, at[1] as number]} rotation={[0, turn, 0]}>
          <planeGeometry args={[span, -bottom]} />
          <meshStandardMaterial {...maps} roughness={1} />
        </mesh>
      ))}
      {/* A dark band of tiles at the waterline, as pools have. */}
      {[
        [cx, rect.z1 + 0.005, width, 0],
        [cx, rect.z2 - 0.005, width, Math.PI],
        [rect.x1 + 0.005, cz, length, Math.PI / 2],
        [rect.x2 - 0.005, cz, length, -Math.PI / 2],
      ].map(([x, z, span, turn]) => (
        <mesh key={`b${x},${z}`} position={[x as number, WATER + 0.02, z as number]} rotation={[0, turn as number, 0]}>
          <planeGeometry args={[span as number, 0.12]} />
          <meshStandardMaterial color="#1f5f8a" roughness={0.3} />
        </mesh>
      ))}
      <Coping rect={rect} night={night} />
      <WaterSurface x={cx} z={cz} width={width} depth={length} y={WATER} night={night} />
      {children}
    </group>
  );
}

/** Rounded stone lip round the pool edge, overhanging the water a little. */
function Coping({ rect, night }: { rect: Rect; night: boolean }) {
  const colour = night ? '#a7a2c4' : '#faf6ee';
  const runs = [
    { x: (rect.x1 + rect.x2) / 2, z: rect.z1, along: rect.x2 - rect.x1 + COPING * 2, turn: 0 },
    { x: (rect.x1 + rect.x2) / 2, z: rect.z2, along: rect.x2 - rect.x1 + COPING * 2, turn: 0 },
    { x: rect.x1, z: (rect.z1 + rect.z2) / 2, along: rect.z2 - rect.z1, turn: Math.PI / 2 },
    { x: rect.x2, z: (rect.z1 + rect.z2) / 2, along: rect.z2 - rect.z1, turn: Math.PI / 2 },
  ];
  return (
    <group>
      {runs.map((run) => (
        <group key={`${run.x},${run.z}`} position={[run.x, 0.02, run.z]} rotation={[0, run.turn, 0]}>
          <mesh receiveShadow castShadow>
            <boxGeometry args={[run.along, 0.06, COPING * 2]} />
            <meshStandardMaterial color={colour} roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const ROPE_COLOURS = ['#e8364d', '#ffffff', '#2a74d6'];

/**
 * Lane ropes as rows of floats: red and white near the walls so swimmers see the end coming,
 * blue down the middle. One instanced mesh for every float in the pool.
 */
function LaneRopes() {
  const mesh = useRef<InstancedMesh>(null);
  const floats = useMemo(() => {
    const spacing = 0.16;
    const length = LAP_POOL.z2 - LAP_POOL.z1;
    const count = Math.floor(length / spacing);
    return Array.from({ length: LANES - 1 }, (_, lane) =>
      Array.from({ length: count }, (_, i) => {
        const z = LAP_POOL.z1 + (i + 0.5) * spacing;
        const fromWall = Math.min(z - LAP_POOL.z1, LAP_POOL.z2 - z);
        const colour = fromWall < 1.4 ? ROPE_COLOURS[i % 2] : ROPE_COLOURS[i % 4 === 0 ? 1 : 2];
        return { at: [LAP_POOL.x1 + 0.15 + (lane + 1) * LANE_WIDTH, WATER + 0.01, z] as Vec3, colour: colour as string };
      }),
    ).flat();
  }, []);
  useLayoutEffect(() => {
    const target = mesh.current;
    if (!target) return;
    const dummy = new Object3D();
    floats.forEach(({ at, colour }, i) => {
      dummy.position.set(...at);
      dummy.rotation.set(Math.PI / 2, 0, 0);
      dummy.updateMatrix();
      target.setMatrixAt(i, dummy.matrix);
      target.setColorAt(i, new Color(colour));
    });
    target.instanceMatrix.needsUpdate = true;
    if (target.instanceColor) target.instanceColor.needsUpdate = true;
  }, [floats]);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, floats.length]}>
      <cylinderGeometry args={[0.055, 0.055, 0.13, 10]} />
      <meshStandardMaterial roughness={0.4} />
    </instancedMesh>
  );
}

/** Starting blocks at the deep end, one per lane, each with its number. */
function StartingBlocks() {
  return (
    <group>
      {Array.from({ length: LANES }, (_, lane) => {
        const x = LAP_POOL.x1 + 0.15 + (lane + 0.5) * LANE_WIDTH;
        return (
          <group key={lane} position={[x, 0, LAP_POOL.z1 - 0.35]}>
            <mesh position={[0, 0.3, 0]} castShadow>
              <boxGeometry args={[0.16, 0.6, 0.16]} />
              <meshStandardMaterial color="#d8dce6" metalness={0.6} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.66, 0.1]} rotation={[0.18, 0, 0]} castShadow>
              <boxGeometry args={[0.55, 0.07, 0.6]} />
              <meshStandardMaterial color="#ffffff" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.7, 0.12]} rotation={[0.18 - Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.45, 0.48]} />
              <meshStandardMaterial color="#2a74d6" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.5, 0.39]}>
              <boxGeometry args={[0.24, 0.2, 0.02]} />
              <meshStandardMaterial color={ROPE_COLOURS[lane % 2] as string} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/** Backstroke flags: a line of pennants strung across the pool near each end. */
function BackstrokeFlags() {
  return (
    <group>
      {[LAP_POOL.z1 + 1.2, LAP_POOL.z2 - 1.2].map((z) => (
        <group key={z}>
          {[LAP_POOL.x1 - 0.5, LAP_POOL.x2 + 0.5].map((x) => (
            <Strut key={x} from={[x, 0, z]} to={[x, 1.9, z]} radius={0.03} color="#d8dce6" />
          ))}
          <Strut from={[LAP_POOL.x1 - 0.5, 1.85, z]} to={[LAP_POOL.x2 + 0.5, 1.85, z]} radius={0.006} color="#ffffff" metal={false} />
          {Array.from({ length: 22 }, (_, i) => {
            const x = LAP_POOL.x1 - 0.3 + (i + 0.5) * ((LAP_POOL.x2 - LAP_POOL.x1 + 0.6) / 22);
            return (
              <mesh key={i} position={[x, 1.76, z]} rotation={[0, 0, Math.PI]}>
                <coneGeometry args={[0.08, 0.18, 3]} />
                <meshStandardMaterial color={ROPE_COLOURS[i % 3] as string} side={2} />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
}

/**
 * Chrome pool ladder on the wall at (x, z). In its own frame +z points into the pool: each rail is
 * anchored in the deck behind the coping, arches over it and drops straight down the wall into the
 * water, with treads between the rails under the surface.
 */
function Ladder({ x, z, turn }: { x: number; z: number; turn: number }) {
  const inWater = COPING + 0.1;
  const arc = useMemo(
    () => (side: number) => new TubeGeometry(new CatmullRomCurve3([
      new Vector3(side, 0.02, -0.42),
      new Vector3(side, 0.55, -0.36),
      new Vector3(side, 0.82, -0.1),
      new Vector3(side, 0.7, inWater - 0.04),
      new Vector3(side, 0.35, inWater),
    ]), 24, 0.025, 8, false),
    [inWater],
  );
  return (
    <group position={[x, 0, z]} rotation={[0, turn, 0]}>
      {[-0.22, 0.22].map((side) => (
        <group key={side}>
          <mesh geometry={arc(side)} castShadow>
            <meshStandardMaterial color="#f1f4f8" metalness={0.35} roughness={0.25} />
          </mesh>
          <Strut from={[side, 0.36, inWater]} to={[side, WATER - 1.05, inWater]} radius={0.025} color="#e6eaf0" />
          <mesh position={[side, 0.025, -0.42]}>
            <cylinderGeometry args={[0.05, 0.05, 0.02, 12]} />
            <meshStandardMaterial color="#c3c8d1" metalness={0.8} />
          </mesh>
        </group>
      ))}
      {[WATER - 0.3, WATER - 0.6, WATER - 0.9].map((y) => (
        <mesh key={y} position={[0, y, inWater - 0.03]}>
          <boxGeometry args={[0.44, 0.03, 0.1]} />
          <meshStandardMaterial color="#e6eaf0" metalness={0.8} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

/** Tall lifeguard chair with a ladder, a shade umbrella and a red rescue tube. */
function LifeguardChair() {
  return (
    <group position={LIFEGUARD} rotation={[0, -Math.PI / 2, 0]}>
      {[-0.32, 0.32].flatMap((x) =>
        [-0.32, 0.32].map((z) => <Strut key={`${x},${z}`} from={[x * 1.3, 0, z * 1.3]} to={[x, 1.5, z]} radius={0.04} color="#ffffff" metal={false} />),
      )}
      {[0.4, 0.8, 1.2].map((y) => (
        <mesh key={y} position={[0, y, 0.36 - y * 0.03]}>
          <boxGeometry args={[0.62, 0.04, 0.08]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
      <mesh position={[0, 1.52, 0]} castShadow>
        <boxGeometry args={[0.72, 0.06, 0.6]} />
        <meshStandardMaterial color="#e8364d" />
      </mesh>
      <mesh position={[0, 1.85, -0.28]}>
        <boxGeometry args={[0.72, 0.62, 0.05]} />
        <meshStandardMaterial color="#e8364d" />
      </mesh>
      <Strut from={[0.3, 1.5, -0.3]} to={[0.3, 3.1, -0.3]} radius={0.025} color="#d8dce6" />
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[0.3, 3.1, -0.3]} castShadow>
          <coneGeometry args={[0.9, 0.35, 4, 1, true, (i / 8) * Math.PI * 2, Math.PI / 4]} />
          <meshStandardMaterial color={i % 2 ? '#ffffff' : '#e8364d'} side={2} />
        </mesh>
      ))}
      <mesh position={[-0.42, 0.9, 0.2]} rotation={[0, 0, 0.12]}>
        <capsuleGeometry args={[0.06, 0.7, 4, 8]} />
        <meshStandardMaterial color="#ff3b30" roughness={0.5} />
      </mesh>
    </group>
  );
}

/** Palm tree: a ringed trunk leaning and curving up, with drooping fronds and a few coconuts. */
function Palm({ at, seed }: { at: Vec3; seed: number }) {
  const shape = useMemo(() => {
    const random = seeded(seed);
    const lean = (random() - 0.5) * 0.5;
    const turn = random() * Math.PI * 2;
    const height = 3.2 + random() * 1.2;
    const segments = 9;
    const trunk = Array.from({ length: segments }, (_, i) => {
      const t = i / segments;
      return [Math.sin(lean) * height * t * t * 0.6, height * t, 0] as Vec3;
    });
    return { lean, turn, height, trunk, top: [Math.sin(lean) * height * 0.6, height, 0] as Vec3 };
  }, [seed]);
  const fronds = 9;
  return (
    <group position={at} rotation={[0, shape.turn, 0]}>
      {shape.trunk.map((p, i) => (
        <mesh key={i} position={[p[0], p[1] + shape.height / 18, p[2]]} castShadow>
          <cylinderGeometry args={[0.13 - i * 0.006, 0.16 - i * 0.006, shape.height / 9 + 0.02, 10]} />
          <meshStandardMaterial color={i % 2 ? '#9a7652' : '#8a6848'} roughness={0.95} />
        </mesh>
      ))}
      <group position={shape.top}>
        {Array.from({ length: fronds }, (_, i) => {
          const yaw = (i / fronds) * Math.PI * 2;
          const droop = 0.35 + (i % 3) * 0.18;
          return (
            <group key={i} rotation={[0, yaw, 0]}>
              <group rotation={[0, 0, -droop]}>
                <mesh position={[0.8, 0, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.35]} castShadow>
                  <coneGeometry args={[0.32, 1.7, 4]} />
                  <meshStandardMaterial color={i % 2 ? '#3f9c55' : '#4fae66'} roughness={0.85} flatShading side={2} />
                </mesh>
              </group>
            </group>
          );
        })}
        {[0, 2.1, 4.2].map((a) => (
          <mesh key={a} position={[Math.cos(a) * 0.14, -0.12, Math.sin(a) * 0.14]}>
            <sphereGeometry args={[0.09, 10, 8]} />
            <meshStandardMaterial color="#6b4a2a" roughness={0.8} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Pool toys bobbing on the splash pool: a flamingo, a donut ring and a beach ball. */
function Inflatables() {
  const toys = useRef<Array<Group | null>>([]);
  useFrame(({ clock }) => {
    toys.current.forEach((toy, i) => {
      if (!toy) return;
      const t = clock.elapsedTime * 0.6 + i * 2;
      toy.position.y = WATER + 0.05 + Math.sin(t * 2) * 0.03;
      toy.rotation.y = t * 0.2 + i;
    });
  });
  const spots: Vec3[] = [
    [SPLASH_POOL.x1 + 1.0, 0, SPLASH_POOL.z2 - 1.0],
    [SPLASH_POOL.x2 - 0.8, 0, SPLASH_POOL.z2 - 0.8],
    [SPLASH_POOL.x1 + 0.9, 0, SPLASH_POOL.z1 + 1.0],
  ];
  return (
    <group>
      {spots.map((at, i) => (
        <group
          key={i}
          position={[at[0], WATER, at[2]]}
          ref={(toy) => {
            toys.current[i] = toy;
          }}
        >
          {i === 0 ? (
            <group>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.38, 0.16, 12, 28]} />
                <meshStandardMaterial color="#ff8fc4" roughness={0.3} />
              </mesh>
              <mesh position={[0.36, 0.42, 0]} rotation={[0, 0, -0.3]}>
                <capsuleGeometry args={[0.06, 0.6, 4, 8]} />
                <meshStandardMaterial color="#ff8fc4" roughness={0.3} />
              </mesh>
              <mesh position={[0.48, 0.74, 0]}>
                <sphereGeometry args={[0.1, 12, 10]} />
                <meshStandardMaterial color="#ff8fc4" roughness={0.3} />
              </mesh>
              <mesh position={[0.6, 0.72, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[0.04, 0.12, 8]} />
                <meshStandardMaterial color="#2a2d3a" />
              </mesh>
            </group>
          ) : i === 1 ? (
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.34, 0.15, 12, 28]} />
              <meshStandardMaterial color="#ffd25e" roughness={0.3} />
            </mesh>
          ) : (
            <mesh position={[0, 0.12, 0]}>
              <sphereGeometry args={[0.2, 16, 12]} />
              <meshStandardMaterial color="#4fc3ea" roughness={0.3} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

/** Lights set into the pool walls, and the glow they throw through the water at night. */
function PoolLights({ rect, depth }: { rect: Rect; depth: number }) {
  const y = WATER - depth * 0.45;
  const spots: Vec3[] = [];
  for (let x = rect.x1 + 1.2; x < rect.x2 - 0.6; x += 2.2) spots.push([x, y, rect.z1 + 0.02], [x, y, rect.z2 - 0.02]);
  return (
    <group>
      {spots.map((at) => (
        <mesh key={`${at}`} position={at} rotation={[0, at[2] < (rect.z1 + rect.z2) / 2 ? 0 : Math.PI, 0]}>
          <circleGeometry args={[0.12, 16]} />
          <meshBasicMaterial color="#cdf6ff" toneMapped={false} />
        </mesh>
      ))}
      <pointLight position={[(rect.x1 + rect.x2) / 2, WATER - depth * 0.5, (rect.z1 + rect.z2) / 2]} color="#4fd8ff" intensity={14} distance={Math.max(rect.x2 - rect.x1, rect.z2 - rect.z1) + 2} decay={1.4} />
      <mesh position={[(rect.x1 + rect.x2) / 2, WATER + 0.01, (rect.z1 + rect.z2) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[rect.x2 - rect.x1, rect.z2 - rect.z1]} />
        <meshBasicMaterial color="#2fc2ff" transparent opacity={0.22} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** The pool club: deck, lap pool with lanes, splash pool with the slide, lifeguard, palms and lights. */
export function PoolGrounds({ time }: { time: Time }) {
  const night = time === 'night';
  return (
    <group>
      <Deck night={night} />
      <Basin rect={LAP_POOL} depth={LAP_POOL.depth} colour="#3aa6d8" night={night}>
        {/* Dark lane lines on the floor, ending in a T before each wall. */}
        {Array.from({ length: LANES }, (_, lane) => (
          <mesh key={lane} position={[LAP_POOL.x1 + 0.15 + (lane + 0.5) * LANE_WIDTH, WATER - LAP_POOL.depth + 0.135, (LAP_POOL.z1 + LAP_POOL.z2) / 2]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.2, LAP_POOL.z2 - LAP_POOL.z1 - 1.6]} />
            <meshStandardMaterial color="#173e6e" />
          </mesh>
        ))}
        {night ? <PoolLights rect={LAP_POOL} depth={LAP_POOL.depth} /> : null}
      </Basin>
      <LaneRopes />
      <StartingBlocks />
      <BackstrokeFlags />
      <Ladder x={LAP_POOL.x1} z={LAP_POOL.z2 - 1.2} turn={Math.PI / 2} />
      <Ladder x={LAP_POOL.x2} z={LAP_POOL.z1 + 2.4} turn={-Math.PI / 2} />
      <LifeguardChair />
      <Basin rect={SPLASH_POOL} depth={SPLASH_POOL.depth} colour="#5cc6e6" night={night}>
        {night ? <PoolLights rect={SPLASH_POOL} depth={SPLASH_POOL.depth} /> : null}
      </Basin>
      <Inflatables />
      <WaterSlide night={night} />
      {PALMS.map((at, i) => (
        <Palm key={`${at}`} at={at} seed={200 + i} />
      ))}
      {night ? <PoolNightLights /> : null}
    </group>
  );
}
