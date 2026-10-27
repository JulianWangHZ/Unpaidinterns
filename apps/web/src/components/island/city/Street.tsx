import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';
import { BUILDING } from '../../../lib/scenes/office.js';
import { CROSSING, LANES, LEVEL, lineRuns, LOT, STREET, TRAFFIC, trafficX, lampSpots, treeSpots } from '../../../lib/scenes/street.js';
import { Car } from './Car.js';
import { Planter, StreetLamp, Tree } from './StreetProps.js';

type Time = 'day' | 'night';

const PAINT = 0.005;

interface Band {
  x1: number;
  x2: number;
  z1: number;
  z2: number;
}

/** A raised slab of pavement with a darker kerb along its road edge. */
function Pavement({ x1, x2, z1, z2, night }: Band & { night: boolean }) {
  const height = LEVEL.walk - LEVEL.base;
  return (
    <mesh position={[(x1 + x2) / 2, LEVEL.base + height / 2, (z1 + z2) / 2]} receiveShadow>
      <boxGeometry args={[x2 - x1, height, z2 - z1]} />
      <meshStandardMaterial color={night ? '#4a4766' : '#c9cbd2'} roughness={0.95} />
    </mesh>
  );
}

function Stripe({ x, z, width, depth, color }: { x: number; z: number; width: number; depth: number; color: string }) {
  return (
    <mesh position={[x, LEVEL.road + PAINT, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, depth]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

/** Lane markings: double yellow down the middle and white edge lines, broken for the zebra crossing at the door. */
function Markings({ night }: { night: boolean }) {
  const { road } = STREET;
  const middle = (road.z1 + road.z2) / 2;
  const white = night ? '#b9bccb' : '#f4f5f7';
  const yellow = night ? '#c9a63a' : '#f2c230';
  const zebra = Array.from({ length: 7 }, (_, i) => road.z1 + 0.6 + i * 0.95);
  return (
    <group>
      {lineRuns().flatMap((run) => [
        <Stripe key={`y1${run.x}`} x={run.x} z={middle - 0.1} width={run.length} depth={0.09} color={yellow} />,
        <Stripe key={`y2${run.x}`} x={run.x} z={middle + 0.1} width={run.length} depth={0.09} color={yellow} />,
        <Stripe key={`w1${run.x}`} x={run.x} z={road.z1 + 0.25} width={run.length} depth={0.1} color={white} />,
        <Stripe key={`w2${run.x}`} x={run.x} z={road.z2 - 0.25} width={run.length} depth={0.1} color={white} />,
      ])}
      {zebra.map((z) => (
        <Stripe key={z} x={CROSSING.x} z={z} width={CROSSING.width} depth={0.5} color={white} />
      ))}
    </group>
  );
}

/** Cars driving both ways along the street, wrapping round off-screen. */
function Traffic({ night }: { night: boolean }) {
  const cars = useRef<Array<Group | null>>([]);
  useFrame(({ clock }) => {
    TRAFFIC.forEach((car, i) => {
      const mesh = cars.current[i];
      if (mesh) mesh.position.x = trafficX(car, clock.elapsedTime);
    });
  });
  return (
    <group>
      {TRAFFIC.map((car, i) => {
        const lane = LANES[car.lane];
        return (
          <Car
            key={i}
            ref={(mesh) => {
              cars.current[i] = mesh;
            }}
            model={car.model}
            color={car.color}
            night={night}
            beams={night}
            position={[trafficX(car, 0), LEVEL.road, lane.z]}
            rotation={lane.direction === 1 ? 0 : Math.PI}
          />
        );
      })}
    </group>
  );
}

/** The street in front of the office: pavements, road, markings, trees, lamps and traffic. */
export function Street({ time }: { time: Time }) {
  const night = time === 'night';
  const { nearWalk, road, farWalk, length } = STREET;
  const half = length / 2;
  const trees = useMemo(() => treeSpots(), []);
  const lamps = useMemo(() => lampSpots(), []);
  return (
    <group>
      <mesh position={[0, LEVEL.road - 0.03, (road.z1 + road.z2) / 2]} receiveShadow>
        <boxGeometry args={[length, 0.06, road.z2 - road.z1]} />
        <meshStandardMaterial color={night ? '#26243a' : '#5d606b'} roughness={0.95} />
      </mesh>
      {/* The near pavement stops where the lot opens onto the road. */}
      <Pavement x1={-half} x2={LOT.x1} z1={nearWalk.z1 - 4} z2={nearWalk.z2} night={night} />
      <Pavement x1={LOT.x2} x2={half} z1={nearWalk.z1 - 4} z2={nearWalk.z2} night={night} />
      <Pavement x1={-half} x2={half} z1={farWalk.z1} z2={farWalk.z2} night={night} />
      <Markings night={night} />
      {[-5.6, 5.6].map((x) => (
        <Planter key={x} x={x} z={BUILDING.front + 0.9} width={4.4} />
      ))}
      {/* Only low planters across the street from the office, so nothing tall stands in the view. */}
      {[-9, -3, 3, 9].map((x) => (
        <Planter key={`far${x}`} x={x} z={13.2} width={3.6} />
      ))}
      {trees.map(([x, z], i) => (
        <Tree key={`${x},${z}`} x={x} z={z} seed={i + 3} />
      ))}
      {lamps.map((lamp) => (
        <StreetLamp key={`${lamp.x},${lamp.z}`} {...lamp} night={night} />
      ))}
      <Traffic night={night} />
    </group>
  );
}
