import { useMemo } from 'react';
import { AdditiveBlending, Quaternion, Vector3 } from 'three';
import type { Vec3 } from '../../../lib/scenes/types.js';
import { surfaces } from './materials.js';

const UP = new Vector3(0, 1, 0);

/** A round bar from one point to another, for frames, legs and braces. */
export function Strut({ from, to, radius = 0.06, color = '#e9ecf5', metal = true }: { from: Vec3; to: Vec3; radius?: number; color?: string; metal?: boolean }) {
  const { middle, length, rotation } = useMemo(() => {
    const a = new Vector3(...from);
    const b = new Vector3(...to);
    const direction = b.clone().sub(a);
    return {
      middle: a.clone().add(b).multiplyScalar(0.5),
      length: direction.length(),
      rotation: new Quaternion().setFromUnitVectors(UP, direction.normalize()),
    };
  }, [from, to]);
  // Steel gets a painted-metal finish with worn roughness; timber stays plain.
  const finish = metal ? surfaces.steel(color) : null;
  return (
    <mesh position={middle} quaternion={rotation} castShadow>
      <cylinderGeometry args={[radius, radius, length, 8]} />
      {finish ? (
        <meshStandardMaterial color="#ffffff" map={finish.map} roughnessMap={finish.roughnessMap} metalness={0.55} roughness={1} />
      ) : (
        <meshStandardMaterial color={color} roughness={0.8} />
      )}
    </mesh>
  );
}

/** A small round bulb: warm and glowing at night, a pale glass bead by day. */
export function Bulb({ at, night, color = '#ffd892', size = 0.06 }: { at: Vec3; night: boolean; color?: string; size?: number }) {
  return (
    <group position={at}>
      <mesh>
        <sphereGeometry args={[night ? size * 1.25 : size, 8, 6]} />
        <meshBasicMaterial color={night ? color : '#f6f1e4'} toneMapped={false} />
      </mesh>
      {/* At night each bulb gets a faint halo, so strings of them read as glowing light. */}
      {night ? (
        <mesh>
          <sphereGeometry args={[size * 3, 8, 6]} />
          <meshBasicMaterial color={color} transparent opacity={0.16} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
        </mesh>
      ) : null}
    </group>
  );
}

/** Alternating colours, for awnings, roofs and stripes. */
export const STRIPES = ['#ff5d6c', '#fff6ea'] as const;

export const CANDY = ['#ff8fab', '#8ec5ff', '#ffd25e', '#9fe0b4', '#c9a8ff', '#ffa36b'] as const;
