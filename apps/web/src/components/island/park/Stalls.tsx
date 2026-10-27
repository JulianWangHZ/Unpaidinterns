import { RoundedBox } from '@react-three/drei';
import { Carousel } from './Carousel.js';
import { Bulb, CANDY, STRIPES, Strut } from './parts.js';

const WOOD = '#c99d76';
const CREAM = '#fff3dc';

/** Striped awning: a row of slats sloping down to the front, with a scalloped edge. */
export function Awning({ width, depth, y, z = 0, colors = STRIPES }: { width: number; depth: number; y: number; z?: number; colors?: readonly string[] }) {
  const slats = Math.max(4, Math.round(width / 0.18));
  return (
    <group position={[0, y, z]} rotation={[0.32, 0, 0]}>
      {Array.from({ length: slats }, (_, i) => (
        <mesh key={i} position={[-width / 2 + (i + 0.5) * (width / slats), 0, 0]} castShadow>
          <boxGeometry args={[width / slats, 0.03, depth]} />
          <meshStandardMaterial color={colors[i % colors.length]} roughness={0.7} />
        </mesh>
      ))}
      {Array.from({ length: slats }, (_, i) => (
        <mesh key={`e${i}`} position={[-width / 2 + (i + 0.5) * (width / slats), -0.05, depth / 2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[width / slats / 2, width / slats / 2, 0.02, 10, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color={colors[i % colors.length]} side={2} />
        </mesh>
      ))}
    </group>
  );
}

/** Ice cream cart with a parasol and tubs of colour in the glass top. */
export function IceCreamCart() {
  return (
    <group position={[0, 0, -0.1]}>
      <RoundedBox args={[1.0, 0.6, 0.55]} radius={0.08} smoothness={3} position={[0, 0.5, 0]} castShadow>
        <meshStandardMaterial color="#9fe0d2" roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, 0.84, 0]}>
        <boxGeometry args={[0.9, 0.08, 0.45]} />
        <meshStandardMaterial color="#e8f6ff" transparent opacity={0.6} roughness={0.1} />
      </mesh>
      {CANDY.slice(0, 4).map((color, i) => (
        <mesh key={color} position={[-0.3 + i * 0.2, 0.83, 0]}>
          <sphereGeometry args={[0.07, 10, 8]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      ))}
      {[-0.42, 0.42].map((x) => (
        <mesh key={x} position={[x, 0.2, 0.28]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.16, 0.04, 8, 18]} />
          <meshStandardMaterial color="#3b3f52" />
        </mesh>
      ))}
      <Strut from={[0.3, 0.85, -0.15]} to={[0.3, 2.0, -0.15]} radius={0.02} color="#c3c8d1" />
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[0.3, 2.05, -0.15]}>
          <coneGeometry args={[0.75, 0.3, 4, 1, true, (i / 8) * Math.PI * 2, Math.PI / 4]} />
          <meshStandardMaterial color={i % 2 ? '#fff6ea' : '#8ec5ff'} side={2} />
        </mesh>
      ))}
    </group>
  );
}

/** Popcorn and snacks stand: a timber counter under a striped awning, with a menu board. */
export function FoodStand({ night }: { night: boolean }) {
  return (
    <group position={[0, 0, -0.3]}>
      <mesh position={[0, 0.5, -0.1]} castShadow>
        <boxGeometry args={[1.6, 1.0, 0.8]} />
        <meshStandardMaterial color={CREAM} roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.02, 0.18]}>
        <boxGeometry args={[1.7, 0.06, 0.4]} />
        <meshStandardMaterial color={WOOD} roughness={0.7} />
      </mesh>
      <mesh position={[-0.45, 1.25, 0.05]}>
        <boxGeometry args={[0.4, 0.4, 0.34]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.55} roughness={0.1} />
      </mesh>
      <mesh position={[-0.45, 1.15, 0.05]}>
        <boxGeometry args={[0.36, 0.18, 0.3]} />
        <meshStandardMaterial color="#ffe8a3" roughness={1} />
      </mesh>
      {[-0.75, 0.75].map((x) => (
        <Strut key={x} from={[x, 1.0, 0.25]} to={[x, 2.0, 0.25]} radius={0.04} color={WOOD} metal={false} />
      ))}
      <mesh position={[0, 2.1, -0.45]}>
        <boxGeometry args={[1.7, 0.7, 0.06]} />
        <meshStandardMaterial color="#ff5d6c" roughness={0.6} />
      </mesh>
      <Awning width={1.8} depth={0.9} y={2.0} z={0.15} />
      {Array.from({ length: 6 }, (_, i) => (
        <Bulb key={i} at={[-0.75 + i * 0.3, 1.82, 0.62]} night={night} size={0.04} />
      ))}
    </group>
  );
}

/** Round bandstand: a raised stage with railings, slim columns and a striped dome. */
export function Bandstand({ night }: { night: boolean }) {
  const columns = 8;
  return (
    <group position={[0, 0, -0.2]}>
      <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.0, 1.05, 0.4, 8]} />
        <meshStandardMaterial color={CREAM} roughness={0.8} />
      </mesh>
      {Array.from({ length: columns }, (_, i) => {
        const a = (i / columns) * Math.PI * 2;
        const x = Math.cos(a) * 0.9;
        const z = Math.sin(a) * 0.9;
        return <Strut key={i} from={[x, 0.4, z]} to={[x, 2.0, z]} radius={0.035} color="#ffffff" metal={false} />;
      })}
      {Array.from({ length: columns }, (_, i) => (
        <mesh key={`d${i}`} position={[0, 2.25, 0]} castShadow>
          <coneGeometry args={[1.15, 0.6, 2, 1, false, (i / columns) * Math.PI * 2, (Math.PI * 2) / columns]} />
          <meshStandardMaterial color={i % 2 ? '#8ec5ff' : '#ffffff'} roughness={0.6} />
        </mesh>
      ))}
      <Strut from={[0, 2.5, 0]} to={[0, 2.95, 0]} radius={0.015} color="#c3c8d1" />
      <mesh position={[0.12, 2.88, 0]}>
        <planeGeometry args={[0.24, 0.14]} />
        <meshStandardMaterial color="#ff5d6c" side={2} />
      </mesh>
      {/* A microphone stand at the front of the stage. */}
      <Strut from={[0, 0.4, 0.55]} to={[0, 1.05, 0.55]} radius={0.012} color="#3b3f52" />
      <mesh position={[0, 1.08, 0.55]}>
        <sphereGeometry args={[0.04, 8, 6]} />
        <meshStandardMaterial color="#3b3f52" />
      </mesh>
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return <Bulb key={i} at={[Math.cos(a) * 1.15, 1.95, Math.sin(a) * 1.15]} night={night} color={CANDY[i % CANDY.length]} size={0.04} />;
      })}
    </group>
  );
}

/** Ring-toss stall: a counter, bottles to aim at, and prizes hanging from the striped awning. */
export function GameStall({ night }: { night: boolean }) {
  return (
    <group position={[0, 0, -0.35]}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[1.4, 0.9, 0.5]} />
        <meshStandardMaterial color="#c9a8ff" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.92, 0.05]}>
        <boxGeometry args={[1.5, 0.05, 0.62]} />
        <meshStandardMaterial color={WOOD} roughness={0.7} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[-0.5 + i * 0.2, 1.05, -0.05]}>
          <cylinderGeometry args={[0.035, 0.05, 0.2, 10]} />
          <meshStandardMaterial color={i % 2 ? '#4fae72' : '#8ec5ff'} transparent opacity={0.85} roughness={0.15} />
        </mesh>
      ))}
      {[-0.68, 0.68].map((x) => (
        <Strut key={x} from={[x, 0.9, -0.2]} to={[x, 1.9, -0.2]} radius={0.035} color="#ffffff" metal={false} />
      ))}
      <mesh position={[0, 1.5, -0.24]}>
        <boxGeometry args={[1.36, 0.9, 0.04]} />
        <meshStandardMaterial color="#ffd25e" roughness={0.7} />
      </mesh>
      {/* Plush prizes pinned to the back board. */}
      {CANDY.slice(0, 5).map((color, i) => (
        <mesh key={color} position={[-0.48 + i * 0.24, 1.6, -0.18]}>
          <sphereGeometry args={[0.09, 10, 8]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
      ))}
      <Awning width={1.5} depth={0.8} y={1.95} z={0.05} colors={['#c9a8ff', '#ffffff']} />
      {Array.from({ length: 5 }, (_, i) => (
        <Bulb key={i} at={[-0.6 + i * 0.3, 1.78, 0.5]} night={night} size={0.04} />
      ))}
    </group>
  );
}

/** Park bench with a cast-iron frame and timber slats. */
export function Bench() {
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.34, -0.09 + i * 0.1]}>
          <boxGeometry args={[1.1, 0.04, 0.08]} />
          <meshStandardMaterial color={WOOD} roughness={0.7} />
        </mesh>
      ))}
      {[0, 1].map((i) => (
        <mesh key={`b${i}`} position={[0, 0.5 + i * 0.13, -0.17]} rotation={[-0.15, 0, 0]}>
          <boxGeometry args={[1.1, 0.08, 0.035]} />
          <meshStandardMaterial color={WOOD} roughness={0.7} />
        </mesh>
      ))}
      {[-0.48, 0.48].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.17, 0.02]}>
            <boxGeometry args={[0.05, 0.34, 0.32]} />
            <meshStandardMaterial color="#2f3446" metalness={0.5} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.5, -0.17]} rotation={[-0.15, 0, 0]}>
            <boxGeometry args={[0.05, 0.38, 0.05]} />
            <meshStandardMaterial color="#2f3446" metalness={0.5} roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Picnic spot: a gingham blanket under a sun umbrella, with a basket. */
export function Picnic() {
  return (
    <group>
      {Array.from({ length: 16 }, (_, i) => (
        <mesh key={i} position={[-0.6 + (i % 4) * 0.4 + 0.2, 0.012, -0.6 + Math.floor(i / 4) * 0.4 + 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.4, 0.4]} />
          <meshStandardMaterial color={(i + Math.floor(i / 4)) % 2 ? '#ffffff' : '#ff8f9c'} roughness={1} />
        </mesh>
      ))}
      <mesh position={[0.45, 0.15, 0.45]} castShadow>
        <boxGeometry args={[0.3, 0.2, 0.22]} />
        <meshStandardMaterial color={WOOD} roughness={0.9} />
      </mesh>
      <mesh position={[0.45, 0.28, 0.45]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.1, 0.015, 6, 16, Math.PI]} />
        <meshStandardMaterial color="#8a5f38" />
      </mesh>
      <Strut from={[-0.6, 0, -0.6]} to={[-0.5, 1.8, -0.5]} radius={0.025} color="#ffffff" metal={false} />
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={`u${i}`} position={[-0.5, 1.85, -0.5]}>
          <coneGeometry args={[1.0, 0.35, 4, 1, true, (i / 8) * Math.PI * 2, Math.PI / 4]} />
          <meshStandardMaterial color={i % 2 ? '#ffffff' : '#ffd25e'} side={2} />
        </mesh>
      ))}
    </group>
  );
}

export { Carousel };
