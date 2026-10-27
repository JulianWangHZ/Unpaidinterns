import type { SessionState } from '@unpaidinterns/core';
import type { Spot } from '../../lib/scenes/types.js';
import { Workstation } from './furniture/Workstation.js';

const SCREEN: Partial<Record<SessionState, string>> = {
  running: '#9be3c0',
  writing: '#bfe3ff',
  thinking: '#e3e6ff',
  waiting: '#ffd9a3',
  error: '#ffb4a8',
};

/** One workstation placed at a seat. The status light and screen take the agent's state colour. */
export function Desk({ spot, state }: { spot: Spot; state: SessionState | undefined }) {
  const [x, y, z] = spot.position;
  const tint = (state && SCREEN[state]) ?? null;
  const seed = Math.round(x * 31 + z * 17 + y * 7);
  return (
    <group position={[x, y, z]} rotation={[0, spot.facing, 0]}>
      <Workstation tint={tint} seed={seed} statusColor={tint ?? '#4a4677'} />
    </group>
  );
}

/** Ride ticket booth: staff stand behind the counter, facing the visitors, under a striped awning. */
export function Booth({ spot }: { spot: Spot }) {
  const [x, , z] = spot.position;
  const ahead = 0.5;
  return (
    <group position={[x + Math.sin(spot.facing) * ahead, 0, z + Math.cos(spot.facing) * ahead]} rotation={[0, spot.facing, 0]}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.9, 0.6, 0.22]} />
        <meshStandardMaterial color="#fff3dc" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.3, 0.115]}>
        <boxGeometry args={[0.7, 0.14, 0.01]} />
        <meshStandardMaterial color="#ff5d6c" />
      </mesh>
      <mesh position={[0, 0.62, 0.02]}>
        <boxGeometry args={[0.98, 0.05, 0.32]} />
        <meshStandardMaterial color="#c99d76" roughness={0.7} />
      </mesh>
      {[-0.45, 0.45].map((post) => (
        <mesh key={post} position={[post, 0.95, -0.08]}>
          <cylinderGeometry args={[0.025, 0.025, 1.3, 6]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
      <group position={[0, 1.6, 0.05]} rotation={[0.3, 0, 0]}>
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} position={[-0.5 + (i + 0.5) * (1 / 6), 0, 0]} castShadow>
            <boxGeometry args={[1 / 6, 0.03, 0.55]} />
            <meshStandardMaterial color={i % 2 ? '#fff6ea' : '#ff5d6c'} roughness={0.7} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
