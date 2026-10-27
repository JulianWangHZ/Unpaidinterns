import type { ReactNode } from 'react';
import type { SceneDefinition, SceneId } from '../../lib/scenes/types.js';
import { OfficeDecor } from './office/OfficeDecor.js';
import { OfficeShell } from './office/OfficeShell.js';

interface EnvironmentProps {
  scene: SceneDefinition;
  seatCount: number;
  time: 'day' | 'night';
}

function deepestSeat(scene: SceneDefinition, seatCount: number): number {
  return Math.max(0, ...Array.from({ length: Math.max(1, seatCount) }, (_, i) => scene.seatAt(i, 'claude', i).position[2]));
}


function Tree({ at, scale = 1 }: { at: [number, number, number]; scale?: number }) {
  return (
    <group position={at} scale={scale}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.7, 8]} />
        <meshStandardMaterial color="#a8774a" />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow>
        <icosahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial color="#7ccf95" roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

/** The office is a cut-away tower: three floors, five rooms, seen from the open front. */
function OfficeTower({ time }: EnvironmentProps) {
  return (
    <group>
      <OfficeShell time={time} />
      <OfficeDecor />
    </group>
  );
}

function ParkGrounds({ scene, seatCount }: EnvironmentProps) {
  const reach = Math.max(10, deepestSeat(scene, seatCount) + 3);
  return (
    <group>
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <cylinderGeometry args={[reach + 2, reach + 2.2, 0.2, 48]} />
        <meshStandardMaterial color="#bfe7b0" roughness={1} />
      </mesh>
      <mesh position={[1, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[3.6, 4.6, 48]} />
        <meshStandardMaterial color="#f6e3c8" />
      </mesh>
      <group position={[1, 0, -7.5]}>
        <mesh position={[0, 3.2, 0]}>
          <torusGeometry args={[2.6, 0.08, 8, 48]} />
          <meshStandardMaterial color="#ff8fab" />
        </mesh>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 2.6, 3.2 + Math.sin(a) * 2.6, 0]} castShadow>
              <boxGeometry args={[0.4, 0.35, 0.4]} />
              <meshStandardMaterial color={['#8ec5ff', '#ffe08a', '#b8e0c8', '#c9b8f5'][i % 4]} />
            </mesh>
          );
        })}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.9, 1.6, 0]} rotation={[0, 0, side * 0.3]} castShadow>
            <boxGeometry args={[0.12, 3.4, 0.12]} />
            <meshStandardMaterial color="#9aa0c8" />
          </mesh>
        ))}
      </group>
      {[[-9, 0, -6], [9, 0, -6], [-10, 0, 4], [10, 0, 5], [8, 0, 8], [-6, 0, 9]].map((at) => (
        <Tree key={at.join()} at={at as [number, number, number]} scale={1.3} />
      ))}
    </group>
  );
}

function PoolDeck({ scene, seatCount }: EnvironmentProps) {
  const last = deepestSeat(scene, seatCount);
  const deckBack = -6;
  const deckFront = Math.max(6, last + 2.5);
  const pool = { left: -7, right: -0.2, back: -2.6, front: Math.max(2.6, last + 1) };
  const poolDepth = pool.front - pool.back;
  const poolWidth = pool.right - pool.left;
  const deck = (x1: number, x2: number, z1: number, z2: number) => (
    <mesh key={`${x1},${z1}`} position={[(x1 + x2) / 2, -0.1, (z1 + z2) / 2]} receiveShadow>
      <boxGeometry args={[x2 - x1, 0.2, z2 - z1]} />
      <meshStandardMaterial color="#fbf6ee" roughness={0.9} />
    </mesh>
  );
  return (
    <group>
      {/* Four deck slabs leave an opening for the water. */}
      {deck(-8, 8, deckBack, pool.back)}
      {deck(-8, 8, pool.front, deckFront)}
      {deck(-8, pool.left, pool.back, pool.front)}
      {deck(pool.right, 8, pool.back, pool.front)}
      <mesh position={[pool.left + poolWidth / 2, -0.7, pool.back + poolDepth / 2]}>
        <boxGeometry args={[poolWidth, 1, poolDepth]} />
        <meshStandardMaterial color="#cfeefc" roughness={0.8} />
      </mesh>
      <mesh position={[pool.left + poolWidth / 2, -0.12, pool.back + poolDepth / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[poolWidth, poolDepth]} />
        <meshStandardMaterial color="#5ec4ef" transparent opacity={0.7} roughness={0.05} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[-5.7 + i * 1.05, -0.1, pool.back + poolDepth / 2]}>
          <boxGeometry args={[0.05, 0.05, poolDepth]} />
          <meshStandardMaterial color={i % 2 ? '#ff8fab' : '#ffffff'} />
        </mesh>
      ))}
      {[[8.2, 0, -5], [-8.2, 0, -5], [8.2, 0, deckFront - 1], [-8.2, 0, deckFront - 1]].map((at) => (
        <Tree key={at.join()} at={at as [number, number, number]} scale={1.4} />
      ))}
    </group>
  );
}

const ENVIRONMENTS: Record<SceneId, (props: EnvironmentProps) => ReactNode> = {
  office: OfficeTower,
  park: ParkGrounds,
  pool: PoolDeck,
};

export function Environment(props: EnvironmentProps) {
  const Scene = ENVIRONMENTS[props.scene.id];
  return <Scene {...props} />;
}

