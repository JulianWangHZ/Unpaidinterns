import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import { waterNormals } from '../park/materials.js';

/**
 * A rectangle of water: a clear tinted surface with ripples drifting across it. Lying at `y`, so
 * whatever is below shows through.
 */
export function WaterSurface({ x, z, width, depth, y, night, tint = '#4fc3ea' }: { x: number; z: number; width: number; depth: number; y: number; night: boolean; tint?: string }) {
  const normals = useMemo(() => waterNormals(width / 2.5, depth / 2.5), [width, depth]);
  const second = useMemo(() => waterNormals(width / 1.6, depth / 1.6), [width, depth]);
  useFrame((_, delta) => {
    normals.offset.x += delta * 0.03;
    normals.offset.y += delta * 0.018;
    second.offset.x -= delta * 0.02;
  });
  return (
    <group position={[x, y, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshPhysicalMaterial
          color={night ? '#2a8fc4' : tint}
          transparent
          opacity={night ? 0.55 : 0.5}
          roughness={0.06}
          metalness={0.1}
          normalMap={normals}
          normalScale={[0.6, 0.6]}
          clearcoat={1}
          clearcoatNormalMap={second}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
