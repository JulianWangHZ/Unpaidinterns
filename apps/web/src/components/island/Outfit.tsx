import type { Extra, Headwear } from '../../lib/scenes/types.js';

interface HeadwearProps {
  kind: Headwear;
  color: string;
}

/** Sits on the head group, whose origin is the neck. */
export function HeadwearMesh({ kind, color }: HeadwearProps) {
  if (kind === 'cap') {
    return (
      <group position={[0, 0.17, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.135, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0, 0.13]} rotation={[0.15, 0, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.015, 20, 1, false, -Math.PI / 2, Math.PI]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      </group>
    );
  }
  if (kind === 'swimcap') {
    return (
      <mesh position={[0, 0.12, 0]} castShadow>
        <sphereGeometry args={[0.14, 20, 10, 0, Math.PI * 2, 0, Math.PI / 1.9]} />
        <meshStandardMaterial color={color} roughness={0.3} />
      </mesh>
    );
  }
  if (kind === 'mascot') {
    return (
      <group position={[0, 0.1, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.24, 24, 18]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        {[-0.15, 0.15].map((x) => (
          <mesh key={x} position={[x, 0.2, 0]} castShadow>
            <sphereGeometry args={[0.08, 16, 12]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
        ))}
        <mesh position={[0, -0.03, 0.21]}>
          <sphereGeometry args={[0.07, 16, 12]} />
          <meshStandardMaterial color="#f5e6d3" />
        </mesh>
      </group>
    );
  }
  return null;
}

/** Sits on the body group, whose origin is the floor under the character. */
export function ExtraMesh({ kind }: { kind: Extra }) {
  switch (kind) {
    case 'apron':
      return (
        <mesh position={[0, 0.3, 0.13]}>
          <boxGeometry args={[0.18, 0.2, 0.02]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      );
    case 'tie':
      return (
        <mesh position={[0, 0.42, 0.14]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.05, 0.05, 0.02]} />
          <meshStandardMaterial color="#4a4e7a" />
        </mesh>
      );
    case 'balloon':
      return (
        <group position={[0.22, 0, 0]}>
          <mesh position={[0, 0.75, 0]}>
            <cylinderGeometry args={[0.004, 0.004, 0.5, 4]} />
            <meshStandardMaterial color="#9aa0c8" />
          </mesh>
          <mesh position={[0, 1.08, 0]} castShadow>
            <sphereGeometry args={[0.12, 20, 16]} />
            <meshStandardMaterial color="#ff8fab" roughness={0.3} />
          </mesh>
        </group>
      );
    case 'clownNose':
      return (
        <mesh position={[0, 0.69, 0.13]}>
          <sphereGeometry args={[0.035, 12, 10]} />
          <meshStandardMaterial color="#ff3b3b" />
        </mesh>
      );
    case 'floatRing':
      return (
        <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.2, 0.07, 12, 24]} />
          <meshStandardMaterial color="#ff9f1c" roughness={0.4} />
        </mesh>
      );
    case 'whistle':
      return (
        <mesh position={[0, 0.44, 0.15]}>
          <boxGeometry args={[0.05, 0.03, 0.04]} />
          <meshStandardMaterial color="#ffe08a" />
        </mesh>
      );
    default:
      return null;
  }
}

/** A small brand-coloured disc floating above the head, so the agent stays recognisable in any costume. */
export function AgentBadge({ color, height }: { color: string; height: number }) {
  return (
    <mesh position={[0, height, 0]}>
      <sphereGeometry args={[0.055, 16, 12]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} />
    </mesh>
  );
}
