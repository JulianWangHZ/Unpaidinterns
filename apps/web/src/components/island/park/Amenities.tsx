import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { CatmullRomCurve3, TubeGeometry, Vector3, type Group } from 'three';
import { BALLOON_CART, BENCHES, BINS, GATE, QUEUE_LANES, queueLines, queueSignSpot, type QueueLane as QueueLaneLayout } from '../../../lib/scenes/park-layout.js';
import type { Vec3 } from '../../../lib/scenes/types.js';
import { useCanvasTexture } from '../office/canvas-texture.js';
import { Bulb, CANDY, Strut } from './parts.js';
import { Bench } from './Stalls.js';

const BRASS = '#d9b45a';
const VELVET = '#b0102a';

/** A brass stanchion: heavy round base, slim post, ball finial. */
function Stanchion({ at }: { at: Vec3 }) {
  return (
    <group position={at}>
      <mesh position={[0, 0.025, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.15, 0.05, 16]} />
        <meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.05, 0.09, 0.06, 12]} />
        <meshStandardMaterial color={BRASS} metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0.48, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.8, 10]} />
        <meshStandardMaterial color={BRASS} metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.045, 12, 10]} />
        <meshStandardMaterial color={BRASS} metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  );
}

const ROPE_Y = 0.82;

/** A velvet rope hanging between two posts, with a brass clip at each end. */
function Rope({ from, to }: { from: Vec3; to: Vec3 }) {
  const geometry = useMemo(() => {
    const a = new Vector3(from[0], ROPE_Y, from[2]);
    const b = new Vector3(to[0], ROPE_Y, to[2]);
    const sag = Math.min(0.18, a.distanceTo(b) * 0.2);
    const middle = a.clone().add(b).multiplyScalar(0.5).add(new Vector3(0, -sag, 0));
    return new TubeGeometry(new CatmullRomCurve3([a, middle, b]), 14, 0.022, 6, false);
  }, [from, to]);
  const toward = new Vector3(to[0] - from[0], 0, to[2] - from[2]).normalize().multiplyScalar(0.035);
  return (
    <group>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial color={VELVET} roughness={0.85} />
      </mesh>
      {[
        [from[0] + toward.x, from[2] + toward.z],
        [to[0] - toward.x, to[2] - toward.z],
      ].map(([x, z]) => (
        <mesh key={`${x},${z}`} position={[x as number, ROPE_Y, z as number]}>
          <sphereGeometry args={[0.028, 8, 6]} />
          <meshStandardMaterial color={BRASS} metalness={0.9} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}

/** A switchback queue: stanchions along each line, every neighbouring pair joined by rope. */
export function QueueLane({ lane }: { lane: QueueLaneLayout }) {
  const lines = useMemo(() => queueLines(lane), [lane]);
  return (
    <group>
      {lines.map((posts, k) => (
        <group key={k}>
          {posts.map((at) => (
            <Stanchion key={`${at}`} at={at} />
          ))}
          {posts.slice(1).map((at, i) => (
            <Rope key={`${at}`} from={posts[i] as Vec3} to={at} />
          ))}
        </group>
      ))}
    </group>
  );
}

function drawRideSign(text: string, colour: string) {
  return (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.roundRect(4, 4, width - 8, height - 8, 22);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 52px "Baloo 2", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2 + 3);
  };
}

/** Name board on two posts at the entrance to a ride, lit by bulbs along its top at night. */
export function RideSign({ at, text, colour, turn = 0, night }: { at: Vec3; text: string; colour: string; turn?: number; night: boolean }) {
  const draw = useMemo(() => drawRideSign(text, colour), [text, colour]);
  const map = useCanvasTexture(512, 128, draw, `ride-sign:${text}`);
  return (
    <group position={at} rotation={[0, turn, 0]}>
      {[-0.8, 0.8].map((x) => (
        <Strut key={x} from={[x, 0, 0]} to={[x, 2.1, 0]} radius={0.04} color="#3b3f52" />
      ))}
      <mesh position={[0, 2.0, 0.03]}>
        <planeGeometry args={[1.9, 0.48]} />
        <meshBasicMaterial map={map} toneMapped={false} transparent />
      </mesh>
      {Array.from({ length: 7 }, (_, i) => (
        <Bulb key={i} at={[-0.78 + i * 0.26, 2.3, 0.04]} night={night} size={0.035} />
      ))}
    </group>
  );
}

/** Litter bin: a slatted drum with a dark lid. */
export function Bin({ at }: { at: Vec3 }) {
  return (
    <group position={at}>
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.2, 0.32, Math.sin(a) * 0.2]} rotation={[0, -a, 0]}>
            <boxGeometry args={[0.02, 0.6, 0.1]} />
            <meshStandardMaterial color="#2f6b4f" roughness={0.6} />
          </mesh>
        );
      })}
      <mesh position={[0, 0.66, 0]}>
        <cylinderGeometry args={[0.23, 0.22, 0.08, 16]} />
        <meshStandardMaterial color="#2f3446" metalness={0.4} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** Balloon seller's cart with a bunch of balloons swaying on their strings. */
export function BalloonCart({ at }: { at: Vec3 }) {
  const bunch = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (bunch.current) bunch.current.rotation.z = Math.sin(clock.elapsedTime * 0.9) * 0.06;
  });
  const balloons = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => {
        const a = i * 2.4;
        const r = 0.12 + (i % 3) * 0.12;
        return { top: [Math.cos(a) * r, 2.0 + (i % 4) * 0.18, Math.sin(a) * r] as Vec3, color: CANDY[i % CANDY.length] as string };
      }),
    [],
  );
  return (
    <group position={at}>
      <RoundedBox args={[0.7, 0.4, 0.45]} radius={0.06} smoothness={3} position={[0, 0.5, 0]} castShadow>
        <meshStandardMaterial color="#ffd25e" roughness={0.5} />
      </RoundedBox>
      {[-0.28, 0.28].map((x) => (
        <mesh key={x} position={[x, 0.18, 0.24]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.14, 0.035, 8, 16]} />
          <meshStandardMaterial color="#3b3f52" />
        </mesh>
      ))}
      <group ref={bunch} position={[0, 0.72, 0]}>
        {balloons.map(({ top, color }, i) => (
          <group key={i}>
            <Strut from={[0, 0, 0]} to={[top[0], top[1] - 0.95, top[2]]} radius={0.004} color="#f4f4f4" metal={false} />
            <mesh position={[top[0], top[1] - 0.72, top[2]]} scale={[1, 1.18, 1]} castShadow>
              <sphereGeometry args={[0.2, 16, 12]} />
              <meshStandardMaterial color={color} roughness={0.25} metalness={0.05} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/** String of bulbs sagging between two points, as hung between lamp posts over a path. */
export function Festoon({ from, to, night, sag = 0.5 }: { from: Vec3; to: Vec3; night: boolean; sag?: number }) {
  const { wire, bulbs } = useMemo(() => {
    const a = new Vector3(...from);
    const b = new Vector3(...to);
    const middle = a.clone().add(b).multiplyScalar(0.5).add(new Vector3(0, -sag, 0));
    const curve = new CatmullRomCurve3([a, middle, b]);
    return { wire: new TubeGeometry(curve, 24, 0.008, 4, false), bulbs: curve.getSpacedPoints(14).slice(1, -1) };
  }, [from, to, sag]);
  return (
    <group>
      <mesh geometry={wire}>
        <meshStandardMaterial color="#2f3446" />
      </mesh>
      {bulbs.map((p, i) => (
        <Bulb key={i} at={[p.x, p.y - 0.06, p.z]} night={night} color={CANDY[i % CANDY.length]} size={0.045} />
      ))}
    </group>
  );
}

/** Ticket kiosk by the gate: a small cabin with a window and a striped roof. */
export function TicketKiosk({ night }: { night: boolean }) {
  return (
    <group position={[GATE.x + GATE.width / 2 + 1.7, 0, GATE.z - 0.9]} rotation={[0, -0.25, 0]}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[1.3, 1.8, 1.1]} />
        <meshStandardMaterial color="#fff3dc" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.15, 0.56]}>
        <boxGeometry args={[0.8, 0.55, 0.02]} />
        <meshStandardMaterial color={night ? '#ffe2a8' : '#9fc6e8'} emissive={night ? '#ffcf8a' : '#000000'} emissiveIntensity={night ? 0.8 : 0} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.84, 0.62]}>
        <boxGeometry args={[0.9, 0.05, 0.16]} />
        <meshStandardMaterial color="#c99d76" />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[0, 2.0, 0]} castShadow>
          <coneGeometry args={[1.05, 0.55, 4, 1, false, (i / 8) * Math.PI * 2 + Math.PI / 4, Math.PI / 4]} />
          <meshStandardMaterial color={i % 2 ? '#ffffff' : '#ff5d6c'} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/** Pennant flag on a pole, fluttering. */
export function Flag({ at, colour }: { at: Vec3; colour: string }) {
  const cloth = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (cloth.current) cloth.current.rotation.y = Math.sin(clock.elapsedTime * 3 + at[0]) * 0.25;
  });
  return (
    <group position={at}>
      <Strut from={[0, 0, 0]} to={[0, 2.6, 0]} radius={0.025} color="#e9ecf5" />
      <group ref={cloth} position={[0, 2.45, 0]}>
        <mesh position={[0.3, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.16, 0.6, 3]} />
          <meshStandardMaterial color={colour} roughness={0.7} side={2} />
        </mesh>
      </group>
    </group>
  );
}

const SIGNED_QUEUES = [
  { lane: QUEUE_LANES.coaster, text: 'LOOP RUNNER', colour: '#e2384d' },
  { lane: QUEUE_LANES.wheel, text: 'SKY WHEEL', colour: '#ff6f91' },
  { lane: QUEUE_LANES.drop, text: 'FREE FALL', colour: '#7a5cff' },
] as const;

/** Small signposted extras round the rides: queues, name boards, bins, balloons, flags. */
export function Amenities({ night }: { night: boolean }) {
  return (
    <group>
      {/* Each ride has its own queue up to its gate, with its name board at the queue entrance. */}
      {SIGNED_QUEUES.map(({ lane, text, colour }) => (
        <group key={text}>
          <QueueLane lane={lane} />
          <RideSign at={queueSignSpot(lane)} text={text} colour={colour} turn={lane.facing} night={night} />
        </group>
      ))}
      <TicketKiosk night={night} />
      <BalloonCart at={BALLOON_CART} />
      {BENCHES.map(({ at, facing }) => (
        <group key={`${at}`} position={at} rotation={[0, facing, 0]}>
          <Bench />
        </group>
      ))}
      {BINS.map((at) => (
        <Bin key={`${at}`} at={at} />
      ))}
      {([[-12.6, 0, 10.6], [-6, 0, 10.6], [6.5, 0, 10.6], [16.6, 0, 10.6], [16.6, 0, 0], [-12.6, 0, 0]] as Vec3[]).map((at, i) => (
        <Flag key={`${at}`} at={at} colour={CANDY[i % CANDY.length] as string} />
      ))}
      <Festoon from={[-1.8, 2.5, 9.4]} to={[2.2, 2.5, 9.4]} night={night} />
      <Festoon from={[-3.6, 2.5, 4.6]} to={[-1.8, 2.5, 9.4]} night={night} sag={0.6} />
      <Festoon from={[2.2, 2.5, 9.4]} to={[6.4, 2.5, 3.4]} night={night} sag={0.7} />
      <Festoon from={[6.4, 2.5, 3.4]} to={[6.8, 2.5, -3.0]} night={night} sag={0.6} />
    </group>
  );
}
