import { useMemo } from 'react';
import { ExtrudeGeometry, Shape } from 'three';
import { arcadeScreen } from './surfaces.js';

const DEPTH = 0.62;
const WIDTH = 0.66;

/** Side profile of a classic upright cabinet, drawn in the Z/Y plane. Front is +Z. */
function sideProfile(): Shape {
  const shape = new Shape();
  shape.moveTo(-DEPTH / 2, 0);
  shape.lineTo(DEPTH / 2 - 0.05, 0);
  shape.lineTo(DEPTH / 2 - 0.05, 0.82);
  shape.lineTo(DEPTH / 2 + 0.12, 0.92);
  shape.lineTo(DEPTH / 2 + 0.1, 1.0);
  shape.lineTo(DEPTH / 2 - 0.08, 1.02);
  shape.lineTo(DEPTH / 2 - 0.02, 1.52);
  shape.lineTo(DEPTH / 2 + 0.04, 1.58);
  shape.lineTo(DEPTH / 2 + 0.04, 1.78);
  shape.lineTo(-DEPTH / 2, 1.78);
  shape.closePath();
  return shape;
}

/** Upright arcade cabinet: shaped side panels with art stripes, lit marquee, angled screen, joystick, buttons and coin door. */
export function ArcadeCabinet({ color = '#6f5bd6', stripe = '#ffd23f', seed = 1 }: { color?: string; stripe?: string; seed?: number }) {
  const side = useMemo(() => new ExtrudeGeometry(sideProfile(), { depth: 0.04, bevelEnabled: false }), []);
  const screen = useMemo(() => arcadeScreen(seed), [seed]);
  const front = DEPTH / 2;
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh geometry={side} position={[s * (WIDTH / 2) - (s > 0 ? 0.04 : 0), 0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
          <mesh position={[s * (WIDTH / 2 + 0.001), 0.95, 0.05]} rotation={[0, (s * Math.PI) / 2, 0]}>
            <planeGeometry args={[0.36, 0.06]} />
            <meshStandardMaterial color={stripe} emissive={stripe} emissiveIntensity={0.25} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.89, -0.02]} castShadow>
        <boxGeometry args={[WIDTH - 0.08, 1.78, DEPTH - 0.1]} />
        <meshStandardMaterial color="#1b1735" roughness={0.6} />
      </mesh>
      {/* Marquee. */}
      <mesh position={[0, 1.68, front + 0.03]}>
        <boxGeometry args={[WIDTH - 0.08, 0.18, 0.02]} />
        <meshStandardMaterial color={stripe} emissive={stripe} emissiveIntensity={1.1} />
      </mesh>
      {/* Bezel and angled screen. */}
      <group position={[0, 1.27, front - 0.04]} rotation={[-0.22, 0, 0]}>
        <mesh>
          <boxGeometry args={[WIDTH - 0.08, 0.5, 0.02]} />
          <meshStandardMaterial color="#0d0d14" />
        </mesh>
        <mesh position={[0, 0.01, 0.012]}>
          <planeGeometry args={[0.46, 0.36]} />
          <meshBasicMaterial map={screen} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.01, 0.02]}>
          <planeGeometry args={[0.46, 0.36]} />
          <meshPhysicalMaterial color="#ffffff" transparent opacity={0.08} roughness={0} />
        </mesh>
      </group>
      {/* Control panel with joystick and six buttons. */}
      <group position={[0, 0.96, front + 0.03]} rotation={[-0.35, 0, 0]}>
        <mesh>
          <boxGeometry args={[WIDTH - 0.08, 0.02, 0.2]} />
          <meshStandardMaterial color="#2b2d3a" roughness={0.5} />
        </mesh>
        <mesh position={[-0.15, 0.04, 0]}>
          <cylinderGeometry args={[0.007, 0.007, 0.07, 8]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh position={[-0.15, 0.08, 0]}>
          <sphereGeometry args={[0.022, 14, 10]} />
          <meshStandardMaterial color="#e0473f" roughness={0.25} />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((b) => (
          <mesh key={b} position={[0.02 + (b % 3) * 0.06, 0.014, (Math.floor(b / 3) - 0.5) * 0.06]}>
            <cylinderGeometry args={[0.018, 0.018, 0.014, 14]} />
            <meshStandardMaterial color={['#3fa7ff', '#ffd23f', '#e0473f', '#4cd28a', '#ff8fbf', '#ffffff'][b]} roughness={0.25} />
          </mesh>
        ))}
      </group>
      {/* Coin door with two lit slots. */}
      <mesh position={[0, 0.42, front - 0.04]}>
        <boxGeometry args={[0.26, 0.3, 0.01]} />
        <meshStandardMaterial color="#3a3d55" metalness={0.5} roughness={0.4} />
      </mesh>
      {[-0.05, 0.05].map((x) => (
        <mesh key={x} position={[x, 0.48, front - 0.033]}>
          <boxGeometry args={[0.035, 0.05, 0.004]} />
          <meshStandardMaterial color="#ff5d6c" emissive="#ff5d6c" emissiveIntensity={1.2} />
        </mesh>
      ))}
    </group>
  );
}
