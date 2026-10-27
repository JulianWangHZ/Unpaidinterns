import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { AdditiveBlending, type Group } from 'three';
import { FOUNTAIN, GATE, PLAZA, RIDES, STATION } from '../../../lib/scenes/park-layout.js';
import { CAROUSEL_AT } from '../../../lib/scenes/park.js';
import type { Vec3 } from '../../../lib/scenes/types.js';

interface Glow {
  at: Vec3;
  color: string;
  intensity: number;
  distance: number;
}

/** Coloured light pooling round each attraction, so the park reads as lit up rather than dark. */
const GLOWS: readonly Glow[] = [
  { at: [RIDES.ferrisWheel.at[0], 2.2, RIDES.ferrisWheel.at[2] + 1.5], color: '#ff6fae', intensity: 14, distance: 9 },
  { at: [RIDES.ferrisWheel.at[0], RIDES.ferrisWheel.height, RIDES.ferrisWheel.at[2] + 1.2], color: '#ffb36b', intensity: 10, distance: 8 },
  { at: [RIDES.dropTower.at[0] + 1.2, 3, RIDES.dropTower.at[2] + 1.2], color: '#9a7bff', intensity: 12, distance: 9 },
  { at: [(STATION.from[0] + STATION.to[0]) / 2, 2.6, STATION.from[2] + 0.6], color: '#ffcf8a', intensity: 16, distance: 9 },
  { at: [12, 3.5, -9], color: '#ff6fae', intensity: 14, distance: 10 },
  { at: [GATE.x, 3, GATE.z - 0.8], color: '#ffd68a', intensity: 10, distance: 7 },
  { at: [PLAZA.centre[0], 3.2, PLAZA.centre[2]], color: '#ffe0b0', intensity: 12, distance: 11 },
  { at: [CAROUSEL_AT[0], 0.6, CAROUSEL_AT[2] + 2.4], color: '#ffd68a', intensity: 6, distance: 5 },
  { at: [FOUNTAIN.at[0] - 3.4, 2.2, FOUNTAIN.at[2] - 2], color: '#ff9fd0', intensity: 6, distance: 6 },
];

/** A searchlight beam rising from behind the park and sweeping the sky. */
function Searchlight({ at, color, speed, phase }: { at: Vec3; color: string; speed: number; phase: number }) {
  const beam = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!beam.current) return;
    const t = clock.elapsedTime * speed + phase;
    beam.current.rotation.set(Math.sin(t) * 0.35, 0, Math.cos(t * 0.7) * 0.4);
  });
  const length = 40;
  return (
    <group position={at}>
      <mesh>
        <cylinderGeometry args={[0.35, 0.45, 0.4, 12]} />
        <meshStandardMaterial color="#2f3446" metalness={0.6} roughness={0.4} />
      </mesh>
      <group ref={beam}>
        <mesh position={[0, length / 2, 0]}>
          <coneGeometry args={[2.2, length, 20, 1, true]} />
          <meshBasicMaterial color={color} transparent opacity={0.09} depthWrite={false} blending={AdditiveBlending} side={2} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/** Extra light that only switches on at night: coloured pools at every ride, and searchlights in the sky. */
export function NightLights() {
  return (
    <group>
      <hemisphereLight args={['#c2a8ff', '#3a2f5c', 0.7]} />
      {GLOWS.map(({ at, color, intensity, distance }) => (
        <pointLight key={`${at}`} position={at} color={color} intensity={intensity} distance={distance} decay={1.5} />
      ))}
      <Searchlight at={[-11.5, 0, -13]} color="#9fd0ff" speed={0.35} phase={0} />
      <Searchlight at={[15.5, 0, -13]} color="#ffb3e6" speed={0.3} phase={2} />
    </group>
  );
}
