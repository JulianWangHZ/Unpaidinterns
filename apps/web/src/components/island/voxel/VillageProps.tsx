import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group } from 'three';
import type { Tile } from '../../../lib/scenes/voxel/blocks.js';
import { BLOCK, benchSpot, FARM, HUT, LAMPS, WELL } from '../../../lib/scenes/voxel/layout.js';
import { BED_HEIGHT, BED_SPACING, BENCH_HEIGHT, voxel } from '../../../lib/scenes/voxel.js';
import type { Spot, Vec3 } from '../../../lib/scenes/types.js';
import { blockFaces } from './materials.js';

interface CubeProps {
  /** Centre of the bottom face. */
  at: Vec3;
  size?: Vec3;
  top: Tile;
  side?: Tile;
  bottom?: Tile;
  front?: Tile;
  turn?: number;
  glow?: boolean;
}

/** A box dressed as a block. Most props are a few of these stacked together. */
function Cube({ at: [x, y, z], size = [BLOCK, BLOCK, BLOCK], top, side, bottom, front, turn = 0, glow = false }: CubeProps) {
  return (
    <mesh position={[x, y + size[1] / 2, z]} rotation={[0, turn, 0]} material={blockFaces(top, side, bottom, front, glow)} castShadow receiveShadow>
      <boxGeometry args={size} />
    </mesh>
  );
}

/** A thin upright log, for fence posts, lamp posts and roof supports. */
function Post({ at, height, thick = 0.12 }: { at: Vec3; height: number; thick?: number }) {
  return <Cube at={at} size={[thick, height, thick]} top="oakLogTop" side="oakLog" />;
}

/** The workbench a working agent stands at. */
export function CraftingTable({ spot }: { spot: Spot }) {
  const [x, y, z] = spot.position;
  const ahead = 0.5;
  return <Cube at={[x + Math.sin(spot.facing) * ahead, y, z + Math.cos(spot.facing) * ahead]} top="craftingTop" side="craftingSide" bottom="planks" turn={spot.facing} />;
}

/** Flames that never hold still, scaled with a few out-of-step sine waves. */
function Flames() {
  const group = useRef<Group>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    group.current?.children.forEach((flame, i) => {
      flame.scale.y = 0.75 + Math.sin(t * (7 + i * 2.3) + i) * 0.2 + Math.sin(t * 13 + i * 4) * 0.08;
    });
  });
  return (
    <group ref={group} position={[0, 0.2, 0]}>
      {[
        { at: [0, 0, 0], size: 0.22, color: '#ff7a1c' },
        { at: [0.07, 0, 0.05], size: 0.14, color: '#ffc23a' },
        { at: [-0.06, 0, -0.04], size: 0.12, color: '#ffe680' },
      ].map(({ at, size, color }, i) => (
        <mesh key={i} position={at as Vec3}>
          <boxGeometry args={[size, size * 2, size]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Campfire({ night }: { night: boolean }) {
  return (
    <group>
      {[-0.12, 0.12].map((dz) => (
        <Cube key={`x${dz}`} at={[0, 0, dz]} size={[0.7, 0.12, 0.12]} top="oakLog" side="oakLog" />
      ))}
      {[-0.12, 0.12].map((dx) => (
        <Cube key={`z${dx}`} at={[dx, 0.12, 0]} size={[0.12, 0.12, 0.7]} top="oakLog" side="oakLog" />
      ))}
      <Flames />
      <pointLight position={[0, 0.6, 0]} color="#ff9a3c" intensity={night ? 6 : 1.2} distance={night ? 7 : 3} decay={1.5} />
    </group>
  );
}

function Kitchen() {
  return (
    <group>
      <Cube at={[-0.25, 0, 0]} top="furnaceSide" side="furnaceSide" front="furnaceFront" />
      <Cube at={[0.25, 0, 0]} top="furnaceSide" side="furnaceSide" front="furnaceFront" />
      <Cube at={[0.8, 0, 0]} top="craftingTop" side="craftingSide" bottom="planks" />
      <Cube at={[-0.8, 0, 0]} size={[0.44, 0.44, 0.44]} top="planks" side="oakLog" />
    </group>
  );
}

/** Notes float up off the jukebox and fade back in, one after another. */
function Notes() {
  const group = useRef<Group>(null);
  useFrame(({ clock }) => {
    group.current?.children.forEach((note, i) => {
      const t = (clock.elapsedTime * 0.5 + i / 3) % 1;
      note.position.set(Math.sin(t * 6 + i) * 0.25, 0.7 + t * 1.1, 0);
      note.scale.setScalar(Math.sin(t * Math.PI));
    });
  });
  return (
    <group ref={group}>
      {['#5ad16a', '#f2c14e', '#7aa8ff'].map((color) => (
        <mesh key={color}>
          <boxGeometry args={[0.1, 0.16, 0.04]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Jukebox() {
  return (
    <group>
      <Cube at={[0, 0, 0]} top="jukeboxTop" side="jukeboxSide" />
      {[-0.65, 0.65].map((dx) => (
        <Cube key={dx} at={[dx, 0, -0.1]} size={[0.4, 0.4, 0.4]} top="jukeboxSide" side="jukeboxSide" />
      ))}
      <Notes />
    </group>
  );
}

/** Straw dummies on posts, with pumpkin heads, for sparring practice. */
function TrainingYard() {
  return (
    <group>
      {[-0.45, 0.45].map((dx) => (
        <group key={dx} position={[dx, 0, 0]}>
          <Post at={[0, 0, 0]} height={0.6} />
          <Cube at={[0, 0.5, 0]} size={[0.36, 0.4, 0.24]} top="hayTop" side="haySide" />
          <Cube at={[0, 0.9, 0]} size={[0.26, 0.26, 0.26]} top="pumpkin" side="pumpkin" />
        </group>
      ))}
    </group>
  );
}

function HayBales() {
  return (
    <group>
      <Cube at={[-0.26, 0, 0]} top="hayTop" side="haySide" />
      <Cube at={[0.26, 0, 0.04]} top="hayTop" side="haySide" turn={0.1} />
      <Cube at={[0, 0, -0.5]} top="hayTop" side="haySide" turn={-0.08} />
      <Cube at={[-0.05, 0.5, -0.25]} top="hayTop" side="haySide" turn={0.3} />
    </group>
  );
}

const FENCE = { post: 0.125, height: 0.5, rails: [0.19, 0.38], rail: 0.06 } as const;

/** A run of fence between two points on the ground: posts at every block, two rails between them. */
function Fence({ from, to }: { from: Vec3; to: Vec3 }) {
  const length = Math.hypot(to[0] - from[0], to[2] - from[2]);
  const count = Math.max(1, Math.round(length / BLOCK));
  const turn = Math.atan2(to[0] - from[0], to[2] - from[2]);
  const mid: Vec3 = [(from[0] + to[0]) / 2, 0, (from[2] + to[2]) / 2];
  return (
    <group>
      {Array.from({ length: count + 1 }, (_, i) => {
        const t = i / count;
        return <Post key={i} at={[from[0] + (to[0] - from[0]) * t, 0, from[2] + (to[2] - from[2]) * t]} height={FENCE.height} thick={FENCE.post} />;
      })}
      {FENCE.rails.map((y) => (
        <Cube key={y} at={[mid[0], y, mid[2]]} size={[FENCE.rail / 2, FENCE.rail * 1.5, length]} top="planks" side="planks" turn={turn} />
      ))}
    </group>
  );
}

/** Fence round the farm field, open at the front for a gate, with a scarecrow in the middle. */
function Farm() {
  const [cx, , cz] = voxel.activities.ballpit;
  const x1 = FARM.x1 - cx - 0.2;
  const x2 = FARM.x2 - cx + 0.2;
  const z1 = FARM.z1 - cz - 0.2;
  const z2 = FARM.z2 - cz + 0.2;
  const gate = (x1 + x2) / 2;
  return (
    <group>
      <Fence from={[x1, 0, z1]} to={[x2, 0, z1]} />
      <Fence from={[x1, 0, z1]} to={[x1, 0, z2]} />
      <Fence from={[x2, 0, z1]} to={[x2, 0, z2]} />
      <Fence from={[x1, 0, z2]} to={[gate - 0.5, 0, z2]} />
      <Fence from={[gate + 0.5, 0, z2]} to={[x2, 0, z2]} />
      <group position={[1.6, 0, 0.7]}>
        <Post at={[0, 0, 0]} height={1.1} />
        <Cube at={[0, 0.7, 0]} size={[0.7, 0.08, 0.08]} top="oakLog" side="oakLog" />
        <Cube at={[0, 1.05, 0]} size={[0.28, 0.28, 0.28]} top="pumpkin" side="pumpkin" />
      </group>
    </group>
  );
}

/** Cobbled well under a little roof, ringed by benches. */
function Well() {
  const ring: Vec3[] = [];
  for (const dx of [-1, 0, 1]) for (const dz of [-1, 0, 1]) if (dx || dz) ring.push([dx * BLOCK, 0, dz * BLOCK]);
  return (
    <group>
      {ring.map((at) => (
        <Cube key={`${at}`} at={at} top="cobble" side="cobble" />
      ))}
      <mesh position={[0, 0.38, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[BLOCK, BLOCK]} />
        <meshLambertMaterial color="#3f74d8" />
      </mesh>
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Post key={`${sx}${sz}`} at={[sx * 0.65, 0.5, sz * 0.65]} height={1.0} />))}
      <Cube at={[0, 1.5, 0]} size={[1.8, 0.2, 1.8]} top="planks" side="planks" />
      {Array.from({ length: WELL.benches }, (_, i) => {
        const { position, facing } = benchSpot(i);
        const [x, , z] = position;
        return <Cube key={i} at={[x, 0, z]} size={[0.8, BENCH_HEIGHT, 0.4]} top="planks" side="planks" turn={facing} />;
      })}
    </group>
  );
}

/** An open-fronted hut with a row of beds. */
function Hut() {
  const width = HUT.beds * BED_SPACING + 0.6;
  return (
    <group>
      {Array.from({ length: HUT.beds }, (_, i) => (
        <group key={i} position={[(i - (HUT.beds - 1) / 2) * BED_SPACING, 0, 0]}>
          <Cube at={[0, 0, 0]} size={[0.6, BED_HEIGHT, 1.1]} top="woolRed" side="woolRed" bottom="planks" />
          <Cube at={[0, BED_HEIGHT, -0.38]} size={[0.56, 0.08, 0.3]} top="woolWhite" side="woolWhite" />
        </group>
      ))}
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Post key={`${sx}${sz}`} at={[(sx * width) / 2, 0, sz * 0.9]} height={1.9} thick={0.2} />))}
      <Cube at={[0, 0, -0.95]} size={[width, 1.9, 0.12]} top="planks" side="planks" />
      {/* A stepped roof, each course of planks a block narrower than the one below. */}
      {[0, 1, 2].map((step) => (
        <Cube key={step} at={[0, 1.9 + step * 0.25, -0.1]} size={[width + 0.5 - step * 1.0, 0.25, 2.4]} top="sprucePlanks" side="sprucePlanks" />
      ))}
    </group>
  );
}

export const VILLAGE_PROPS = {
  coffee: Campfire,
  kitchen: Kitchen,
  ktv: Jukebox,
  gym: TrainingYard,
  massage: HayBales,
  ballpit: Farm,
  // The dock is built into the world itself; anglers need nothing more.
  pingpong: () => null,
  sofa: Well,
  nap: Hut,
} as const;


/** Lamp posts along the paths; they light up after dark. */
export function VillageLights({ night }: { night: boolean }) {
  return (
    <group>
      {LAMPS.map((at) => (
        <group key={`${at}`} position={at}>
          <Cube at={[0, 0, 0]} top="cobble" side="cobble" />
          <Post at={[0, BLOCK, 0]} height={1.0} thick={FENCE.post} />
          <Cube at={[0, 1.5, 0]} size={[0.32, 0.32, 0.32]} top="lamp" side="lamp" glow={night} />
          {night ? <pointLight position={[0, 1.6, 0]} color="#ffcf7a" intensity={4} distance={6} decay={1.5} /> : null}
        </group>
      ))}
    </group>
  );
}
