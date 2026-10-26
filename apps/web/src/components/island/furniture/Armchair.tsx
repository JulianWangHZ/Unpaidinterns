import { RoundedBox } from '@react-three/drei';
import { Fabric, Wood } from './materials.js';

/** A deep reading armchair: padded seat and back, rolled arms and short wooden legs. Seat top is at 0.32. */
export function Armchair({ color = '#9b8ec7' }: { color?: string }) {
  return (
    <group>
      <RoundedBox args={[0.7, 0.16, 0.62]} radius={0.05} smoothness={3} position={[0, 0.14, 0]} castShadow receiveShadow>
        <Fabric color={color} />
      </RoundedBox>
      <RoundedBox args={[0.5, 0.1, 0.48]} radius={0.04} smoothness={3} position={[0, 0.27, 0.04]} castShadow>
        <Fabric color={color} />
      </RoundedBox>
      <RoundedBox args={[0.7, 0.5, 0.14]} radius={0.06} smoothness={3} position={[0, 0.42, -0.25]} rotation={[-0.12, 0, 0]} castShadow>
        <Fabric color={color} />
      </RoundedBox>
      {[-1, 1].map((side) => (
        <RoundedBox key={side} args={[0.12, 0.32, 0.6]} radius={0.055} smoothness={3} position={[side * 0.3, 0.3, 0]} castShadow>
          <Fabric color={color} />
        </RoundedBox>
      ))}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[sx * 0.28, 0.03, sz * 0.24]}>
            <cylinderGeometry args={[0.025, 0.018, 0.06, 8]} />
            <Wood color="#6e4f37" />
          </mesh>
        )),
      )}
    </group>
  );
}

/** Two armchairs with a small side table and lamp, the place idle agents nod off. */
export function DozeCorner() {
  return (
    <group>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.45, 0, 0]}>
          <Armchair color={side < 0 ? '#9b8ec7' : '#7fb3a8'} />
        </group>
      ))}
      <group position={[0, 0, -0.2]}>
        <mesh position={[0, 0.2, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.4, 16]} />
          <Wood />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <coneGeometry args={[0.09, 0.14, 16, 1, true]} />
          <meshStandardMaterial color="#fff1d6" emissive="#ffd6a3" emissiveIntensity={0.9} side={2} />
        </mesh>
      </group>
    </group>
  );
}
