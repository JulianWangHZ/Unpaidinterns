import type { SessionState } from '@unpaidinterns/core';
import type { Hex } from '../../lib/island/hex.js';
import { tileCentre } from '../../lib/island/positions.js';

const SCREEN: Partial<Record<SessionState, string>> = {
  running: '#9be3c0',
  writing: '#bfe3ff',
  thinking: '#e3e6ff',
  waiting: '#ffd9a3',
  error: '#ffb4a8',
};

export function Desk({ hex, state }: { hex: Hex; state: SessionState | undefined }) {
  const [x, , z] = tileCentre(hex);
  const screen = (state && SCREEN[state]) ?? '#5b5f97';
  return (
    <group position={[x, 0, z - 0.12]}>
      <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.7, 0.05, 0.36]} />
        <meshStandardMaterial color="#ffd6e0" roughness={0.7} />
      </mesh>
      {[-0.3, 0.3].map((dx) => (
        <mesh key={dx} position={[dx, 0.17, 0]} castShadow>
          <boxGeometry args={[0.05, 0.34, 0.3]} />
          <meshStandardMaterial color="#f5b8c8" />
        </mesh>
      ))}
      <mesh position={[0, 0.55, -0.08]} castShadow>
        <boxGeometry args={[0.36, 0.24, 0.03]} />
        <meshStandardMaterial color="#4a4e7a" />
      </mesh>
      <mesh position={[0, 0.55, -0.064]}>
        <planeGeometry args={[0.31, 0.19]} />
        <meshStandardMaterial color={screen} emissive={screen} emissiveIntensity={state ? 0.55 : 0} />
      </mesh>
      <mesh position={[0, 0.16, 0.48]} castShadow>
        <boxGeometry args={[0.28, 0.06, 0.26]} />
        <meshStandardMaterial color="#8ec5ff" />
      </mesh>
    </group>
  );
}
