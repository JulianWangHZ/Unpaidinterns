import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, CatmullRomCurve3, TubeGeometry, Vector3, type Group, type MeshBasicMaterial } from 'three';
import { STATION, STATION_CANOPY, STATION_POSTS } from '../../../lib/scenes/park-layout.js';
import { carPose, COASTER, coasterTrack, trackFrame } from '../../../lib/scenes/rides.js';
import { Bulb, Strut } from './parts.js';

const SAMPLES = 280;
const GAUGE = 0.3;
const UP = new Vector3(0, 1, 0);
const RED = '#e2384d';
const CAR = { width: COASTER.carWidth, length: COASTER.carLength, wall: 0.04, floor: 0.08, rim: COASTER.carHeight } as const;

/** The two running rails, the spine under them, and where the chain lift runs. */
function useTrack() {
  return useMemo(() => {
    const points = coasterTrack.getSpacedPoints(SAMPLES);
    const sides = points.map((_, i) => coasterTrack.getTangentAt(i / SAMPLES).cross(UP).normalize());
    const offset = (sign: number, lift = 0) =>
      new CatmullRomCurve3(points.map((p, i) => p.clone().addScaledVector(sides[i] as Vector3, sign * GAUGE).addScaledVector(UP, lift)), true);
    const tube = (curve: CatmullRomCurve3, radius: number) => new TubeGeometry(curve, SAMPLES, radius, 6, true);
    const lift = points.flatMap((p, i) => (coasterTrack.getTangentAt(i / SAMPLES).y > 0.25 ? [{ p, u: i / SAMPLES }] : []));
    // Bulbs along the outside of both rails, every few samples.
    const bulbs = points.flatMap((p, i) =>
      i % 4 === 0 ? [-1, 1].map((sign) => p.clone().addScaledVector(sides[i] as Vector3, sign * (GAUGE + 0.09)).addScaledVector(UP, -0.05)) : [],
    );
    return { points, left: tube(offset(-1), 0.045), right: tube(offset(1), 0.045), spine: tube(offset(0, -0.17), 0.08), lift, bulbs };
  }, []);
}

/**
 * One car: an open tub with two bucket seats side by side, headrests, and a lap bar for each rider.
 * Origin is on the track between the rails; +z is forward. Riders sit with their feet inside it.
 */
function Car({ lead }: { lead: boolean }) {
  const { width, length, wall, floor, rim } = CAR;
  const paint = <meshStandardMaterial color={RED} roughness={0.35} metalness={0.2} />;
  return (
    <group>
      <mesh position={[0, 0.08 + floor / 2, 0]} castShadow>
        <boxGeometry args={[width, floor, length]} />
        {paint}
      </mesh>
      {[-1, 1].map((side) => (
        <RoundedBox key={side} args={[wall, rim - 0.08, length]} radius={0.015} smoothness={2} position={[side * (width / 2 - wall / 2), 0.08 + (rim - 0.08) / 2, 0]} castShadow>
          {paint}
        </RoundedBox>
      ))}
      <RoundedBox args={[width, rim - 0.08, wall]} radius={0.015} smoothness={2} position={[0, 0.08 + (rim - 0.08) / 2, length / 2 - wall / 2]}>
        {paint}
      </RoundedBox>
      <RoundedBox args={[width, rim - 0.08, wall]} radius={0.015} smoothness={2} position={[0, 0.08 + (rim - 0.08) / 2, -length / 2 + wall / 2]}>
        {paint}
      </RoundedBox>
      {/* Bucket seats and tall headrests. */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * COASTER.seatX, 0, -0.05]}>
          <mesh position={[0, 0.17, -0.02]}>
            <boxGeometry args={[0.26, 0.06, 0.3]} />
            <meshStandardMaterial color="#23252f" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.42, -0.22]} rotation={[-0.12, 0, 0]}>
            <boxGeometry args={[0.26, 0.46, 0.06]} />
            <meshStandardMaterial color="#23252f" roughness={0.8} />
          </mesh>
          {/* Lap bar: a padded U hinged at the front, clear of the rider's thighs. */}
          <mesh position={[0, 0.36, 0.17]}>
            <boxGeometry args={[0.22, 0.04, 0.05]} />
            <meshStandardMaterial color="#ffd25e" roughness={0.5} />
          </mesh>
          {[-0.1, 0.1].map((x) => (
            <mesh key={x} position={[x, 0.28, 0.2]} rotation={[0.3, 0, 0]}>
              <boxGeometry args={[0.02, 0.18, 0.02]} />
              <meshStandardMaterial color="#c3c8d1" metalness={0.7} roughness={0.3} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Wheel bogies gripping each rail at the front and back. */}
      {[-1, 1].flatMap((side) =>
        [-0.3, 0.3].map((z) => (
          <group key={`${side},${z}`} position={[side * GAUGE, 0.02, z]}>
            <mesh>
              <boxGeometry args={[0.08, 0.1, 0.2]} />
              <meshStandardMaterial color="#3b3f52" metalness={0.5} roughness={0.4} />
            </mesh>
            <mesh position={[side * -0.05, 0.06, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.045, 0.045, 0.03, 12]} />
              <meshStandardMaterial color="#9aa0aa" metalness={0.6} roughness={0.3} />
            </mesh>
          </group>
        )),
      )}
      {lead ? (
        <mesh position={[0, 0.24, length / 2 + 0.1]} rotation={[Math.PI / 2, 0, 0]} scale={[1.3, 1, 0.8]}>
          <coneGeometry args={[0.28, 0.24, 16]} />
          <meshStandardMaterial color="#ffd25e" roughness={0.4} />
        </mesh>
      ) : null}
    </group>
  );
}

const GLOW_SPOTS = [0.05, 0.22, 0.38, 0.55, 0.72, 0.88];
const GLOW_COLOURS = ['#ff6f91', '#ffcf8a', '#8fb8ff', '#ff6f91', '#c9a8ff', '#ffcf8a'];
const CHASE = ['#ff5d6c', '#ffd25e', '#8fb8ff', '#9fe0b4'];

/** A rail bulb whose colour runs round the track in bands. */
function ChaseBulb({ at, index, count }: { at: [number, number, number]; index: number; count: number }) {
  const material = useRef<MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (!material.current) return;
    const band = Math.floor(((index / count) * 24 - clock.elapsedTime * 3) % CHASE.length + CHASE.length) % CHASE.length;
    material.current.color.set(CHASE[band] as string);
  });
  return (
    <group position={at}>
      <mesh>
        <sphereGeometry args={[0.05, 6, 5]} />
        <meshBasicMaterial ref={material} color="#ffd25e" toneMapped={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.14, 6, 5]} />
        <meshBasicMaterial color="#ffcf8a" transparent opacity={0.14} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Roller coaster: red rails on a dark spine, white supports, a chain lift, a station and a three-car train. */
export function Coaster({ night }: { night: boolean }) {
  const { points, left, right, spine, lift, bulbs } = useTrack();
  const cars = useRef<Array<Group | null>>([]);

  useFrame(({ clock }) => {
    cars.current.forEach((car, i) => {
      if (!car) return;
      const pose = carPose(i, clock.elapsedTime);
      car.position.copy(pose.position);
      car.quaternion.copy(pose.quaternion);
    });
  });

  const ties = points.filter((_, i) => i % 3 === 0);
  const supports = points.filter((p, i) => i % 10 === 0 && p.y > 0.5);
  const [sx, , sz] = STATION.from;
  const length = STATION.to[0] - sx;

  return (
    <group>
      <mesh geometry={left} castShadow>
        <meshStandardMaterial color={RED} metalness={0.4} roughness={0.35} />
      </mesh>
      <mesh geometry={right} castShadow>
        <meshStandardMaterial color={RED} metalness={0.4} roughness={0.35} />
      </mesh>
      <mesh geometry={spine}>
        <meshStandardMaterial color="#3b3f52" metalness={0.3} roughness={0.5} />
      </mesh>
      {ties.map((p, i) => (
        <mesh key={i} position={p} quaternion={trackFrame((i * 3) / SAMPLES)}>
          <boxGeometry args={[GAUGE * 2 + 0.1, 0.04, 0.08]} />
          <meshStandardMaterial color="#3b3f52" />
        </mesh>
      ))}
      {/* Chain lift: dark links running up the middle of the steep climb. */}
      {lift.map(({ p, u }, i) => (
        <mesh key={`c${i}`} position={p.clone().addScaledVector(UP, 0.03)} quaternion={trackFrame(u)}>
          <boxGeometry args={[0.06, 0.03, 0.09]} />
          <meshStandardMaterial color="#1e2029" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      {/* At night the track is outlined in lights, chasing round the circuit. */}
      {night
        ? bulbs.map((p, i) => <ChaseBulb key={`b${i}`} at={[p.x, p.y, p.z]} index={i} count={bulbs.length} />)
        : null}
      {night
        ? GLOW_SPOTS.map((u, i) => {
            const p = coasterTrack.getPointAt(u);
            return <pointLight key={`g${u}`} position={[p.x, Math.max(1.2, p.y - 0.8), p.z]} color={GLOW_COLOURS[i % GLOW_COLOURS.length]} intensity={9} distance={7} decay={1.5} />;
          })
        : null}
      {supports.map((p, i) => (
        <group key={i}>
          {night ? (
            <mesh position={[p.x, 0.03, p.z]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.55, 20]} />
              <meshBasicMaterial color="#ff8fb8" transparent opacity={0.25} depthWrite={false} toneMapped={false} />
            </mesh>
          ) : null}
          <Strut from={[p.x, 0, p.z]} to={[p.x, p.y - 0.22, p.z]} radius={0.07} color="#eef0f6" />
          <mesh position={[p.x, 0.06, p.z]}>
            <cylinderGeometry args={[0.18, 0.2, 0.12, 12]} />
            <meshStandardMaterial color="#c9c4b8" roughness={0.9} />
          </mesh>
        </group>
      ))}
      {/* Station: platform alongside the straight, railings, and a striped canopy with bulbs. */}
      <group position={[sx + length / 2, 0, sz]}>
        <mesh position={[0, 0.4, 1.0]} receiveShadow>
          <boxGeometry args={[length + 0.6, 0.8, 1.2]} />
          <meshStandardMaterial color="#d8d2e6" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.81, 0.45]}>
          <boxGeometry args={[length + 0.6, 0.02, 0.1]} />
          <meshStandardMaterial color="#ffd25e" />
        </mesh>
        <Strut from={[-length / 2 - 0.3, 1.7, 1.6]} to={[length / 2 + 0.3, 1.7, 1.6]} radius={0.03} color="#c3c8d1" />

        {Array.from({ length: 10 }, (_, i) => (
          <mesh key={i} position={[-length / 2 - 0.4 + (i + 0.5) * ((length + 0.8) / 10), STATION_CANOPY.bottom + 0.05, 0.3]} castShadow>
            <boxGeometry args={[(length + 0.8) / 10, 0.1, 3.0]} />
            <meshStandardMaterial color={i % 2 ? '#fff6ea' : RED} roughness={0.6} />
          </mesh>
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <Bulb key={i} at={[-length / 2 + (i * length) / 8, STATION_CANOPY.bottom - 0.06, -0.9]} night={night} size={0.05} />
        ))}
      </group>
      {STATION_POSTS.map(([x, , z]) => (
        <Strut key={`${x},${z}`} from={[x, 0, z]} to={[x, STATION_CANOPY.bottom + 0.1, z]} radius={0.06} color="#eef0f6" />
      ))}
      {Array.from({ length: COASTER.cars }, (_, i) => (
        <group
          key={i}
          ref={(car) => {
            cars.current[i] = car;
          }}
        >
          <Car lead={i === 0} />
        </group>
      ))}
    </group>
  );
}
