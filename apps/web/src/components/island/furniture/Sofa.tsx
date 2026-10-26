import { RoundedBox } from '@react-three/drei';
import { Fabric, Wood } from './materials.js';

type V3 = [number, number, number];

/** Three-seat sofa with separate cushions, rounded arms, throw pillows and a coffee table in front. */
export function Sofa({ at, color = '#5a9aa6', pillow = '#ffc26b' }: { at: V3; color?: string; pillow?: string }) {
  const seatWidth = 0.66;
  return (
    <group position={at}>
      <RoundedBox args={[2.2, 0.2, 0.8]} radius={0.06} smoothness={3} position={[0, 0.2, 0]} castShadow receiveShadow>
        <Fabric color={color} />
      </RoundedBox>
      {[-1, 0, 1].map((i) => (
        <group key={i}>
          <RoundedBox args={[seatWidth, 0.14, 0.62]} radius={0.06} smoothness={4} position={[i * (seatWidth + 0.02), 0.36, 0.06]} castShadow>
            <Fabric color={color} />
          </RoundedBox>
          <RoundedBox args={[seatWidth, 0.42, 0.18]} radius={0.07} smoothness={4} position={[i * (seatWidth + 0.02), 0.58, -0.28]} rotation={[-0.14, 0, 0]} castShadow>
            <Fabric color={color} />
          </RoundedBox>
        </group>
      ))}
      {[-1, 1].map((side) => (
        <RoundedBox key={side} args={[0.2, 0.5, 0.82]} radius={0.08} smoothness={4} position={[side * 1.1, 0.35, 0]} castShadow>
          <Fabric color={color} />
        </RoundedBox>
      ))}
      {[-1, 1].flatMap((side) =>
        [-1, 1].map((end) => (
          <mesh key={`${side}${end}`} position={[side * 1.05, 0.05, end * 0.33]}>
            <cylinderGeometry args={[0.03, 0.02, 0.1, 10]} />
            <Wood color="#6e4f37" />
          </mesh>
        )),
      )}
      {[-0.7, 0.72].map((x, i) => (
        <RoundedBox key={x} args={[0.36, 0.34, 0.12]} radius={0.06} smoothness={4} position={[x, 0.55, -0.12]} rotation={[-0.25, i ? -0.3 : 0.25, i ? -0.12 : 0.15]} castShadow>
          <Fabric color={i ? '#ff8fbf' : pillow} />
        </RoundedBox>
      ))}
      <group position={[0, 0, 1.0]}>
        <RoundedBox args={[1.1, 0.05, 0.55]} radius={0.02} smoothness={3} position={[0, 0.32, 0]} castShadow receiveShadow>
          <Wood />
        </RoundedBox>
        {[-1, 1].flatMap((side) =>
          [-1, 1].map((end) => (
            <mesh key={`${side}${end}`} position={[side * 0.48, 0.15, end * 0.22]}>
              <cylinderGeometry args={[0.022, 0.018, 0.3, 10]} />
              <Wood color="#6e4f37" />
            </mesh>
          )),
        )}
        <RoundedBox args={[0.24, 0.03, 0.17]} radius={0.004} smoothness={2} position={[-0.25, 0.36, 0]} rotation={[0, 0.3, 0]}>
          <meshStandardMaterial color="#3f6fc0" roughness={0.7} />
        </RoundedBox>
        <mesh position={[0.28, 0.39, 0.05]} castShadow>
          <cylinderGeometry args={[0.04, 0.035, 0.09, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}
