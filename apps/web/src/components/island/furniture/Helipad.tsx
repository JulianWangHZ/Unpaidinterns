import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Group, Mesh, MeshBasicMaterial } from 'three';

const PAD = 1.9;

/** Rooftop pad: dark disc, white ring, a yellow H, and edge lights that blink at night. */
function Pad({ night }: { night: boolean }) {
  const lights = useRef<Mesh[]>([]);
  useFrame(({ clock }) => {
    const on = !night || Math.sin(clock.elapsedTime * 3) > 0;
    for (const light of lights.current) (light.material as MeshBasicMaterial).color.set(on ? '#7dff9a' : '#1f4a2a');
  });
  return (
    <group>
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <cylinderGeometry args={[PAD, PAD, 0.06, 40]} />
        <meshStandardMaterial color="#3b3f52" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.062, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[PAD - 0.22, PAD - 0.1, 48]} />
        <meshBasicMaterial color="#f5f5f5" />
      </mesh>
      {/* The H: two uprights and a crossbar, laid flat. */}
      {[
        { at: [-0.42, 0], size: [0.18, 1.2] },
        { at: [0.42, 0], size: [0.18, 1.2] },
        { at: [0, 0], size: [0.66, 0.18] },
      ].map(({ at, size }) => (
        <mesh key={at.join()} position={[at[0] as number, 0.064, at[1] as number]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={size as [number, number]} />
          <meshBasicMaterial color="#ffd23f" />
        </mesh>
      ))}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <mesh
            key={i}
            ref={(node) => {
              if (node) lights.current[i] = node;
            }}
            position={[Math.cos(a) * (PAD + 0.05), 0.09, Math.sin(a) * (PAD + 0.05)]}
          >
            <sphereGeometry args={[0.045, 8, 6]} />
            <meshBasicMaterial color="#7dff9a" />
          </mesh>
        );
      })}
    </group>
  );
}

/** A light utility helicopter parked on the pad, rotor at rest and turning slowly as if just landed. */
function Helicopter({ color = '#e0473f' }: { color?: string }) {
  const rotor = useRef<Group>(null);
  const tail = useRef<Group>(null);
  useFrame((_, delta) => {
    if (rotor.current) rotor.current.rotation.y += delta * 0.6;
    if (tail.current) tail.current.rotation.x += delta * 1.5;
  });
  return (
    <group>
      {/* Skids on two cross tubes. */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[0.95 * 0, 0.08, side * 0.42]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.035, 1.6, 4, 8]} />
            <meshStandardMaterial color="#2b2d3a" metalness={0.6} roughness={0.4} />
          </mesh>
          {[-0.45, 0.45].map((x) => (
            <mesh key={x} position={[x, 0.22, side * 0.3]} rotation={[side * 0.55, 0, 0]}>
              <cylinderGeometry args={[0.025, 0.025, 0.34, 6]} />
              <meshStandardMaterial color="#2b2d3a" metalness={0.6} roughness={0.4} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Cabin: a rounded body with a big tinted canopy at the front. */}
      <mesh position={[0.1, 0.72, 0]} scale={[1.05, 0.5, 0.5]} castShadow>
        <sphereGeometry args={[0.75, 28, 20]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.2} />
      </mesh>
      <mesh position={[0.55, 0.78, 0]} scale={[0.55, 0.42, 0.44]}>
        <sphereGeometry args={[0.75, 24, 18, 0, Math.PI]} />
        <meshPhysicalMaterial color="#2a3b55" roughness={0.05} metalness={0.4} transparent opacity={0.85} />
      </mesh>
      <RoundedBox args={[0.18, 0.1, 0.55]} radius={0.03} smoothness={2} position={[-0.1, 1.08, 0]}>
        <meshStandardMaterial color="#3a3d55" />
      </RoundedBox>
      {/* Tail boom, fin and tail rotor. */}
      <mesh position={[-1.05, 0.82, 0]} rotation={[0, 0, Math.PI / 2 + 0.06]} castShadow>
        <cylinderGeometry args={[0.07, 0.14, 1.4, 12]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.2} />
      </mesh>
      <mesh position={[-1.72, 1.02, 0]} rotation={[0, 0, -0.25]} castShadow>
        <boxGeometry args={[0.28, 0.42, 0.04]} />
        <meshStandardMaterial color="#f5f5f5" roughness={0.4} />
      </mesh>
      <group ref={tail} position={[-1.72, 0.98, 0.06]}>
        {[0, Math.PI / 2].map((a) => (
          <mesh key={a} rotation={[a, 0, 0]}>
            <boxGeometry args={[0.03, 0.42, 0.04]} />
            <meshStandardMaterial color="#2b2d3a" />
          </mesh>
        ))}
      </group>
      {/* Main rotor: mast, hub and four blades. */}
      <mesh position={[-0.1, 1.2, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.16, 8]} />
        <meshStandardMaterial color="#2b2d3a" metalness={0.6} />
      </mesh>
      <group ref={rotor} position={[-0.1, 1.29, 0]}>
        <mesh>
          <cylinderGeometry args={[0.09, 0.09, 0.05, 12]} />
          <meshStandardMaterial color="#2b2d3a" metalness={0.6} />
        </mesh>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[0, (i * Math.PI) / 2, 0]} position={[0, 0, 0]}>
            <boxGeometry args={[2.3, 0.025, 0.13]} />
            <meshStandardMaterial color="#3a3d55" roughness={0.5} />
          </mesh>
        ))}
      </group>
      {/* A stripe and a navigation light on each side. */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[0.05, 0.6, side * 0.375]} scale={[1, 1, 0.02]}>
            <boxGeometry args={[1.1, 0.07, 1]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <mesh position={[-0.2, 0.55, side * 0.38]}>
            <sphereGeometry args={[0.03, 8, 6]} />
            <meshBasicMaterial color={side > 0 ? '#3dff6a' : '#ff3d4d'} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Helipad({ night }: { night: boolean }) {
  return (
    <group>
      <Pad night={night} />
      <group position={[0.1, 0.06, 0]} rotation={[0, -0.35, 0]}>
        <Helicopter />
      </group>
    </group>
  );
}
