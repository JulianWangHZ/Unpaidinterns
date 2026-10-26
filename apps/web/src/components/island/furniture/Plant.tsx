import { useMemo } from 'react';
import { seeded } from '../../../lib/scenes/skyline.js';

type V3 = [number, number, number];

/** Potted plant: tapered pot with a rim and soil, and a fan of long leaves arching out from the centre. */
export function Plant({ at, size = 1, seed = 1, pot = '#d98c6a' }: { at: V3; size?: number; seed?: number; pot?: string }) {
  const leaves = useMemo(() => {
    const random = seeded(seed);
    return Array.from({ length: 11 }, (_, i) => {
      const yaw = (i / 11) * Math.PI * 2 + random() * 0.4;
      const tilt = 0.35 + random() * 0.55;
      const length = 0.22 + random() * 0.14;
      const shade = ['#3f9c62', '#4fae72', '#5fbf80', '#2f8a55'][i % 4] as string;
      return { yaw, tilt, length, shade };
    });
  }, [seed]);
  return (
    <group position={at} scale={size}>
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.12, 0.3, 20]} />
        <meshStandardMaterial color={pot} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <torusGeometry args={[0.165, 0.018, 8, 24]} />
        <meshStandardMaterial color={pot} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.29, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.155, 20]} />
        <meshStandardMaterial color="#4a3324" roughness={1} />
      </mesh>
      {leaves.map((leaf, i) => (
        <group key={i} position={[0, 0.3, 0]} rotation={[0, leaf.yaw, 0]}>
          <group rotation={[leaf.tilt, 0, 0]}>
            <mesh position={[0, leaf.length / 2, 0]} scale={[0.07, leaf.length / 2, 0.018]} castShadow>
              <sphereGeometry args={[1, 12, 10]} />
              <meshStandardMaterial color={leaf.shade} roughness={0.6} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  );
}
