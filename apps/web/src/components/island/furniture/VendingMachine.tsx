import { RoundedBox } from '@react-three/drei';
import { useMemo } from 'react';
import { seeded } from '../../../lib/scenes/skyline.js';
import { brushedMetal } from './surfaces.js';

const WIDTH = 0.9;
const HEIGHT = 1.85;
const DEPTH = 0.62;
const WINDOW = { x: -0.1, y: 1.08, w: 0.6, h: 1.12 };
const SHELVES = 5;
const RECESS = 0.16;
const BOTTOM = 0.06;
const WINDOW_LEFT = WINDOW.x - WINDOW.w / 2;
const WINDOW_RIGHT = WINDOW.x + WINDOW.w / 2;
const WINDOW_TOP = WINDOW.y + WINDOW.h / 2;
const WINDOW_BOTTOM = WINDOW.y - WINDOW.h / 2;
const FRAME = [
  { key: 'top', x: 0, y: (WINDOW_TOP + BOTTOM + HEIGHT) / 2, w: WIDTH, h: BOTTOM + HEIGHT - WINDOW_TOP },
  { key: 'bottom', x: 0, y: (BOTTOM + WINDOW_BOTTOM) / 2, w: WIDTH, h: WINDOW_BOTTOM - BOTTOM },
  { key: 'left', x: (-WIDTH / 2 + WINDOW_LEFT) / 2, y: WINDOW.y, w: WINDOW_LEFT + WIDTH / 2, h: WINDOW.h },
  { key: 'right', x: (WINDOW_RIGHT + WIDTH / 2) / 2, y: WINDOW.y, w: WIDTH / 2 - WINDOW_RIGHT, h: WINDOW.h },
];
const DRINKS = ['#e0473f', '#ffd23f', '#3fa7ff', '#4cd28a', '#ff8fbf', '#f5f5f5', '#9b59b6'];

/** Drinks vending machine: dark lit interior behind glass, five stocked shelves, keypad and pickup flap. */
export function VendingMachine({ accent = '#c0392b' }: { accent?: string }) {
  const metal = useMemo(() => brushedMetal(), []);
  const stock = useMemo(() => {
    const random = seeded(31);
    return Array.from({ length: SHELVES }, (_, shelf) =>
      Array.from({ length: 5 }, (_, slot) => ({
        bottle: (shelf + slot) % 3 === 0,
        color: DRINKS[Math.floor(random() * DRINKS.length)] as string,
        x: WINDOW.x - WINDOW.w / 2 + 0.07 + slot * 0.115,
        y: WINDOW.y - WINDOW.h / 2 + 0.06 + shelf * (WINDOW.h / SHELVES),
      })),
    ).flat();
  }, []);
  const front = DEPTH / 2;

  return (
    <group>
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[WIDTH + 0.02, 0.06, DEPTH + 0.02]} />
        <meshStandardMaterial color="#2b2d3a" roughness={0.8} />
      </mesh>
      {/* The cabinet is a shell: a solid back half plus a frame around a recessed window, so the stock shows through. */}
      <RoundedBox args={[WIDTH, HEIGHT, DEPTH - RECESS]} radius={0.03} smoothness={3} position={[0, 0.06 + HEIGHT / 2, -RECESS / 2]} castShadow receiveShadow>
        <meshStandardMaterial color={accent} roughness={0.4} metalness={0.15} />
      </RoundedBox>
      {FRAME.map((piece) => (
        <mesh key={piece.key} position={[piece.x, piece.y, front - RECESS / 2]} castShadow>
          <boxGeometry args={[piece.w, piece.h, RECESS]} />
          <meshStandardMaterial color={accent} roughness={0.4} metalness={0.15} />
        </mesh>
      ))}
      {/* Lit brand header. */}
      <mesh position={[0, HEIGHT - 0.06, front + 0.002]}>
        <planeGeometry args={[WIDTH - 0.1, 0.16]} />
        <meshStandardMaterial color="#ffffff" emissive="#fff3dc" emissiveIntensity={0.9} />
      </mesh>
      {/* Dark interior behind the glass. */}
      <mesh position={[WINDOW.x, WINDOW.y, front - RECESS + 0.005]}>
        <planeGeometry args={[WINDOW.w, WINDOW.h]} />
        <meshStandardMaterial color="#141a2e" emissive="#1c2a44" emissiveIntensity={0.5} />
      </mesh>
      {Array.from({ length: SHELVES }, (_, shelf) => (
        <group key={shelf} position={[WINDOW.x, WINDOW.y - WINDOW.h / 2 + 0.035 + shelf * (WINDOW.h / SHELVES), front - 0.06]}>
          <mesh>
            <boxGeometry args={[WINDOW.w, 0.012, 0.12]} />
            <meshStandardMaterial color="#c6cacd" map={metal.map} metalness={0.7} roughness={0.4} />
          </mesh>
          {/* Strip light under each shelf so the products glow. */}
          <mesh position={[0, 0.2, -0.05]}>
            <planeGeometry args={[WINDOW.w - 0.04, 0.02]} />
            <meshStandardMaterial color="#fff6e0" emissive="#ffe8b8" emissiveIntensity={1.4} />
          </mesh>
        </group>
      ))}
      {stock.map((item, i) => (
        <group key={i} position={[item.x, item.y + 0.02, front - 0.06]}>
          <mesh position={[0, item.bottle ? 0.075 : 0.05, 0]}>
            <cylinderGeometry args={item.bottle ? [0.026, 0.03, 0.15, 12] : [0.03, 0.03, 0.1, 12]} />
            <meshStandardMaterial color={item.color} roughness={item.bottle ? 0.15 : 0.35} metalness={item.bottle ? 0 : 0.5} transparent={item.bottle} opacity={item.bottle ? 0.85 : 1} />
          </mesh>
          {item.bottle ? (
            <mesh position={[0, 0.165, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.025, 8]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          ) : null}
        </group>
      ))}
      <mesh position={[WINDOW.x, WINDOW.y, front + 0.004]}>
        <boxGeometry args={[WINDOW.w + 0.02, WINDOW.h + 0.02, 0.006]} />
        <meshPhysicalMaterial color="#dff2ff" transparent opacity={0.2} roughness={0.05} />
      </mesh>
      {/* Control column: price display, keypad, coin and card slots. */}
      <group position={[0.31, 1.1, front + 0.004]}>
        <mesh>
          <boxGeometry args={[0.18, 0.75, 0.01]} />
          <meshStandardMaterial color="#232338" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.27, 0.007]}>
          <planeGeometry args={[0.13, 0.05]} />
          <meshStandardMaterial color="#0a1a0a" emissive="#4cff7a" emissiveIntensity={0.6} />
        </mesh>
        {Array.from({ length: 12 }, (_, k) => (
          <mesh key={k} position={[-0.04 + (k % 3) * 0.04, 0.17 - Math.floor(k / 3) * 0.04, 0.008]}>
            <boxGeometry args={[0.028, 0.028, 0.008]} />
            <meshStandardMaterial color="#d8dce4" metalness={0.5} roughness={0.35} />
          </mesh>
        ))}
        <mesh position={[0, -0.08, 0.008]}>
          <boxGeometry args={[0.05, 0.012, 0.006]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh position={[0, -0.16, 0.008]}>
          <boxGeometry args={[0.1, 0.06, 0.006]} />
          <meshStandardMaterial color="#111111" emissive="#2a7fff" emissiveIntensity={0.25} />
        </mesh>
      </group>
      {/* Pickup flap at the bottom. */}
      <mesh position={[-0.1, 0.32, front + 0.005]}>
        <boxGeometry args={[0.56, 0.18, 0.01]} />
        <meshStandardMaterial color="#1b1b1b" roughness={0.9} />
      </mesh>
      <mesh position={[-0.1, 0.38, front + 0.012]}>
        <boxGeometry args={[0.5, 0.02, 0.01]} />
        <meshStandardMaterial color="#c6cacd" map={metal.map} metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}
