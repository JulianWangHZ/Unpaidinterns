import type { ReactNode } from 'react';
import type { Amenity } from '../../lib/island/layout.js';
import type { Hex } from '../../lib/island/hex.js';
import { tileCentre } from '../../lib/island/positions.js';
import { Figure } from './Figure.js';

type V3 = [number, number, number];

function Box({ size, at, color, round }: { size: V3; at: V3; color: string; round?: boolean }) {
  return (
    <mesh position={at} castShadow receiveShadow>
      {round ? <cylinderGeometry args={[size[0], size[0], size[1], 24]} /> : <boxGeometry args={size} />}
      <meshStandardMaterial color={color} roughness={0.75} />
    </mesh>
  );
}

function CoffeeBar() {
  return (
    <>
      <Box size={[0.42, 0.42, 0]} at={[0, 0.21, 0]} color="#f3e3d3" round />
      <Box size={[0.46, 0.04, 0]} at={[0, 0.44, 0]} color="#d4a982" round />
      <Box size={[0.12, 0.16, 0.1]} at={[0.12, 0.54, -0.1]} color="#5b5f97" />
      {/* The barista NPC always works the bar, so it never looks empty. */}
      <Figure color="#8a5f38" apron position={[0, 0, -0.05]} facing={0} pose="sip" seated={false} />
    </>
  );
}

function Kitchen() {
  return (
    <>
      <Box size={[0.8, 0.4, 0.26]} at={[0, 0.2, -0.45]} color="#fff3c4" />
      <Box size={[0.24, 0.7, 0.24]} at={[0.52, 0.35, -0.4]} color="#e3ecff" />
      <Box size={[0.28, 0.04, 0]} at={[0, 0.36, 0.2]} color="#ffe8d6" round />
      <Box size={[0.04, 0.34, 0]} at={[0, 0.17, 0.2]} color="#f2c6d3" round />
    </>
  );
}

function Ktv() {
  return (
    <>
      <mesh position={[0, 0.5, -0.55]} castShadow>
        <boxGeometry args={[0.8, 0.46, 0.05]} />
        <meshStandardMaterial color="#ff8fc0" emissive="#ff8fc0" emissiveIntensity={0.45} />
      </mesh>
      <Box size={[0.7, 0.18, 0.26]} at={[0, 0.09, 0.4]} color="#e9e1ff" />
      <Box size={[0.02, 0.5, 0]} at={[0.3, 0.25, -0.1]} color="#4a4e7a" round />
    </>
  );
}

function Gym() {
  return (
    <>
      <Box size={[0.36, 0.08, 0.7]} at={[-0.2, 0.04, 0]} color="#4a4e7a" />
      <Box size={[0.3, 0.02, 0.6]} at={[-0.2, 0.09, 0]} color="#9aa0c8" />
      <Box size={[0.04, 0.45, 0.04]} at={[-0.2, 0.3, -0.33]} color="#4a4e7a" />
      {[0.15, 0.3, 0.45].map((dz) => (
        <Box key={dz} size={[0.05, 0.22, 0]} at={[0.42, 0.05, dz - 0.3]} color="#ff9f1c" round />
      ))}
    </>
  );
}

function Massage() {
  return (
    <>
      {[-0.25, 0.25].map((dx) => (
        <group key={dx} position={[dx, 0, -0.1]}>
          <Box size={[0.3, 0.2, 0.36]} at={[0, 0.1, 0]} color="#e9e1ff" />
          <Box size={[0.3, 0.38, 0.1]} at={[0, 0.3, -0.16]} color="#c9b8f5" />
        </group>
      ))}
    </>
  );
}

const BALL_COLORS = ['#ff8fab', '#ffe08a', '#8ec5ff', '#b8e0c8', '#c9b8f5'];

function BallPit() {
  const balls = Array.from({ length: 36 }, (_, i) => {
    const angle = i * 2.4;
    const radius = 0.12 + ((i * 37) % 50) / 100;
    return { at: [Math.cos(angle) * radius, 0.07 + (i % 3) * 0.05, Math.sin(angle) * radius] as V3, color: BALL_COLORS[i % 5] };
  });
  return (
    <>
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <cylinderGeometry args={[0.72, 0.72, 0.2, 6, 1, true]} />
        <meshStandardMaterial color="#ffe8d6" side={2} />
      </mesh>
      {balls.map((ball, i) => (
        <mesh key={i} position={ball.at} castShadow>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color={ball.color} roughness={0.4} />
        </mesh>
      ))}
    </>
  );
}

function PingPong() {
  return (
    <>
      <Box size={[0.5, 0.04, 0.86]} at={[0, 0.34, 0]} color="#4cc38a" />
      <Box size={[0.5, 0.08, 0.01]} at={[0, 0.4, 0]} color="#ffffff" />
      {[-0.35, 0.35].map((dz) => (
        <Box key={dz} size={[0.4, 0.32, 0.04]} at={[0, 0.16, dz]} color="#3e9b6a" />
      ))}
    </>
  );
}

function NapPods() {
  return (
    <>
      {[-0.26, 0.26].map((dx) => (
        <mesh key={dx} position={[dx, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <capsuleGeometry args={[0.17, 0.5, 6, 16]} />
          <meshStandardMaterial color="#f0f0f7" transparent opacity={0.85} roughness={0.3} />
        </mesh>
      ))}
    </>
  );
}

const PROPS: Record<Amenity, () => ReactNode> = {
  coffee: CoffeeBar,
  kitchen: Kitchen,
  ktv: Ktv,
  gym: Gym,
  massage: Massage,
  ballpit: BallPit,
  pingpong: PingPong,
  nap: NapPods,
};

export function AmenityProps({ amenity, hex }: { amenity: Amenity; hex: Hex }) {
  const Props = PROPS[amenity];
  return (
    <group position={tileCentre(hex)}>
      <Props />
    </group>
  );
}
