import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Group } from 'three';
import { CAROUSEL, horsePose } from '../../../lib/scenes/rides.js';
import { useCanvasTexture } from '../office/canvas-texture.js';
import { surfaces } from './materials.js';
import { Bulb, CANDY } from './parts.js';

const RADIUS = 1.75;
const ROOF_Y = 2.55;
const WEDGES = 16;
const GOLD = '#e6c35c';
const BODY = 0.13;
/** The pole passes through the horse's withers, in front of the saddle and the rider. */
const POLE_Z = 0.22;

/**
 * A carousel horse, front facing +z, with its back (the saddle) at y = 0. Sized so a seated
 * figure fits astride: the body is narrower than the rider's splayed legs.
 */
function Horse({ coat, saddle, mane }: { coat: string; saddle: string; mane: string }) {
  const leg = (x: number, z: number, bend: number) => (
    <group key={`${x},${z}`} position={[x, -BODY - 0.02, z]} rotation={[bend, 0, 0]}>
      <mesh position={[0, -0.13, 0]}>
        <capsuleGeometry args={[0.028, 0.2, 4, 8]} />
        <meshStandardMaterial color={coat} roughness={0.45} />
      </mesh>
      <mesh position={[0, -0.27, 0.02]}>
        <boxGeometry args={[0.06, 0.04, 0.07]} />
        <meshStandardMaterial color={GOLD} metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
  return (
    <group>
      <mesh position={[0, -BODY, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <capsuleGeometry args={[BODY, 0.36, 6, 14]} />
        <meshStandardMaterial color={coat} roughness={0.45} />
      </mesh>
      {/* Neck sweeping up and forward, then the head with ears and a gold bridle. */}
      <mesh position={[0, 0.04, 0.27]} rotation={[0.55, 0, 0]} castShadow>
        <capsuleGeometry args={[0.065, 0.2, 4, 10]} />
        <meshStandardMaterial color={coat} roughness={0.45} />
      </mesh>
      <group position={[0, 0.2, 0.36]} rotation={[0.35, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.1, 0.11, 0.24]} />
          <meshStandardMaterial color={coat} roughness={0.45} />
        </mesh>
        <mesh position={[0, -0.02, 0.1]}>
          <boxGeometry args={[0.11, 0.03, 0.03]} />
          <meshStandardMaterial color={GOLD} metalness={0.7} roughness={0.3} />
        </mesh>
        {[-0.03, 0.03].map((x) => (
          <mesh key={x} position={[x, 0.08, -0.06]}>
            <coneGeometry args={[0.02, 0.07, 6]} />
            <meshStandardMaterial color={coat} roughness={0.45} />
          </mesh>
        ))}
        {[-0.052, 0.052].map((x) => (
          <mesh key={`e${x}`} position={[x, 0.02, 0.02]}>
            <sphereGeometry args={[0.012, 6, 5]} />
            <meshStandardMaterial color="#1b1b22" />
          </mesh>
        ))}
      </group>
      {/* Mane along the top of the neck. */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, 0.08 + i * 0.045, 0.2 + i * 0.035]} rotation={[0.55, 0, 0]}>
          <boxGeometry args={[0.03, 0.06, 0.05]} />
          <meshStandardMaterial color={mane} roughness={0.8} />
        </mesh>
      ))}
      {/* Saddle blanket and seat, sitting on the back so the rider rests on it. */}
      <mesh position={[0, -0.03, -0.04]}>
        <boxGeometry args={[0.28, 0.06, 0.26]} />
        <meshStandardMaterial color={saddle} roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.01, -0.04]}>
        <boxGeometry args={[0.18, 0.04, 0.2]} />
        <meshStandardMaterial color="#7a3b2a" roughness={0.5} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.2, -0.24, -0.02]}>
          <torusGeometry args={[0.03, 0.008, 6, 12]} />
          <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.25} />
        </mesh>
      ))}
      <mesh position={[0, -0.12, -0.3]} rotation={[-0.7, 0, 0]}>
        <coneGeometry args={[0.045, 0.24, 8]} />
        <meshStandardMaterial color={mane} roughness={0.8} />
      </mesh>
      {/* Galloping legs: front pair reaching forward, back pair pushing off. */}
      {leg(-0.07, 0.14, -0.6)}
      {leg(0.07, 0.14, -0.35)}
      {leg(-0.07, -0.16, 0.45)}
      {leg(0.07, -0.16, 0.25)}
    </group>
  );
}

function drawRoundingBoard(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = '#fff3dc';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#e6c35c';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, width - 8, height - 8);
  // A row of painted roundels between gold scrolls.
  for (let i = 0; i < 4; i += 1) {
    const x = (i + 0.5) * (width / 4);
    ctx.fillStyle = CANDY[i % CANDY.length] as string;
    ctx.beginPath();
    ctx.arc(x, height / 2, height * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e6c35c';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x - height * 0.08, height / 2 - height * 0.08, height * 0.07, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Merry-go-round. The turntable, poles and horses all follow the shared ride timing, so riders
 * placed from the same timing sit exactly on their horses.
 */
export function Carousel({ night }: { night: boolean }) {
  const turntable = useRef<Group>(null);
  const horses = useRef<Array<Group | null>>([]);
  const deck = useMemo(() => surfaces.deck(3, 3), []);
  const board = useCanvasTexture(512, 96, drawRoundingBoard, 'carousel-board');

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (turntable.current) turntable.current.rotation.y = -t * CAROUSEL.spin;
    horses.current.forEach((horse, i) => {
      if (!horse) return;
      const pose = horsePose(i, t);
      horse.position.copy(pose.position);
      horse.quaternion.copy(pose.quaternion);
    });
  });

  return (
    <group>
      {/* Base with a step all round. */}
      <mesh position={[0, 0.07, 0]} receiveShadow>
        <cylinderGeometry args={[RADIUS + 0.35, RADIUS + 0.4, 0.14, 48]} />
        <meshStandardMaterial color="#e8dcc8" roughness={0.9} />
      </mesh>
      <group ref={turntable}>
        <mesh position={[0, CAROUSEL.deck - 0.07, 0]} receiveShadow>
          <cylinderGeometry args={[RADIUS, RADIUS, 0.14, 48]} />
          <meshStandardMaterial {...deck} roughness={1} />
        </mesh>
        <mesh position={[0, CAROUSEL.deck - 0.07, 0]}>
          <torusGeometry args={[RADIUS, 0.04, 8, 64]} />
          <meshStandardMaterial color={GOLD} metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Centre drum: mirrors and gold panels, then the column up to the roof. */}
        <mesh position={[0, ROOF_Y / 2 + 0.1, 0]}>
          <cylinderGeometry args={[0.3, 0.34, ROOF_Y, 16]} />
          <meshStandardMaterial color="#ffd25e" metalness={0.3} roughness={0.4} />
        </mesh>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <mesh key={`m${i}`} position={[Math.cos(a) * 0.55, 1.3, Math.sin(a) * 0.55]} rotation={[0, -a + Math.PI / 2, 0]}>
              <boxGeometry args={[0.27, 1.0, 0.03]} />
              <meshStandardMaterial color={i % 2 ? '#cfe6ff' : '#ffd25e'} metalness={i % 2 ? 0.9 : 0.5} roughness={i % 2 ? 0.08 : 0.35} />
            </mesh>
          );
        })}
        {/* Striped roof, a rounding board with painted roundels, and a gold crown on top. */}
        {Array.from({ length: WEDGES }, (_, i) => (
          <mesh key={i} position={[0, ROOF_Y + 0.5, 0]} castShadow>
            <coneGeometry args={[RADIUS + 0.35, 1.0, 4, 1, false, (i / WEDGES) * Math.PI * 2, (Math.PI * 2) / WEDGES]} />
            <meshStandardMaterial color={i % 2 ? '#fff6ea' : '#ff5d6c'} roughness={0.6} />
          </mesh>
        ))}
        <mesh position={[0, ROOF_Y - 0.1, 0]}>
          <cylinderGeometry args={[RADIUS + 0.36, RADIUS + 0.36, 0.34, 48, 1, true]} />
          <meshStandardMaterial map={board} side={2} roughness={0.6} />
        </mesh>
        {Array.from({ length: WEDGES }, (_, i) => {
          const a = ((i + 0.5) / WEDGES) * Math.PI * 2;
          return (
            <mesh key={`s${i}`} position={[Math.cos(a) * (RADIUS + 0.36), ROOF_Y - 0.31, Math.sin(a) * (RADIUS + 0.36)]} rotation={[0, -a, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.02, 12, 1, false, 0, Math.PI]} />
              <meshStandardMaterial color={i % 2 ? '#ffd25e' : '#ff5d6c'} side={2} />
            </mesh>
          );
        })}
        {Array.from({ length: 32 }, (_, i) => {
          const a = (i / 32) * Math.PI * 2;
          return <Bulb key={i} at={[Math.cos(a) * (RADIUS + 0.38), ROOF_Y + 0.07, Math.sin(a) * (RADIUS + 0.38)]} night={night} size={0.04} />;
        })}
          <mesh position={[0, ROOF_Y + 1.05, 0]}>
            <cylinderGeometry args={[0.16, 0.24, 0.2, 12]} />
            <meshStandardMaterial color={GOLD} metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, ROOF_Y + 1.25, 0]}>
            <sphereGeometry args={[0.13, 14, 12]} />
            <meshStandardMaterial color={GOLD} metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0.11, ROOF_Y + 1.5, 0]}>
            <planeGeometry args={[0.22, 0.13]} />
            <meshStandardMaterial color="#ff5d6c" side={2} />
          </mesh>
          <mesh position={[0, ROOF_Y + 1.45, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.3, 6]} />
            <meshStandardMaterial color={GOLD} metalness={0.6} />
          </mesh>
      </group>
      {/* Horses and their brass poles move with the shared timing rather than the turntable. */}
      {Array.from({ length: CAROUSEL.horses }, (_, i) => (
        <group
          key={i}
          ref={(horse) => {
            horses.current[i] = horse;
          }}
        >
          <Horse coat={i % 2 ? '#fff6ea' : '#f2e2c8'} saddle={CANDY[i % CANDY.length] as string} mane={i % 3 ? '#c9905f' : '#6b4a33'} />
          <mesh position={[0, ROOF_Y / 2 - CAROUSEL.saddle + 0.1, POLE_Z]}>
            <cylinderGeometry args={[0.022, 0.022, ROOF_Y + 0.4, 8]} />
            <meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.2} />
          </mesh>
        </group>
      ))}
      {night ? <pointLight position={[0, ROOF_Y - 0.5, 0]} color="#ffcf8a" intensity={7} distance={7} decay={1.6} /> : null}
    </group>
  );
}
