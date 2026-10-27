import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group, MeshBasicMaterial } from 'three';
import { dropTowerHeight, RIDES } from '../../../lib/scenes/park-layout.js';
import { DROP, dropSeatAngle } from '../../../lib/scenes/rides.js';
import type { Vec3 } from '../../../lib/scenes/types.js';
import { useCanvasTexture } from '../office/canvas-texture.js';
import { Bulb, CANDY, Strut } from './parts.js';

const { height: HEIGHT } = RIDES.dropTower;
const HALF = 0.36;
const BAY = 1.1;
const STEEL = '#eef0f6';
const PURPLE = '#7a5cff';

/**
 * One outward-facing seat on the carriage, with its back to the tower. Origin is the seat surface;
 * the rider sits on it facing +z with legs hanging over the front edge, inside the harness.
 */
function Seat({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, -0.03, 0.02]}>
        <boxGeometry args={[0.3, 0.06, 0.26]} />
        <meshStandardMaterial color="#23252f" roughness={0.8} />
      </mesh>
      <RoundedBox args={[0.32, 0.56, 0.08]} radius={0.03} smoothness={2} position={[0, 0.26, -0.15]}>
        <meshStandardMaterial color={color} roughness={0.45} />
      </RoundedBox>
      <mesh position={[0, 0.58, -0.13]}>
        <boxGeometry args={[0.22, 0.14, 0.08]} />
        <meshStandardMaterial color="#23252f" roughness={0.8} />
      </mesh>
      {/* Shoulder harness: two padded bars curving over the shoulders and down the chest. */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.09, 0, 0]}>
          <mesh position={[0, 0.52, -0.04]} rotation={[0.9, 0, 0]}>
            <boxGeometry args={[0.045, 0.2, 0.045]} />
            <meshStandardMaterial color="#ffd25e" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.34, 0.1]}>
            <boxGeometry args={[0.045, 0.24, 0.045]} />
            <meshStandardMaterial color="#ffd25e" roughness={0.5} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, -0.36, 0.2]}>
        <boxGeometry args={[0.28, 0.03, 0.12]} />
        <meshStandardMaterial color="#9aa0aa" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

function drawBanner(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = PURPLE;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#ffd25e';
  ctx.fillRect(0, 0, width, 8);
  ctx.fillRect(0, height - 8, width, 8);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 54px "Baloo 2", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < 4; i += 1) ctx.fillText('FREE FALL', (i + 0.5) * (width / 4), height / 2 + 3);
}

/** Lattice drop tower: boarding deck, a ring of harnessed seats that climbs, waits and drops, and a lit crown. */
export function DropTower({ night }: { night: boolean }) {
  const carriage = useRef<Group>(null);
  const crown = useRef<MeshBasicMaterial>(null);
  const chase = useRef<Array<MeshBasicMaterial | null>>([]);
  const banner = useCanvasTexture(1024, 96, drawBanner, 'drop-banner');
  const corners = useMemo(() => [-HALF, HALF].flatMap((x) => [-HALF, HALF].map((z) => [x, z] as const)), []);
  const bays = useMemo(() => Array.from({ length: Math.floor(HEIGHT / BAY) }, (_, i) => i * BAY + 0.4), []);
  const lights = useMemo(() => Array.from({ length: 22 }, (_, i) => 0.6 + i * ((HEIGHT - 1) / 22)), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (carriage.current) carriage.current.position.y = dropTowerHeight(t);
    if (crown.current) crown.current.color.set(night && Math.sin(t * 4) > 0 ? '#ff5d6c' : night ? '#7a2a36' : '#ff8f9c');
    // At night a band of light runs up the tower.
    const head = (t * 8) % lights.length;
    chase.current.forEach((light, i) => {
      if (!light) return;
      const behind = (head - i + lights.length) % lights.length;
      light.color.set(night ? (behind < 4 ? '#ffffff' : '#b9a6ff') : '#e9e4ff');
    });
  });

  return (
    <group position={RIDES.dropTower.at}>
      {/* Boarding deck with steps, a railing and the operator's box. */}
      <mesh position={[0, 0.14, 0]} receiveShadow>
        <cylinderGeometry args={[RIDES.dropTower.radius + 0.3, RIDES.dropTower.radius + 0.4, 0.28, 32]} />
        <meshStandardMaterial color="#d8d2e6" roughness={0.9} />
      </mesh>
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        const r = RIDES.dropTower.radius + 0.28;
        return i % 6 === 1 ? null : (
          <mesh key={i} position={[Math.cos(a) * r, 0.62, Math.sin(a) * r]}>
            <cylinderGeometry args={[0.02, 0.02, 0.68, 6]} />
            <meshStandardMaterial color="#c3c8d1" metalness={0.7} roughness={0.3} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.96, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[RIDES.dropTower.radius + 0.28, 0.025, 6, 48]} />
        <meshStandardMaterial color="#ffd25e" roughness={0.5} />
      </mesh>
      <group position={[RIDES.dropTower.radius + 0.9, 0, 0.6]}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[0.7, 1.2, 0.7]} />
          <meshStandardMaterial color="#fff3dc" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.75, 0.36]}>
          <boxGeometry args={[0.5, 0.35, 0.02]} />
          <meshStandardMaterial color={night ? '#ffe2a8' : '#9fc6e8'} emissive={night ? '#ffcf8a' : '#000000'} emissiveIntensity={night ? 0.8 : 0} />
        </mesh>
        <mesh position={[0, 1.27, 0]}>
          <boxGeometry args={[0.85, 0.08, 0.85]} />
          <meshStandardMaterial color={PURPLE} />
        </mesh>
      </group>
      {/* Lattice mast: corner chords, a horizontal frame every bay, and X-bracing on each face. */}
      {corners.map(([x, z]) => (
        <Strut key={`${x},${z}`} from={[x, 0.28, z]} to={[x, HEIGHT, z]} radius={0.055} color={STEEL} />
      ))}
      {bays.flatMap((y, i) =>
        corners.map(([x, z], c) => {
          const [nx, nz] = corners[[1, 3, 0, 2][c] as number] as readonly [number, number];
          const low: Vec3 = [x, y, z];
          const high: Vec3 = [nx, y + BAY, nz];
          return (
            <group key={`${i},${c}`}>
              <Strut from={low} to={high} radius={0.022} color="#c3c8d1" />
              <Strut from={[x, y + BAY, z]} to={[nx, y, nz]} radius={0.022} color="#c3c8d1" />
              <Strut from={[x, y, z]} to={[nx, y, nz]} radius={0.028} color={STEEL} />
            </group>
          );
        }),
      )}
      {/* Guide rails on each face that the carriage runs on, and brake fins at the bottom. */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const r = HALF * Math.SQRT2 + 0.08;
        return (
          <group key={i}>
            <mesh position={[Math.cos(a) * r, HEIGHT / 2, Math.sin(a) * r]}>
              <boxGeometry args={[0.06, HEIGHT - 0.4, 0.06]} />
              <meshStandardMaterial color="#9aa0aa" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[Math.cos(a) * (r + 0.05), 1.0, Math.sin(a) * (r + 0.05)]}>
              <boxGeometry args={[0.04, 1.2, 0.12]} />
              <meshStandardMaterial color="#e2384d" metalness={0.4} />
            </mesh>
          </group>
        );
      })}
      {/* A column of lights up one face that chases upward at night. */}
      {lights.map((y, i) => (
        <mesh key={i} position={[HALF + 0.07, y, 0]}>
          <sphereGeometry args={[0.045, 8, 6]} />
          <meshBasicMaterial
            ref={(light) => {
              chase.current[i] = light;
            }}
            color="#e9e4ff"
            toneMapped={false}
          />
        </mesh>
      ))}
      {/* Crown: motor house, a band with the ride name, a warning beacon and a lightning rod. */}
      <mesh position={[0, HEIGHT + 0.3, 0]}>
        <cylinderGeometry args={[0.72, 0.6, 0.6, 24]} />
        <meshStandardMaterial color="#3b3f52" roughness={0.6} />
      </mesh>
      <mesh position={[0, HEIGHT + 0.3, 0]}>
        <cylinderGeometry args={[0.735, 0.735, 0.34, 32, 1, true]} />
        <meshBasicMaterial map={banner} toneMapped={false} side={2} />
      </mesh>
      <mesh position={[0, HEIGHT + 0.64, 0]}>
        <cylinderGeometry args={[0.76, 0.76, 0.08, 24]} />
        <meshBasicMaterial ref={crown} color="#ff8f9c" toneMapped={false} />
      </mesh>
      <Strut from={[0, HEIGHT + 0.68, 0]} to={[0, HEIGHT + 1.5, 0]} radius={0.015} color="#c3c8d1" />
      <Bulb at={[0, HEIGHT + 1.52, 0]} night color="#ff5d6c" size={0.06} />
      {/* The carriage: a collar round the mast carrying the seats, all moved by the shared timing. */}
      <group ref={carriage}>
        <mesh>
          <cylinderGeometry args={[DROP.ring + 0.08, DROP.ring + 0.08, 0.22, 32, 1, true]} />
          <meshStandardMaterial color="#ffd25e" roughness={0.4} side={2} />
        </mesh>
        <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[HALF * Math.SQRT2 + 0.15, DROP.ring + 0.08, 32]} />
          <meshStandardMaterial color="#3b3f52" side={2} />
        </mesh>
        {Array.from({ length: DROP.seats }, (_, i) => {
          const a = dropSeatAngle(i);
          return (
            <group key={i} position={[Math.cos(a) * DROP.seatRing, DROP.seatY, Math.sin(a) * DROP.seatRing]} rotation={[0, Math.atan2(Math.cos(a), Math.sin(a)), 0]}>
              <Seat color={CANDY[i % CANDY.length] as string} />
            </group>
          );
        })}
        {Array.from({ length: 16 }, (_, i) => {
          const a = (i / 16) * Math.PI * 2;
          return <Bulb key={i} at={[Math.cos(a) * (DROP.ring + 0.1), 0.13, Math.sin(a) * (DROP.ring + 0.1)]} night={night} size={0.035} />;
        })}
      </group>
    </group>
  );
}
