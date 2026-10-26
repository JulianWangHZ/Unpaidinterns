import { RoundedBox } from '@react-three/drei';
import { useMemo } from 'react';
import { seeded } from '../../../lib/scenes/skyline.js';
import { Metal, Plastic, Wood, WOOD_EDGE } from './materials.js';
import { keyboardTexture, screenTexture } from './screens.js';

/** Matched to the chibi characters (about 0.9 tall), not to real-world desk height. */
const DESK_TOP_Y = 0.46;
const DESK = { width: 1.12, depth: 0.58 };

/** 24-inch monitor on a stand. Local +Z is the screen side. */
function Monitor({ tint }: { tint: string | null }) {
  const screen = screenTexture(tint);
  return (
    <group>
      <RoundedBox args={[0.2, 0.014, 0.14]} radius={0.006} smoothness={3} position={[0, 0.007, 0]}>
        <Metal />
      </RoundedBox>
      <mesh position={[0, 0.07, -0.035]} rotation={[-0.08, 0, 0]}>
        <boxGeometry args={[0.035, 0.13, 0.016]} />
        <Metal />
      </mesh>
      <RoundedBox args={[0.46, 0.27, 0.03]} radius={0.012} smoothness={3} position={[0, 0.2, 0]} castShadow>
        <Plastic />
      </RoundedBox>
      <mesh position={[0, 0.205, 0.0155]}>
        <planeGeometry args={[0.43, 0.24]} />
        <meshBasicMaterial map={screen} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.2, -0.022]}>
        <boxGeometry args={[0.16, 0.1, 0.02]} />
        <Plastic color="#35384a" />
      </mesh>
    </group>
  );
}

function Keyboard() {
  return (
    <group>
      <RoundedBox args={[0.42, 0.016, 0.14]} radius={0.006} smoothness={2} position={[0, 0.008, 0]}>
        <Plastic color="#d4d6e3" />
      </RoundedBox>
      <mesh position={[0, 0.0165, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.4, 0.125]} />
        <meshStandardMaterial map={keyboardTexture()} roughness={0.6} />
      </mesh>
    </group>
  );
}

function Mouse() {
  return (
    <mesh position={[0, 0.014, 0]} scale={[0.032, 0.016, 0.052]} castShadow>
      <sphereGeometry args={[1, 16, 12]} />
      <Plastic color="#f1f2fa" gloss />
    </mesh>
  );
}

function Mug({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.036, 0.1, 18]} />
        <Plastic color={color} gloss />
      </mesh>
      <mesh position={[0, 0.098, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.035, 18]} />
        <meshStandardMaterial color="#5b3a22" roughness={0.2} />
      </mesh>
      <mesh position={[0.045, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.024, 0.007, 8, 14, Math.PI]} />
        <Plastic color={color} gloss />
      </mesh>
    </group>
  );
}

function DeskLamp() {
  return (
    <group>
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.06, 0.07, 0.02, 18]} />
        <Plastic color="#2a2550" />
      </mesh>
      <mesh position={[0.03, 0.17, 0]} rotation={[0, 0, -0.35]}>
        <cylinderGeometry args={[0.008, 0.008, 0.32, 8]} />
        <Metal color="#2a2550" />
      </mesh>
      <mesh position={[0.1, 0.31, 0]} rotation={[0, 0, 0.9]}>
        <coneGeometry args={[0.06, 0.1, 16, 1, true]} />
        <meshStandardMaterial color="#ffe3b8" emissive="#ffcf8f" emissiveIntensity={0.7} side={2} />
      </mesh>
    </group>
  );
}

function BookStack() {
  const colours = ['#e07a5f', '#6f9dff', '#ffe08a'];
  return (
    <group>
      {colours.map((color, i) => (
        <RoundedBox key={color} args={[0.2 - i * 0.02, 0.035, 0.15]} radius={0.004} smoothness={2} position={[0, 0.018 + i * 0.036, 0]} rotation={[0, i * 0.2, 0]}>
          <meshStandardMaterial color={color} roughness={0.8} />
        </RoundedBox>
      ))}
    </group>
  );
}

function SmallPlant() {
  return (
    <group>
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.05, 0.04, 0.09, 14]} />
        <meshStandardMaterial color="#e9d5c0" roughness={0.8} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[Math.cos(i * 1.3) * 0.03, 0.13, Math.sin(i * 1.3) * 0.03]} rotation={[Math.sin(i) * 0.5, i * 1.3, Math.cos(i) * 0.5]} scale={[0.025, 0.07, 0.012]}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color="#4fae72" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

/** Ergonomic office chair: five-star base on casters, gas lift, padded seat and a slightly reclined back. */
export function OfficeChair({ color = '#e0798f' }: { color?: string }) {
  return (
    <group>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <group key={i} rotation={[0, a, 0]}>
            <mesh position={[0.13, 0.05, 0]} rotation={[0, 0, 0.12]}>
              <boxGeometry args={[0.26, 0.025, 0.035]} />
              <Plastic />
            </mesh>
            <mesh position={[0.25, 0.022, 0]}>
              <sphereGeometry args={[0.022, 10, 8]} />
              <Plastic />
            </mesh>
          </group>
        );
      })}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.022, 0.03, 0.28, 12]} />
        <Metal />
      </mesh>
      <RoundedBox args={[0.42, 0.07, 0.4]} radius={0.03} smoothness={3} position={[0, 0.37, 0]} castShadow>
        <meshStandardMaterial color={color} roughness={0.9} />
      </RoundedBox>
      <group position={[0, 0.4, -0.2]} rotation={[-0.14, 0, 0]}>
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[0.04, 0.24, 0.025]} />
          <Plastic />
        </mesh>
        <RoundedBox args={[0.4, 0.42, 0.06]} radius={0.04} smoothness={3} position={[0, 0.36, 0]} castShadow>
          <meshStandardMaterial color={color} roughness={0.9} />
        </RoundedBox>
      </group>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.23, 0.48, -0.02]}>
          <mesh position={[0, -0.05, 0]}>
            <boxGeometry args={[0.025, 0.12, 0.025]} />
            <Plastic />
          </mesh>
          <RoundedBox args={[0.05, 0.03, 0.24]} radius={0.012} smoothness={2}>
            <Plastic />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}

type Accessory = 'lamp' | 'books' | 'plant' | 'none';
const ACCESSORIES: readonly Accessory[] = ['lamp', 'books', 'plant', 'none', 'plant', 'books'];
const MUGS = ['#ffffff', '#ff8fab', '#6f9dff', '#ffe08a'];

/**
 * A full desk set. Local -Z is where the person sits; +Z faces the viewer.
 * `seed` varies the accessories so a row of desks does not look copy-pasted.
 */
export function Workstation({ tint, seed, statusColor }: { tint: string | null; seed: number; statusColor: string }) {
  const { accessory, mug, chairTurn } = useMemo(() => {
    const random = seeded(seed);
    return {
      accessory: ACCESSORIES[Math.floor(random() * ACCESSORIES.length)] as Accessory,
      mug: MUGS[Math.floor(random() * MUGS.length)] as string,
      chairTurn: (random() - 0.5) * 0.5,
    };
  }, [seed]);
  const half = DESK.width / 2;
  return (
    <group>
      <group position={[0, 0, 0.42]}>
        <RoundedBox args={[DESK.width, 0.04, DESK.depth]} radius={0.012} smoothness={3} position={[0, DESK_TOP_Y, 0]} castShadow receiveShadow>
          <Wood />
        </RoundedBox>
        <mesh position={[0, DESK_TOP_Y - 0.03, DESK.depth / 2 - 0.004]}>
          <boxGeometry args={[DESK.width - 0.02, 0.02, 0.01]} />
          <Wood color={WOOD_EDGE} />
        </mesh>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * (half - 0.05), 0, 0]}>
            {[-1, 1].map((end) => (
              <mesh key={end} position={[0, DESK_TOP_Y / 2, end * (DESK.depth / 2 - 0.05)]}>
                <boxGeometry args={[0.035, DESK_TOP_Y - 0.02, 0.035]} />
                <Metal />
              </mesh>
            ))}
            <mesh position={[0, 0.02, 0]}>
              <boxGeometry args={[0.04, 0.03, DESK.depth - 0.04]} />
              <Metal />
            </mesh>
          </group>
        ))}
        {/* Modesty panel on the viewer's side, with the status light along its top. */}
        <mesh position={[0, DESK_TOP_Y - 0.2, DESK.depth / 2 - 0.06]} castShadow>
          <boxGeometry args={[DESK.width - 0.14, 0.32, 0.015]} />
          <Wood color="#e6d2bb" />
        </mesh>
        <mesh position={[0, DESK_TOP_Y - 0.06, DESK.depth / 2 - 0.05]}>
          <boxGeometry args={[DESK.width - 0.3, 0.02, 0.01]} />
          <meshBasicMaterial color={statusColor} toneMapped={false} />
        </mesh>
        <group position={[half - 0.22, 0, -0.05]}>
          <RoundedBox args={[0.3, 0.33, 0.42]} radius={0.015} smoothness={2} position={[0, 0.18, 0]} castShadow>
            <Wood color="#e6d2bb" />
          </RoundedBox>
          {[0.28, 0.18, 0.08].map((y) => (
            <mesh key={y} position={[0, y, -0.213]}>
              <boxGeometry args={[0.12, 0.014, 0.012]} />
              <Metal />
            </mesh>
          ))}
        </group>
        <group position={[0, DESK_TOP_Y + 0.02, 0.12]} rotation={[0, Math.PI, 0]}>
          <Monitor tint={tint} />
        </group>
        <group position={[-0.02, DESK_TOP_Y + 0.02, -0.12]}>
          <Keyboard />
        </group>
        <group position={[0.3, DESK_TOP_Y + 0.02, -0.12]}>
          <Mouse />
        </group>
        <group position={[-0.42, DESK_TOP_Y + 0.02, -0.1]}>
          <Mug color={mug} />
        </group>
        {accessory !== 'none' ? (
          <group position={[0.4, DESK_TOP_Y + 0.02, 0.12]}>
            {accessory === 'lamp' ? <DeskLamp /> : accessory === 'books' ? <BookStack /> : <SmallPlant />}
          </group>
        ) : null}
      </group>
      <group position={[0, 0, -0.1]} rotation={[0, chairTurn, 0]} scale={0.62}>
        <OfficeChair />
      </group>
    </group>
  );
}
