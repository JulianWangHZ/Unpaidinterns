import { RoundedBox } from '@react-three/drei';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, Matrix4, type InstancedMesh } from 'three';
import { seeded } from '../../../lib/scenes/skyline.js';

const COLOURS = ['#ff5d7a', '#ffd23f', '#3fa7ff', '#4cd28a', '#b48cff', '#ff9f43'];
const SIZE = 1.3;
const WALL = 0.14;
const BALL = 0.05;
const INNER = SIZE / 2 - WALL;

interface Ball {
  x: number;
  y: number;
  z: number;
  color: string;
}

/** Balls packed in loose layers on a jittered grid, piling higher toward the middle, plus a few spilled outside. */
function packBalls(): Ball[] {
  const random = seeded(77);
  const step = BALL * 2.05;
  const per = Math.floor((INNER * 2) / step);
  const balls: Ball[] = [];
  for (let layer = 0; layer < 4; layer += 1) {
    for (let ix = 0; ix < per; ix += 1) {
      for (let iz = 0; iz < per; iz += 1) {
        const x = -INNER + BALL + ix * step + (layer % 2) * BALL + (random() - 0.5) * 0.02;
        const z = -INNER + BALL + iz * step + (layer % 2) * BALL + (random() - 0.5) * 0.02;
        if (Math.abs(x) > INNER - BALL || Math.abs(z) > INNER - BALL) continue;
        const centre = 1 - Math.max(Math.abs(x), Math.abs(z)) / INNER;
        if (layer >= 2 && random() > centre + (layer === 2 ? 0.45 : 0.1)) continue;
        balls.push({ x, z, y: BALL + layer * BALL * 1.7 + centre * 0.08 * random(), color: COLOURS[Math.floor(random() * COLOURS.length)] as string });
      }
    }
  }
  for (let i = 0; i < 7; i += 1) {
    const angle = random() * Math.PI * 2;
    const r = SIZE / 2 + 0.12 + random() * 0.25;
    balls.push({ x: Math.cos(angle) * r, z: Math.sin(angle) * r, y: BALL, color: COLOURS[i % COLOURS.length] as string });
  }
  return balls;
}

/** Padded ball pit on a soft mat. Balls are one instanced mesh. */
export function BallPit() {
  const mesh = useRef<InstancedMesh>(null);
  const balls = useMemo(packBalls, []);

  useLayoutEffect(() => {
    const target = mesh.current;
    if (!target) return;
    const matrix = new Matrix4();
    const color = new Color();
    balls.forEach((ball, i) => {
      target.setMatrixAt(i, matrix.makeTranslation(ball.x, ball.y, ball.z));
      target.setColorAt(i, color.set(ball.color));
    });
    target.instanceMatrix.needsUpdate = true;
    if (target.instanceColor) target.instanceColor.needsUpdate = true;
  }, [balls]);

  const half = SIZE / 2 - WALL / 2;
  return (
    <group>
      <RoundedBox args={[SIZE + 0.6, 0.04, SIZE + 0.6]} radius={0.02} smoothness={2} position={[0.1, 0.02, 0]} receiveShadow>
        <meshStandardMaterial color="#6fc3b2" roughness={1} />
      </RoundedBox>
      <mesh position={[0, 0.045, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[SIZE, SIZE]} />
        <meshStandardMaterial color="#4a52a0" />
      </mesh>
      {[
        { at: [0, 0.16, -half], size: [SIZE, 0.28, WALL], color: '#ff8fbf' },
        { at: [0, 0.16, half], size: [SIZE, 0.28, WALL], color: '#6f9dff' },
        { at: [-half, 0.16, 0], size: [WALL, 0.28, SIZE], color: '#ffd23f' },
        { at: [half, 0.16, 0], size: [WALL, 0.28, SIZE], color: '#4cd28a' },
      ].map((wall) => (
        <RoundedBox key={wall.color} args={wall.size as [number, number, number]} radius={0.065} smoothness={4} position={wall.at as [number, number, number]} castShadow>
          <meshStandardMaterial color={wall.color} roughness={0.9} />
        </RoundedBox>
      ))}
      <instancedMesh ref={mesh} args={[undefined, undefined, balls.length]} castShadow>
        <sphereGeometry args={[BALL, 14, 10]} />
        <meshPhysicalMaterial roughness={0.18} clearcoat={0.8} clearcoatRoughness={0.1} />
      </instancedMesh>
    </group>
  );
}
