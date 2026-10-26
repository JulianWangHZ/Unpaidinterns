import { RoundedBox } from '@react-three/drei';
import { shade, type HairStyle, type Look } from '../../../lib/characters/look.js';
import type { Extra, Headwear } from '../../../lib/scenes/types.js';

export const HEAD = { width: 0.36, height: 0.33, depth: 0.32, centre: 0.19 } as const;
const FACE_Z = HEAD.depth / 2 + 0.002;
const TOP = HEAD.centre + HEAD.height / 2;

function Skin({ look }: { look: Look }) {
  return <meshStandardMaterial color={look.skin} roughness={0.7} />;
}

/** Eyes with a highlight, blush and a small mouth, on the front of the head. Head group origin is the neck. */
export function Face({ look }: { look: Look }) {
  return (
    <group position={[0, HEAD.centre, FACE_Z]}>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.075, 0.005, 0]}>
          <mesh>
            <boxGeometry args={[0.042, 0.062, 0.008]} />
            <meshStandardMaterial color="#2b2233" roughness={0.3} />
          </mesh>
          <mesh position={[0.009, 0.015, 0.005]}>
            <boxGeometry args={[0.013, 0.013, 0.004]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          {look.gender === 'female' ? (
            <mesh position={[side * 0.022, 0.03, 0.002]} rotation={[0, 0, side * -0.5]}>
              <boxGeometry args={[0.022, 0.009, 0.006]} />
              <meshStandardMaterial color="#2b2233" />
            </mesh>
          ) : null}
        </group>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.12, -0.045, 0]}>
          <circleGeometry args={[0.024, 16]} />
          <meshBasicMaterial color="#ff9aa8" transparent opacity={0.55} />
        </mesh>
      ))}
      <mesh position={[0, -0.065, 0]}>
        <boxGeometry args={[0.038, 0.011, 0.006]} />
        <meshStandardMaterial color={shade(look.skin, -0.45)} />
      </mesh>
      {look.glasses ? (
        <group position={[0, 0.005, 0.01]}>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * 0.075, 0, 0]}>
              <torusGeometry args={[0.042, 0.007, 6, 18]} />
              <meshStandardMaterial color="#2b2233" />
            </mesh>
          ))}
          <mesh>
            <boxGeometry args={[0.06, 0.008, 0.006]} />
            <meshStandardMaterial color="#2b2233" />
          </mesh>
        </group>
      ) : null}
    </group>
  );
}

function HairBlock({ size, at, color }: { size: [number, number, number]; at: [number, number, number]; color: string }) {
  return (
    <RoundedBox args={size} radius={Math.min(...size) * 0.35} smoothness={3} position={at} castShadow>
      <meshStandardMaterial color={color} roughness={0.8} />
    </RoundedBox>
  );
}

/** Five hair styles built from a shared cap and back piece, so every style sits on the head the same way. */
export function Hair({ style, color }: { style: HairStyle; color: string }) {
  const cap = <HairBlock size={[HEAD.width + 0.03, 0.11, HEAD.depth + 0.03]} at={[0, TOP - 0.02, 0]} color={color} />;
  const back = <HairBlock size={[HEAD.width + 0.03, 0.2, 0.07]} at={[0, TOP - 0.12, -HEAD.depth / 2 + 0.01]} color={color} />;
  const fringe = <HairBlock size={[HEAD.width - 0.04, 0.06, 0.05]} at={[0.02, TOP - 0.06, HEAD.depth / 2 - 0.005]} color={color} />;
  switch (style) {
    case 'short':
      return (
        <group>
          {cap}
          {back}
          {fringe}
        </group>
      );
    case 'bob':
      return (
        <group>
          {cap}
          {fringe}
          <HairBlock size={[HEAD.width + 0.04, 0.3, 0.08]} at={[0, TOP - 0.15, -HEAD.depth / 2 + 0.02]} color={color} />
          {[-1, 1].map((side) => (
            <HairBlock key={side} size={[0.06, 0.26, HEAD.depth - 0.04]} at={[side * (HEAD.width / 2 + 0.01), TOP - 0.15, -0.02]} color={color} />
          ))}
        </group>
      );
    case 'bun':
      return (
        <group>
          {cap}
          {back}
          {fringe}
          <mesh position={[0, TOP + 0.07, -0.07]} castShadow>
            <sphereGeometry args={[0.075, 16, 12]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
        </group>
      );
    case 'spiky':
      return (
        <group>
          {cap}
          {back}
          {[-0.12, -0.04, 0.04, 0.12].map((x, i) => (
            <mesh key={x} position={[x, TOP + 0.05, (i % 2 ? -0.05 : 0.04)]} rotation={[0, 0, x * -1.5]} castShadow>
              <coneGeometry args={[0.05, 0.12, 6]} />
              <meshStandardMaterial color={color} roughness={0.8} />
            </mesh>
          ))}
        </group>
      );
    case 'cap':
      return (
        <group>
          {back}
          <BaseballCap color="#3f6fc0" />
        </group>
      );
    case 'buzz':
      return <HairBlock size={[HEAD.width + 0.012, 0.06, HEAD.depth + 0.012]} at={[0, TOP - 0.015, 0]} color={color} />;
    case 'long':
      return (
        <group>
          {cap}
          {fringe}
          {/* Long hair falls past the shoulders at the back and frames the face at the sides. */}
          <HairBlock size={[HEAD.width + 0.02, 0.3, 0.1]} at={[0, TOP - 0.17, -HEAD.depth / 2 + 0.01]} color={color} />
          {/* Ends split into two locks so the back reads as hair, not a board. */}
          {[-1, 1].map((side) => (
            <HairBlock key={`lock${side}`} size={[0.15, 0.24, 0.09]} at={[side * 0.085, TOP - 0.4, -HEAD.depth / 2 + 0.005]} color={color} />
          ))}
          {[-1, 1].map((side) => (
            <HairBlock key={side} size={[0.06, 0.36, 0.2]} at={[side * (HEAD.width / 2 + 0.015), TOP - 0.2, -0.06]} color={color} />
          ))}
        </group>
      );
    case 'ponytail':
      return (
        <group>
          {cap}
          {back}
          {fringe}
          <mesh position={[0, TOP - 0.06, -HEAD.depth / 2 - 0.03]}>
            <sphereGeometry args={[0.04, 12, 10]} />
            <meshStandardMaterial color="#ff8fab" roughness={0.6} />
          </mesh>
          <mesh position={[0, TOP - 0.2, -HEAD.depth / 2 - 0.08]} rotation={[0.35, 0, 0]} castShadow>
            <capsuleGeometry args={[0.055, 0.2, 6, 12]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
        </group>
      );
  }
}

function BaseballCap({ color }: { color: string }) {
  return (
    <group position={[0, TOP - 0.03, 0]}>
      <mesh castShadow>
        <sphereGeometry args={[0.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.005, 0.2]} rotation={[0.08, 0, 0]}>
        <boxGeometry args={[0.26, 0.018, 0.14]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
    </group>
  );
}

/** Scene headwear that replaces the hair: work cap, swim cap or a full mascot head. */
export function HeadwearPiece({ kind, color, look }: { kind: Headwear; color: string; look: Look }) {
  if (kind === 'cap') return <BaseballCap color={color} />;
  if (kind === 'swimcap') {
    return (
      <mesh position={[0, TOP - 0.06, 0]} castShadow>
        <sphereGeometry args={[0.215, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} roughness={0.25} />
      </mesh>
    );
  }
  if (kind === 'mascot') {
    return (
      <group position={[0, HEAD.centre + 0.02, 0]}>
        <RoundedBox args={[0.5, 0.46, 0.44]} radius={0.16} smoothness={4} castShadow>
          <meshStandardMaterial color={color} roughness={0.95} />
        </RoundedBox>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.2, 0.26, 0]} castShadow>
            <sphereGeometry args={[0.085, 16, 12]} />
            <meshStandardMaterial color={color} roughness={0.95} />
          </mesh>
        ))}
        <mesh position={[0, -0.06, 0.22]}>
          <sphereGeometry args={[0.09, 16, 12]} />
          <meshStandardMaterial color="#f5e6d3" roughness={0.9} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.1, 0.05, 0.225]}>
            <sphereGeometry args={[0.025, 10, 8]} />
            <meshStandardMaterial color="#1b1b22" />
          </mesh>
        ))}
      </group>
    );
  }
  return <Hair style={look.hair} color={look.hairColor} />;
}

/** Accessories on the torso. Body group origin is the floor under the character. */
export function ExtraPiece({ kind }: { kind: Extra }) {
  switch (kind) {
    case 'apron':
      return (
        <mesh position={[0, 0.34, 0.092]}>
          <boxGeometry args={[0.2, 0.24, 0.01]} />
          <meshStandardMaterial color="#ffffff" roughness={0.8} />
        </mesh>
      );
    case 'tie':
      return (
        <group position={[0, 0.44, 0.092]}>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.035, 0.035, 0.012]} />
            <meshStandardMaterial color="#c0392b" />
          </mesh>
          <mesh position={[0, -0.08, 0]}>
            <boxGeometry args={[0.035, 0.13, 0.012]} />
            <meshStandardMaterial color="#c0392b" />
          </mesh>
        </group>
      );
    case 'balloon':
      return (
        <group position={[0.22, 0, 0]}>
          <mesh position={[0, 0.78, 0]}>
            <cylinderGeometry args={[0.004, 0.004, 0.55, 4]} />
            <meshStandardMaterial color="#9aa0c8" />
          </mesh>
          <mesh position={[0, 1.12, 0]} castShadow>
            <sphereGeometry args={[0.12, 20, 16]} />
            <meshStandardMaterial color="#ff8fab" roughness={0.3} />
          </mesh>
        </group>
      );
    case 'floatRing':
      return (
        <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.2, 0.065, 12, 24]} />
          <meshStandardMaterial color="#ff9f1c" roughness={0.4} />
        </mesh>
      );
    case 'whistle':
      return (
        <mesh position={[0, 0.45, 0.095]}>
          <boxGeometry args={[0.05, 0.03, 0.03]} />
          <meshStandardMaterial color="#ffe08a" metalness={0.4} />
        </mesh>
      );
    default:
      // The clown nose sits on the face, so the head draws it (see ClownNose).
      return null;
  }
}

export function ClownNose() {
  return (
    <mesh position={[0, HEAD.centre - 0.03, FACE_Z + 0.02]}>
      <sphereGeometry args={[0.035, 14, 10]} />
      <meshStandardMaterial color="#ff3b3b" roughness={0.3} />
    </mesh>
  );
}

export { Skin };
