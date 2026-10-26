import { useMemo } from 'react';
import { woodGrain } from './surfaces.js';

type V3 = [number, number, number];

/** Straight-run stair: steel stringers, wood treads with nosing and risers, glass balustrade and a handrail. */
export function Staircase({ from, to, steps = 14, width = 0.95 }: { from: V3; to: V3; steps?: number; width?: number }) {
  const wood = useMemo(() => woodGrain(), []);
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const run = dx / steps;
  const rise = dy / steps;
  const length = Math.hypot(dx, dy);
  const pitch = Math.atan2(dy, dx);
  const half = width / 2;
  return (
    <group position={from}>
      {Array.from({ length: steps }, (_, i) => (
        <group key={i} position={[run * (i + 0.5), rise * (i + 1), 0]}>
          <mesh position={[0, -0.025, 0]} castShadow receiveShadow>
            <boxGeometry args={[Math.abs(run) + 0.04, 0.05, width - 0.04]} />
            <meshStandardMaterial map={wood} color="#d9b383" roughness={0.55} />
          </mesh>
          <mesh position={[-run / 2 + 0.006, -rise / 2, 0]}>
            <boxGeometry args={[0.012, rise - 0.05, width - 0.06]} />
            <meshStandardMaterial color="#efe3d3" roughness={0.8} />
          </mesh>
        </group>
      ))}
      {/* Steel stringers on both sides. */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[dx / 2, dy / 2 - 0.06, side * half]} rotation={[0, 0, pitch]} castShadow>
          <boxGeometry args={[length + 0.1, 0.16, 0.035]} />
          <meshStandardMaterial color="#2b2d3a" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      {/* Glass balustrade on the open side, held by posts, capped with a handrail. */}
      <mesh position={[dx / 2, dy / 2 + 0.48, half + 0.02]} rotation={[0, 0, pitch]}>
        <boxGeometry args={[length, 0.85, 0.012]} />
        <meshPhysicalMaterial color="#dff2ff" transparent opacity={0.22} roughness={0.05} />
      </mesh>
      {[0.15, 0.5, 0.85].map((t) => (
        <mesh key={t} position={[dx * t, dy * t + 0.45, half + 0.035]}>
          <cylinderGeometry args={[0.015, 0.015, 0.9, 10]} />
          <meshStandardMaterial color="#c6cacd" metalness={0.85} roughness={0.25} />
        </mesh>
      ))}
      <mesh position={[dx / 2, dy / 2 + 0.92, half + 0.035]} rotation={[0, 0, pitch + Math.PI / 2]}>
        <cylinderGeometry args={[0.022, 0.022, length + 0.1, 12]} />
        <meshStandardMaterial map={wood} color="#9a6a42" roughness={0.4} />
      </mesh>
      {/* Wall-side handrail on brackets. */}
      <mesh position={[dx / 2, dy / 2 + 0.85, -half + 0.04]} rotation={[0, 0, pitch + Math.PI / 2]}>
        <cylinderGeometry args={[0.016, 0.016, length, 10]} />
        <meshStandardMaterial color="#c6cacd" metalness={0.85} roughness={0.25} />
      </mesh>
    </group>
  );
}
