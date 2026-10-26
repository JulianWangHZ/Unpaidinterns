import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh, MeshBasicMaterial } from 'three';
import type { Vec3 } from '../../lib/scenes/types.js';

/** The apricot ring that pulses under an agent that needs the user. Visible from the overview. */
export function PulseRing({ position, still }: { position: Vec3; still: boolean }) {
  const mesh = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (!mesh.current || still) return;
    const phase = (clock.elapsedTime % 1.4) / 1.4;
    mesh.current.scale.setScalar(0.7 + phase * 0.6);
    (mesh.current.material as MeshBasicMaterial).opacity = 0.85 * (1 - phase);
  });
  return (
    <mesh ref={mesh} position={[position[0], position[1] + 0.02, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.42, 0.52, 40]} />
      <meshBasicMaterial color="#ff9f1c" transparent opacity={0.85} />
    </mesh>
  );
}
