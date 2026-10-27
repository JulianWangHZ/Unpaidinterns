import { useFrame } from '@react-three/fiber';
import { forwardRef, useMemo, useRef } from 'react';
import { ExtrudeGeometry, Shape, type Group, type MeshBasicMaterial } from 'three';
import type { CarModel } from '../../../lib/scenes/street.js';

type Point = [number, number];

interface Profile {
  length: number;
  width: number;
  /** Side outline of the painted body, front to the right (+x). */
  body: Point[];
  /** Side outline of the glass cabin that sits on the body. */
  glass: Point[];
  wheelbase: number;
}

/**
 * Side profiles in metres, one unit to a metre. Y is a fastback crossover, X is taller with an
 * upright tail, 3 is a low saloon with a separate boot.
 */
const PROFILES: Record<CarModel, Profile> = {
  y: {
    length: 4.75,
    width: 1.92,
    wheelbase: 2.89,
    body: [[-2.36, 0.3], [2.28, 0.3], [2.38, 0.5], [2.33, 0.74], [1.9, 0.86], [1.0, 0.98], [-1.9, 1.02], [-2.3, 0.95], [-2.4, 0.66]],
    glass: [[1.0, 0.97], [0.15, 1.52], [-0.9, 1.6], [-1.75, 1.42], [-2.22, 1.0]],
  },
  x: {
    length: 5.06,
    width: 2.0,
    wheelbase: 3.06,
    body: [[-2.5, 0.3], [2.42, 0.3], [2.53, 0.52], [2.47, 0.78], [2.0, 0.9], [1.1, 1.02], [-2.1, 1.08], [-2.46, 1.0], [-2.55, 0.68]],
    glass: [[1.1, 1.01], [0.2, 1.6], [-1.3, 1.68], [-2.05, 1.52], [-2.4, 1.05]],
  },
  '3': {
    length: 4.69,
    width: 1.85,
    wheelbase: 2.88,
    body: [[-2.32, 0.28], [2.27, 0.28], [2.36, 0.46], [2.3, 0.66], [1.85, 0.76], [0.95, 0.88], [-1.6, 0.94], [-2.25, 0.92], [-2.36, 0.6]],
    glass: [[0.95, 0.87], [0.1, 1.38], [-0.75, 1.44], [-1.65, 0.93]],
  },
};

const BEVEL = 0.09;

function extrude(points: Point[], width: number): ExtrudeGeometry {
  const shape = new Shape(points.map(([x, y]) => ({ x, y }) as never));
  const geometry = new ExtrudeGeometry(shape, {
    depth: width - BEVEL * 2,
    bevelEnabled: true,
    bevelSize: BEVEL,
    bevelThickness: BEVEL,
    bevelSegments: 3,
    curveSegments: 4,
  });
  geometry.translate(0, 0, -(width - BEVEL * 2) / 2);
  return geometry;
}

const geometries = new Map<CarModel, { body: ExtrudeGeometry; glass: ExtrudeGeometry }>();

/** Body and glass meshes are shared by every car of the same model. */
function carGeometry(model: CarModel) {
  const cached = geometries.get(model);
  if (cached) return cached;
  const profile = PROFILES[model];
  const made = { body: extrude(profile.body, profile.width), glass: extrude(profile.glass, profile.width - 0.42) };
  geometries.set(model, made);
  return made;
}

function Wheel({ x, z }: { x: number; z: number }) {
  const outward = Math.sign(z);
  return (
    <group position={[x, 0.35, z]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.26, 18]} />
        <meshStandardMaterial color="#17181c" roughness={0.9} />
      </mesh>
      {/* Aero wheel cover. */}
      <mesh position={[0, 0, outward * 0.135]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.01, 18]} />
        <meshStandardMaterial color="#9aa0aa" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

export interface CarProps {
  model: CarModel;
  color: string;
  night: boolean;
  /** Pulse the charge port green. */
  charging?: boolean;
  /** Throw a pool of headlight on the road ahead; for cars on the move at night. */
  beams?: boolean;
  position?: [number, number, number];
  rotation?: number;
}

/** A small electric car, front facing +x. Origin is on the ground under the middle of the car. */
export const Car = forwardRef<Group, CarProps>(function Car({ model, color, night, charging = false, beams = false, position, rotation = 0 }, ref) {
  const profile = PROFILES[model];
  const { body, glass } = carGeometry(model);
  const port = useRef<MeshBasicMaterial>(null);
  const halfW = profile.width / 2;
  const front = profile.length / 2;
  const axle = profile.wheelbase / 2;
  const lamp = night ? 1 : 0.6;

  useFrame(({ clock }) => {
    if (!port.current) return;
    // Tesla-style breathing green while charging.
    const level = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 2.4));
    port.current.color.setRGB(0.25 * level, level, 0.45 * level);
  });

  const lights = useMemo(
    () => [-1, 1].map((side) => ({ side, z: side * (halfW - 0.32) })),
    [halfW],
  );

  return (
    <group ref={ref} position={position} rotation={[0, rotation, 0]}>
      <mesh geometry={body} castShadow>
        <meshStandardMaterial color={color} metalness={0.55} roughness={0.32} />
      </mesh>
      <mesh geometry={glass}>
        <meshStandardMaterial color="#3a4658" metalness={0.4} roughness={0.08} />
      </mesh>
      {[-axle, axle].flatMap((x) => [-1, 1].map((side) => <Wheel key={`${x}${side}`} x={x} z={side * (halfW - 0.12)} />))}
      {lights.map(({ side, z }) => (
        <group key={side}>
          {/* Slim headlight and full-width-style tail light. */}
          <mesh position={[front - 0.04, 0.7, z]}>
            <boxGeometry args={[0.06, 0.06, 0.42]} />
            <meshBasicMaterial color={night ? '#fffbe8' : '#e8edf5'} toneMapped={false} />
          </mesh>
          <mesh position={[-front - 0.01, 0.84, z]}>
            <boxGeometry args={[0.06, 0.07, 0.5]} />
            <meshBasicMaterial color="#d3101e" toneMapped={false} transparent opacity={lamp} />
          </mesh>
          {/* Door mirror. */}
          <mesh position={[0.95, 1.02, side * (halfW + 0.06)]}>
            <boxGeometry args={[0.16, 0.1, 0.12]} />
            <meshStandardMaterial color={color} metalness={0.5} roughness={0.35} />
          </mesh>
        </group>
      ))}
      {charging ? (
        // Charge port on the rear left.
        <mesh position={[-front + 0.36, 0.9, -halfW - 0.005]}>
          <boxGeometry args={[0.14, 0.1, 0.02]} />
          <meshBasicMaterial ref={port} color="#4dff8a" toneMapped={false} />
        </mesh>
      ) : null}
      {beams ? (
        <mesh position={[front + 2.2, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[2.4, 1, 1]}>
          <circleGeometry args={[1, 24]} />
          <meshBasicMaterial color="#fff1c4" transparent opacity={0.22} depthWrite={false} toneMapped={false} />
        </mesh>
      ) : null}
    </group>
  );
});
