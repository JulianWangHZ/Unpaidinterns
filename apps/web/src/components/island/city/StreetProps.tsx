import { useMemo } from 'react';
import { seeded } from '../../../lib/scenes/skyline.js';
import { LEVEL } from '../../../lib/scenes/street.js';

const TREE_GREENS = ['#4f9a5a', '#5aa865', '#468d52'];

/** Round, low-poly street tree in a square pit, with a slightly different crown each time. */
export function Tree({ x, z, seed }: { x: number; z: number; seed: number }) {
  const blobs = useMemo(() => {
    const random = seeded(seed);
    return Array.from({ length: 4 }, (_, i) => ({
      at: [(random() - 0.5) * 0.9, 2.3 + (i === 0 ? 0.5 : random() * 0.6), (random() - 0.5) * 0.9] as [number, number, number],
      size: 0.7 + random() * 0.35,
      color: TREE_GREENS[i % TREE_GREENS.length] as string,
    }));
  }, [seed]);
  return (
    <group position={[x, LEVEL.walk, z]}>
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.1, 1.1]} />
        <meshStandardMaterial color="#5b4a3a" roughness={1} />
      </mesh>
      <mesh position={[0, 1, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.13, 2, 8]} />
        <meshStandardMaterial color="#6e5440" roughness={0.9} />
      </mesh>
      {blobs.map(({ at, size, color }, i) => (
        <mesh key={i} position={at} scale={size} castShadow>
          <icosahedronGeometry args={[1, 1]} />
          <meshStandardMaterial color={color} roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  );
}

const LAMP_HEIGHT = 4.6;
const ARM = 1.3;

/** Street lamp whose arm reaches over the road; lit with a pool of light on the ground at night. */
export function StreetLamp({ x, z, facing, night }: { x: number; z: number; facing: 1 | -1; night: boolean }) {
  return (
    <group position={[x, LEVEL.walk, z]}>
      <mesh position={[0, LAMP_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[0.06, 0.08, LAMP_HEIGHT, 8]} />
        <meshStandardMaterial color="#3d4250" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, LAMP_HEIGHT - 0.05, (facing * ARM) / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, ARM, 6]} />
        <meshStandardMaterial color="#3d4250" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, LAMP_HEIGHT - 0.12, facing * ARM]}>
        <boxGeometry args={[0.28, 0.1, 0.5]} />
        <meshStandardMaterial color="#3d4250" />
      </mesh>
      <mesh position={[0, LAMP_HEIGHT - 0.18, facing * ARM]}>
        <boxGeometry args={[0.22, 0.02, 0.42]} />
        <meshBasicMaterial color={night ? '#ffe2a8' : '#d9dde6'} toneMapped={false} />
      </mesh>
      {night ? (
        <mesh position={[0, LEVEL.road - LEVEL.walk + 0.02, facing * (ARM + 0.2)]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.2, 28]} />
          <meshBasicMaterial color="#ffd38a" transparent opacity={0.16} depthWrite={false} toneMapped={false} />
        </mesh>
      ) : null}
    </group>
  );
}

/** Low planter box with a clipped hedge, for the pavement right in front of the office. */
export function Planter({ x, z, width }: { x: number; z: number; width: number }) {
  return (
    <group position={[x, LEVEL.walk, z]}>
      <mesh position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[width, 0.36, 0.55]} />
        <meshStandardMaterial color="#8d8f99" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[width - 0.12, 0.2, 0.42]} />
        <meshStandardMaterial color="#4f9a5a" roughness={1} flatShading />
      </mesh>
    </group>
  );
}
