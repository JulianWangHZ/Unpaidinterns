import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, Vector3, type Mesh } from 'three';
import { SLIDE, SLIDE_LEGS, slideCurve, SPLASH_POOL, WATER } from '../../../lib/scenes/pool-layout.js';
import type { Vec3 } from '../../../lib/scenes/types.js';
import { Bulb, Strut } from '../park/parts.js';

const UP = new Vector3(0, 1, 0);
const RADIUS = SLIDE.width / 2;
const SAMPLES = 120;
const SIDES = 14;

/**
 * Open half-pipe along the flume's centre line. The curve marks the seat surface (the trough's
 * lowest point), so the half-circle sits above it: riders placed on the curve sit in the trough.
 */
function flumeGeometry(radius: number, lift: number): BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= SAMPLES; i += 1) {
    const u = i / SAMPLES;
    const point = slideCurve.getPointAt(u);
    const forward = slideCurve.getTangentAt(u);
    const side = forward.clone().cross(UP).normalize();
    const up = side.clone().cross(forward).normalize();
    const centre = point.clone().addScaledVector(up, radius + lift);
    for (let j = 0; j <= SIDES; j += 1) {
      // From one lip, down through the trough, up to the other lip.
      const a = Math.PI + (j / SIDES) * Math.PI;
      const p = centre.clone().addScaledVector(side, Math.cos(a) * radius).addScaledVector(up, Math.sin(a) * radius);
      positions.push(p.x, p.y, p.z);
    }
  }
  for (let i = 0; i < SAMPLES; i += 1) {
    for (let j = 0; j < SIDES; j += 1) {
      const a = i * (SIDES + 1) + j;
      const b = a + SIDES + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Points along the flume for the supports, skipping the top section over the platform. */
function supportPoints(): Vector3[] {
  return Array.from({ length: 6 }, (_, i) => slideCurve.getPointAt(0.18 + i * 0.13)).filter(
    (p) => p.y > 0.4 && !(p.x > SPLASH_POOL.x1 - 0.3 && p.x < SPLASH_POOL.x2 + 0.3 && p.z > SPLASH_POOL.z1 - 0.3 && p.z < SPLASH_POOL.z2 + 0.3),
  );
}

/** Water slide: a stair tower to a canopied platform, and a yellow flume spiralling down to the splash pool. */
export function WaterSlide({ night }: { night: boolean }) {
  const shell = useMemo(() => flumeGeometry(RADIUS, 0), []);
  const stream = useMemo(() => flumeGeometry(RADIUS * 0.55, 0.005), []);
  const supports = useMemo(() => supportPoints(), []);
  const splash = useRef<Mesh>(null);
  const end = useMemo(() => slideCurve.getPointAt(1), []);
  const [tx, , tz] = SLIDE.tower;
  const top = SLIDE.top;

  useFrame(({ clock }) => {
    if (splash.current) {
      const t = (clock.elapsedTime * 1.4) % 1;
      splash.current.scale.setScalar(0.4 + t * 1.2);
      (splash.current.material as { opacity: number }).opacity = 0.5 * (1 - t);
    }
  });

  const legs = SLIDE_LEGS;
  const steps = 12;

  return (
    <group>
      {/* Tower frame, platform and railing. */}
      {legs.map((leg) => (
        <Strut key={`${leg}`} from={leg} to={[leg[0], top + 1.2, leg[2]]} radius={0.07} color="#2a74d6" />
      ))}
      {[1.1, 2.3].map((y) =>
        legs.map((leg, i) => {
          const next = legs[[1, 3, 0, 2][i] as number] as Vec3;
          // Braces go round the sides and back only; the front, where the flume leaves, stays open.
          if (leg[2] > tz && next[2] > tz) return null;
          return <Strut key={`${y},${i}`} from={[leg[0], y, leg[2]]} to={[next[0], y, next[2]]} radius={0.035} color="#2a74d6" />;
        }),
      )}
      <mesh position={[tx, top - 0.06, tz]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.12, 1.7]} />
        <meshStandardMaterial color="#d8dce6" roughness={0.8} />
      </mesh>
      {[
        [tx - 0.85, tz, Math.PI / 2],
        [tx, tz - 0.85, 0],
        [tx + 0.85, tz, Math.PI / 2],
      ].map(([x, z, turn]) => (
        <group key={`${x},${z}`} position={[x as number, top, z as number]} rotation={[0, turn as number, 0]}>
          <Strut from={[-0.85, 0.95, 0]} to={[0.85, 0.95, 0]} radius={0.03} color="#ffd25e" metal={false} />
          <mesh position={[0, 0.48, 0]}>
            <boxGeometry args={[1.7, 0.9, 0.02]} />
            <meshPhysicalMaterial color="#dff2ff" transparent opacity={0.25} roughness={0.05} depthWrite={false} />
          </mesh>
        </group>
      ))}
      {/* A striped canopy over the platform. */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={`c${i}`} position={[tx, top + 1.45, tz]} castShadow>
          <coneGeometry args={[1.3, 0.5, 4, 1, false, (i / 8) * Math.PI * 2 + Math.PI / 4, Math.PI / 4]} />
          <meshStandardMaterial color={i % 2 ? '#ffffff' : '#2a74d6'} roughness={0.6} side={2} />
        </mesh>
      ))}
      {/* Straight stair up the back of the tower. */}
      {Array.from({ length: steps }, (_, i) => {
        const y = ((i + 1) / steps) * top;
        const z = tz - 0.85 - (steps - i) * 0.24;
        return (
          <mesh key={`s${i}`} position={[tx, y - 0.04, z]} castShadow>
            <boxGeometry args={[0.6, 0.06, 0.26]} />
            <meshStandardMaterial color="#d8dce6" roughness={0.8} />
          </mesh>
        );
      })}
      {[-0.32, 0.32].map((side) => (
        <group key={side}>
          <Strut from={[tx + side, 1.0, tz - 0.85 - steps * 0.24]} to={[tx + side, top + 0.95, tz - 0.85]} radius={0.025} color="#ffd25e" metal={false} />
          <Strut from={[tx + side, 0, tz - 0.85 - steps * 0.24]} to={[tx + side, top - 0.1, tz - 0.85]} radius={0.04} color="#2a74d6" />
        </group>
      ))}
      {/* The flume, with a stream of water running down its trough. */}
      <mesh geometry={shell} castShadow receiveShadow>
        <meshStandardMaterial color="#ffc23a" roughness={0.25} metalness={0.05} side={2} />
      </mesh>
      <mesh geometry={stream}>
        <meshStandardMaterial color="#8fe3ff" transparent opacity={0.55} roughness={0.05} depthWrite={false} />
      </mesh>
      {supports.map((p, i) => (
        <group key={i}>
          <Strut from={[p.x, 0, p.z]} to={[p.x, p.y - 0.02, p.z]} radius={0.06} color="#2a74d6" />
          <mesh position={[p.x, 0.05, p.z]}>
            <cylinderGeometry args={[0.15, 0.18, 0.1, 12]} />
            <meshStandardMaterial color="#c9c4b8" roughness={0.9} />
          </mesh>
        </group>
      ))}
      {/* A ring of spray where the flume meets the water. */}
      <mesh ref={splash} position={[end.x, WATER + 0.02, end.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.25, 0.4, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.5} depthWrite={false} />
      </mesh>
      {night
        ? Array.from({ length: 16 }, (_, i) => {
            const p = slideCurve.getPointAt(0.05 + (i / 16) * 0.9);
            return <Bulb key={`b${i}`} at={[p.x, p.y + RADIUS * 2 + 0.02, p.z]} night color={i % 2 ? '#8fe3ff' : '#ffd25e'} size={0.04} />;
          })
        : null}
      {night ? (
        <mesh position={[tx, top + 0.6, tz]}>
          <sphereGeometry args={[1.2, 12, 10]} />
          <meshBasicMaterial color="#2a74d6" transparent opacity={0.08} depthWrite={false} blending={AdditiveBlending} />
        </mesh>
      ) : null}
    </group>
  );
}
