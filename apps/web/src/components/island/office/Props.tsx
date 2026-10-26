type V3 = [number, number, number];

export function Block({ size, at, color, rotation }: { size: V3; at: V3; color: string; rotation?: V3 }) {
  return (
    <mesh position={at} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.75} />
    </mesh>
  );
}

export function FloorLamp({ at }: { at: V3 }) {
  return (
    <group position={at}>
      <Block size={[0.3, 0.04, 0.3]} at={[0, 0.02, 0]} color="#2a2550" />
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 1.7, 8]} />
        <meshStandardMaterial color="#2a2550" />
      </mesh>
      <mesh position={[0, 1.78, 0]}>
        <coneGeometry args={[0.26, 0.3, 16, 1, true]} />
        <meshStandardMaterial color="#fff1d6" emissive="#ffd6a3" emissiveIntensity={0.9} side={2} />
      </mesh>
      <pointLight position={[0, 1.6, 0.2]} color="#ffcf8f" intensity={2.4} distance={3.2} decay={2} />
    </group>
  );
}

export function Whiteboard({ at, width = 1.6 }: { at: V3; width?: number }) {
  return (
    <group position={at}>
      <Block size={[width, 0.95, 0.04]} at={[0, 0, 0]} color="#ffffff" />
      {[0.22, 0.05, -0.12].map((y, i) => (
        <Block key={y} size={[width * (0.7 - i * 0.15), 0.035, 0.01]} at={[-width * 0.08, y, 0.03]} color={['#4285f4', '#e07a5f', '#10a37f'][i] as string} />
      ))}
      <Block size={[width * 0.25, 0.25, 0.01]} at={[width * 0.3, -0.18, 0.03]} color="#ffe08a" />
    </group>
  );
}

export function Poster({ at, color, width = 0.7 }: { at: V3; color: string; width?: number }) {
  return (
    <group position={at}>
      <Block size={[width, width * 1.3, 0.02]} at={[0, 0, 0]} color={color} />
      <mesh position={[0, width * 0.15, 0.015]}>
        <circleGeometry args={[width * 0.25, 20]} />
        <meshBasicMaterial color="#fff6e8" />
      </mesh>
    </group>
  );
}

export function WallClock({ at }: { at: V3 }) {
  return (
    <group position={at}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.05, 28]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <Block size={[0.03, 0.18, 0.01]} at={[0, 0.07, 0.03]} color="#2a2550" />
      <Block size={[0.13, 0.03, 0.01]} at={[0.05, 0, 0.03]} color="#2a2550" />
    </group>
  );
}

export function Rug({ at, size, color }: { at: V3; size: [number, number]; color: string }) {
  return (
    <mesh position={[at[0], at[1] + 0.012, at[2]]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial color={color} roughness={1} transparent opacity={0.55} />
    </mesh>
  );
}

export function Beanbag({ at, color }: { at: V3; color: string }) {
  return (
    <mesh position={[at[0], at[1] + 0.2, at[2]]} scale={[1, 0.62, 1]} castShadow>
      <sphereGeometry args={[0.36, 18, 12]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}

export { Bookshelf } from '../furniture/Bookshelf.js';
export { Plant as Pot } from '../furniture/Plant.js';
export { Sofa } from '../furniture/Sofa.js';
export { ArcadeCabinet } from '../furniture/ArcadeCabinet.js';
export { Staircase } from '../furniture/Staircase.js';
export { VendingMachine } from '../furniture/VendingMachine.js';
