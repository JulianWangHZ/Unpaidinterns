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

/** Ride ticket booth: staff stand behind the counter, facing the visitors. */
export function Booth({ spot }: { spot: Spot }) {
  const [x, , z] = spot.position;
  const ahead = 0.5;
  return (
    <group position={[x + Math.sin(spot.facing) * ahead, 0, z + Math.cos(spot.facing) * ahead]} rotation={[0, spot.facing, 0]}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.8, 0.5, 0.2]} />
        <meshStandardMaterial color="#fff3c4" />
      </mesh>
      <mesh position={[0, 0.52, 0]}>
        <boxGeometry args={[0.86, 0.05, 0.26]} />
        <meshStandardMaterial color="#ff8fab" />
      </mesh>
    </group>
  );
}
