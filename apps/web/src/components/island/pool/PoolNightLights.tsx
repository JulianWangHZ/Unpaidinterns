import { useMemo } from 'react';
import { AdditiveBlending } from 'three';
import { BAR, CABANA, DECK, HOT_TUB, LOUNGERS, PALMS, SLIDE } from '../../../lib/scenes/pool-layout.js';
import type { Vec3 } from '../../../lib/scenes/types.js';
import { Festoon } from '../park/Amenities.js';

/** Coloured light over each corner of the deck where people gather. */
const FILLS: ReadonlyArray<{ at: Vec3; color: string; intensity: number; distance: number }> = [
  { at: [LOUNGERS.at[0], 2.4, LOUNGERS.at[2] - 0.6], color: '#ffc98a', intensity: 10, distance: 8 },
  { at: [CABANA.at[0], 2.2, CABANA.at[2] + 1.2], color: '#ffd9a0', intensity: 8, distance: 6 },
  { at: [BAR.at[0], 2.6, BAR.at[2] + 1.6], color: '#ffb36b', intensity: 10, distance: 7 },
  { at: [HOT_TUB.at[0], 2.0, HOT_TUB.at[2] + 1.0], color: '#9a7bff', intensity: 8, distance: 6 },
  { at: [SLIDE.tower[0] - 1.0, 3.0, SLIDE.tower[2] + 1.0], color: '#4fd8ff', intensity: 10, distance: 8 },
  { at: [3.4, 2.4, -0.4], color: '#ff6fae', intensity: 9, distance: 7 },
  { at: [-3.0, 3.2, 0.6], color: '#ffe0b0', intensity: 12, distance: 12 },
];

/** Bollard lights evenly round the outside of the deck. */
function bollards(): Vec3[] {
  const inset = 0.35;
  const spots: Vec3[] = [];
  for (let x = DECK.x1 + 1.5; x < DECK.x2 - 1; x += 3.2) spots.push([x, 0, DECK.z2 - inset], [x, 0, DECK.z1 + inset]);
  for (let z = DECK.z1 + 2.5; z < DECK.z2 - 2; z += 3.2) spots.push([DECK.x1 + inset, 0, z], [DECK.x2 - inset, 0, z]);
  return spots;
}

function Bollard({ at }: { at: Vec3 }) {
  return (
    <group position={at}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.6, 10]} />
        <meshStandardMaterial color="#2f3446" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.072, 0.072, 0.1, 10]} />
        <meshBasicMaterial color="#ffe2a8" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.9, 20]} />
        <meshBasicMaterial color="#ffd38a" transparent opacity={0.2} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** A warm up-light at the foot of a palm, washing its trunk and fronds. */
function PalmUplight({ at }: { at: Vec3 }) {
  return (
    <group position={at}>
      <mesh position={[0.3, 0.02, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.6, 16]} />
        <meshBasicMaterial color="#9fe8ff" transparent opacity={0.25} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[0, 2.4, 0]}>
        <cylinderGeometry args={[0.35, 0.2, 4.6, 12, 1, true]} />
        <meshBasicMaterial color="#9fe8ff" transparent opacity={0.06} depthWrite={false} blending={AdditiveBlending} side={2} toneMapped={false} />
      </mesh>
      <pointLight position={[0.2, 3.2, 0.2]} color="#9fe8ff" intensity={4} distance={4.5} decay={1.5} />
    </group>
  );
}

/** Night lighting for the pool club: bollards, palm up-lights, festoons over the deck and coloured fill. */
export function PoolNightLights() {
  const posts = useMemo(() => bollards(), []);
  return (
    <group>
      <hemisphereLight args={['#c2a8ff', '#2f3a5c', 0.8]} />
      {FILLS.map(({ at, color, intensity, distance }) => (
        <pointLight key={`${at}`} position={at} color={color} intensity={intensity} distance={distance} decay={1.5} />
      ))}
      {posts.map((at) => (
        <Bollard key={`${at}`} at={at} />
      ))}
      {PALMS.map((at) => (
        <PalmUplight key={`${at}`} at={at} />
      ))}
      {/* String lights from palm to palm across the deck. */}
      <Festoon from={[-9.0, 3.6, 7.3]} to={[-0.2, 3.6, 7.4]} night sag={0.7} />
      <Festoon from={[-0.2, 3.6, 7.4]} to={[10.4, 3.6, 7.3]} night sag={0.8} />
      <Festoon from={[-9.1, 3.6, 1.4]} to={[-4.4, 3.6, -7.0]} night sag={0.7} />
      <Festoon from={[4.0, 3.6, -7.0]} to={[10.5, 3.6, -7.0]} night sag={0.6} />
    </group>
  );
}
