import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';
import { RIDES } from '../../../lib/scenes/park-layout.js';
import { gondolaPivot, WHEEL } from '../../../lib/scenes/rides.js';
import type { Vec3 } from '../../../lib/scenes/types.js';
import { Bulb, CANDY, Strut } from './parts.js';

const { radius: R, hub: HUB, drop: DROP } = WHEEL;
const SPOKES = 16;
/** The two rims sit wider apart than a cabin is deep, so the rims never pass through a cabin. */
const DEPTH = 0.55;
const CABIN = { width: WHEEL.cabin.width, depth: WHEEL.cabin.depth, wall: 0.38 } as const;
const FRAME = '#e9ecf5';

/**
 * Open cabin hanging from its pivot (origin). The bench seat is DROP below the pivot, matching the
 * rider pose, with the rider facing +z, legs over an open front.
 */
function Gondola({ color }: { color: string }) {
  const floor = -WHEEL.cabin.floorDrop;
  const roof = -WHEEL.cabin.roofDrop;
  const { width, depth, wall } = CABIN;
  return (
    <group>
      {[-0.32, 0.32].map((x) => (
        <Strut key={x} from={[x, 0, 0]} to={[x, roof, 0]} radius={0.018} color="#9aa0aa" />
      ))}
      <mesh position={[0, roof + 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.12, width * 0.62, 0.18, 6]} />
        <meshStandardMaterial color={color} roughness={0.45} />
      </mesh>
      <mesh position={[0, roof - 0.03, 0]}>
        <boxGeometry args={[width + 0.06, 0.05, depth + 0.06]} />
        <meshStandardMaterial color={FRAME} metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, roof + 0.22, 0]}>
        <sphereGeometry args={[0.05, 10, 8]} />
        <meshStandardMaterial color="#ffd25e" metalness={0.5} roughness={0.3} />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx},${sz}`} position={[(sx * width) / 2, (floor + roof) / 2, (sz * depth) / 2]}>
            <boxGeometry args={[0.035, roof - floor, 0.035]} />
            <meshStandardMaterial color={FRAME} metalness={0.4} roughness={0.4} />
          </mesh>
        )),
      )}
      <mesh position={[0, floor, 0]} castShadow>
        <boxGeometry args={[width, 0.06, depth]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      {/* Low walls on three sides; the front stays open below the rail so legs have room. */}
      <mesh position={[0, floor + wall / 2, -depth / 2]}>
        <boxGeometry args={[width, wall, 0.03]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[(sx * width) / 2, floor + wall / 2, 0]}>
          <boxGeometry args={[0.03, wall, depth]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, floor + wall + 0.12, depth / 2]}>
        <boxGeometry args={[width, 0.03, 0.03]} />
        <meshStandardMaterial color={FRAME} metalness={0.4} roughness={0.4} />
      </mesh>
      {/* Window bars on the sides above the walls, and a little door latch at the front. */}
      {[-1, 1].flatMap((sx) =>
        [-0.12, 0.12].map((z) => (
          <mesh key={`${sx},${z}`} position={[(sx * width) / 2, (floor + wall + roof) / 2, z]}>
            <boxGeometry args={[0.02, roof - floor - wall, 0.02]} />
            <meshStandardMaterial color={FRAME} metalness={0.4} roughness={0.4} />
          </mesh>
        )),
      )}
      <mesh position={[width / 2 - 0.08, floor + wall + 0.06, depth / 2 + 0.02]}>
        <boxGeometry args={[0.06, 0.03, 0.03]} />
        <meshStandardMaterial color="#ffd25e" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Bench and backrest along the back wall. */}
      <mesh position={[0, -DROP - 0.03, -0.1]}>
        <boxGeometry args={[width - 0.1, 0.06, 0.3]} />
        <meshStandardMaterial color="#fff6ea" roughness={0.8} />
      </mesh>
      <mesh position={[0, -DROP + 0.18, -0.26]}>
        <boxGeometry args={[width - 0.1, 0.36, 0.05]} />
        <meshStandardMaterial color="#fff6ea" roughness={0.8} />
      </mesh>
      <mesh position={[0, (floor - DROP - 0.06) / 2, -0.1]}>
        <boxGeometry args={[width - 0.1, -DROP - 0.06 - floor, 0.28]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** One A-frame leg built as a lattice: two parallel chords tied with rungs and diagonals. */
function LatticeLeg({ from, to }: { from: Vec3; to: Vec3 }) {
  const parts = useMemo(() => {
    const along = [to[0] - from[0], to[1] - from[1], to[2] - from[2]];
    const length = Math.hypot(along[0] as number, along[1] as number, along[2] as number);
    // The two chords sit apart across the wheel plane (x), tapering to meet at the hub.
    const chord = (side: number, t: number): Vec3 => [
      from[0] + (along[0] as number) * t + side * 0.14 * (1 - t),
      from[1] + (along[1] as number) * t,
      from[2] + (along[2] as number) * t,
    ];
    const rungs = Math.max(3, Math.round(length / 0.7));
    return { chord, rungs };
  }, [from, to]);
  const { chord, rungs } = parts;
  return (
    <group>
      <Strut from={chord(-1, 0)} to={chord(-1, 1)} radius={0.07} color={FRAME} />
      <Strut from={chord(1, 0)} to={chord(1, 1)} radius={0.07} color={FRAME} />
      {Array.from({ length: rungs }, (_, i) => {
        const t0 = i / rungs;
        const t1 = (i + 1) / rungs;
        return (
          <group key={i}>
            <Strut from={chord(-1, t0)} to={chord(1, t0)} radius={0.025} color={FRAME} />
            <Strut from={chord(-1, t0)} to={chord(1, t1)} radius={0.02} color="#c3c8d1" />
          </group>
        );
      })}
    </group>
  );
}

/** Ferris wheel on an A-frame. The wheel turns with the shared ride timing and every cabin hangs level. */
export function FerrisWheel({ night }: { night: boolean }) {
  const wheel = useRef<Group>(null);
  const cars = useRef<Array<Group | null>>([]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (wheel.current) wheel.current.rotation.z = t * WHEEL.spin;
    cars.current.forEach((car, i) => {
      if (car) car.position.set(...gondolaPivot(i, t));
    });
  });

  const legs = useMemo(
    () =>
      [-1, 1].flatMap((side) =>
        [-1, 1].map((spread) => ({ from: [spread * 2.9, 0, side * 1.3] as Vec3, to: [0, HUB, side * (DEPTH + 0.2)] as Vec3 })),
      ),
    [],
  );
  const rimBulbs = useMemo(() => Array.from({ length: 48 }, (_, i) => (i / 48) * Math.PI * 2), []);

  return (
    <group position={RIDES.ferrisWheel.at} rotation={[0, WHEEL.facing, 0]}>
      {/* Boarding platform with steps up from the path, a railing, and the operator's booth. */}
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <boxGeometry args={[2.8, 0.3, 2.0]} />
        <meshStandardMaterial color="#d8d2e6" roughness={0.9} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 0.05 + i * 0.1 - 0.1, 1.15 + (2 - i) * 0.22]} receiveShadow>
          <boxGeometry args={[1.2, 0.1 + i * 0.1, 0.22]} />
          <meshStandardMaterial color="#cfc8de" roughness={0.9} />
        </mesh>
      ))}
      {/* Railing along the back edge only: cabins swing through across the platform, so its sides stay open. */}
      <Strut from={[-1.38, 0.95, WHEEL.railZ]} to={[1.38, 0.95, WHEEL.railZ]} radius={0.025} color="#ffd25e" metal={false} />
      {[-1.3, -0.45, 0.45, 1.3].map((x) => (
        <Strut key={x} from={[x, 0.3, WHEEL.railZ]} to={[x, 0.95, WHEEL.railZ]} radius={0.02} color="#c3c8d1" />
      ))}
      <group position={[1.9, 0, 1.2]}>
        <mesh position={[0, 0.65, 0]} castShadow>
          <boxGeometry args={[0.7, 1.3, 0.7]} />
          <meshStandardMaterial color="#fff3dc" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.8, 0.36]}>
          <boxGeometry args={[0.5, 0.35, 0.02]} />
          <meshStandardMaterial color={night ? '#ffe2a8' : '#9fc6e8'} emissive={night ? '#ffcf8a' : '#000000'} emissiveIntensity={night ? 0.8 : 0} />
        </mesh>
        <mesh position={[0, 1.38, 0]}>
          <boxGeometry args={[0.86, 0.08, 0.86]} />
          <meshStandardMaterial color="#ff6f91" />
        </mesh>
      </group>
      {/* A-frame legs as lattice: two chords per leg tied together with rungs. */}
      {legs.map((leg) => (
        <LatticeLeg key={`${leg.from}`} from={leg.from} to={leg.to} />
      ))}
      {/* Rubber drive wheels under each rim, with their motors outside the rims so the lowest cabin passes clear. */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[0, HUB - R - 0.3, side * (DEPTH + 0.18)]}>
            <boxGeometry args={[0.7, 0.36, 0.22]} />
            <meshStandardMaterial color="#3b3f52" roughness={0.6} />
          </mesh>
          <Strut from={[0, 0.3, side * (DEPTH + 0.18)]} to={[0, HUB - R - 0.48, side * (DEPTH + 0.18)]} radius={0.06} color={FRAME} />
        </group>
      ))}
      {[-DEPTH, DEPTH].flatMap((z) =>
        [-0.22, 0.22].map((x) => (
          <mesh key={`${x},${z}`} position={[x, HUB - R - 0.14, z]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.13, 0.13, 0.1, 16]} />
            <meshStandardMaterial color="#1e2029" roughness={0.9} />
          </mesh>
        )),
      )}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Strut from={[-1.8, 2.2, side * 1.05]} to={[1.8, 2.2, side * 1.05]} radius={0.06} color={FRAME} />
          <Strut from={[-1.8, 2.2, side * 1.05]} to={[0, HUB - 0.4, side * (DEPTH + 0.2)]} radius={0.04} color={FRAME} />
          <Strut from={[1.8, 2.2, side * 1.05]} to={[0, HUB - 0.4, side * (DEPTH + 0.2)]} radius={0.04} color={FRAME} />
        </group>
      ))}
      <mesh position={[0, HUB, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, DEPTH * 2 + 0.6, 16]} />
        <meshStandardMaterial color="#c3c8d1" metalness={0.7} roughness={0.3} />
      </mesh>
      <Bulb at={[0, HUB + 0.28, 0]} night color="#ff5d6c" size={0.07} />
      <group ref={wheel} position={[0, HUB, 0]}>
        {[-DEPTH, DEPTH].map((z) => (
          <group key={z} position={[0, 0, z]}>
            <mesh>
              <torusGeometry args={[R, 0.07, 8, 72]} />
              <meshStandardMaterial color="#ff6f91" metalness={0.3} roughness={0.4} />
            </mesh>
            <mesh>
              <torusGeometry args={[R * 0.55, 0.04, 6, 48]} />
              <meshStandardMaterial color={FRAME} metalness={0.4} roughness={0.4} />
            </mesh>
            {Array.from({ length: SPOKES }, (_, i) => {
              const a = (i / SPOKES) * Math.PI * 2;
              return <Strut key={i} from={[0, 0, 0]} to={[Math.cos(a) * R, Math.sin(a) * R, 0]} radius={0.03} color={FRAME} />;
            })}
            {Array.from({ length: SPOKES }, (_, i) => {
              const a = (i / SPOKES) * Math.PI * 2;
              const b = ((i + 1) / SPOKES) * Math.PI * 2;
              return (
                <Strut key={`x${i}`} from={[Math.cos(a) * R * 0.55, Math.sin(a) * R * 0.55, 0]} to={[Math.cos(b) * R, Math.sin(b) * R, 0]} radius={0.018} color={FRAME} />
              );
            })}
          </group>
        ))}
        {/* A star-shaped plate on each face of the hub, and tension cables from the hub ends to their own rim. */}
        {[-DEPTH - 0.02, DEPTH + 0.02].map((z) => (
          <group key={`hub${z}`} position={[0, 0, z]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.5, 0.5, 0.05, 8]} />
              <meshStandardMaterial color="#ff6f91" metalness={0.3} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0, Math.sign(z) * 0.03]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.28, 0.28, 0.04, 16]} />
              <meshStandardMaterial color="#ffd25e" metalness={0.5} roughness={0.3} />
            </mesh>
            {Array.from({ length: 8 }, (_, i) => {
              const a = (i / 8) * Math.PI * 2;
              return <Bulb key={i} at={[Math.cos(a) * 0.4, Math.sin(a) * 0.4, Math.sign(z) * 0.04]} night={night} color={CANDY[i % CANDY.length]} size={0.04} />;
            })}
          </group>
        ))}
        {Array.from({ length: SPOKES / 2 }, (_, i) => {
          const a = ((i * 2 + 1) / SPOKES) * Math.PI * 2;
          return (
            <group key={`k${i}`}>
              <Strut from={[0, 0, -DEPTH - 0.25]} to={[Math.cos(a) * R, Math.sin(a) * R, -DEPTH]} radius={0.01} color="#9aa0aa" />
              <Strut from={[0, 0, DEPTH + 0.25]} to={[Math.cos(a) * R, Math.sin(a) * R, DEPTH]} radius={0.01} color="#9aa0aa" />
            </group>
          );
        })}
        {rimBulbs.map((a, i) => (
          <Bulb key={i} at={[Math.cos(a) * (R + 0.02), Math.sin(a) * (R + 0.02), DEPTH + 0.08]} night={night} color={CANDY[i % CANDY.length]} size={0.05} />
        ))}
        {/* Axles across the two rims, one for each cabin. */}
        {Array.from({ length: WHEEL.cars }, (_, i) => {
          const a = (i / WHEEL.cars) * Math.PI * 2;
          return <Strut key={`p${i}`} from={[Math.cos(a) * R, Math.sin(a) * R, -DEPTH]} to={[Math.cos(a) * R, Math.sin(a) * R, DEPTH]} radius={0.035} color={FRAME} />;
        })}
      </group>
      {/* Cabins hang from the turning rim but stay level, so they are placed outside the wheel group. */}
      {Array.from({ length: WHEEL.cars }, (_, i) => (
        <group
          key={i}
          ref={(car) => {
            cars.current[i] = car;
          }}
        >
          <Gondola color={CANDY[i % CANDY.length] as string} />
        </group>
      ))}
    </group>
  );
}
