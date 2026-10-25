import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh, MeshBasicMaterial } from 'three';
import type { Hex } from '../../lib/island/hex.js';
import { tileCentre } from '../../lib/island/positions.js';

/** The apricot ring that pulses on a tile whose agent needs the user. Visible from the overview. */
export function PulseRing({ hex, still }: { hex: Hex; still: boolean }) {
  const mesh = useRef<Mesh>(null);
  const [x, , z] = tileCentre(hex);
  useFrame(({ clock }) => {
    if (!mesh.current || still) return;
    const phase = (clock.elapsedTime % 1.4) / 1.4;
    mesh.current.scale.setScalar(0.7 + phase * 0.5);
    (mesh.current.material as MeshBasicMaterial).opacity = 0.85 * (1 - phase);
  });
  return (
    <mesh ref={mesh} position={[x, 0.012, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.78, 0.9, 6, 1, Math.PI / 6]} />
      <meshBasicMaterial color="#ff9f1c" transparent opacity={0.85} />
    </mesh>
  );
}
