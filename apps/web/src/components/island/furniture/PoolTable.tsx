import { RoundedBox } from '@react-three/drei';
import { useMemo } from 'react';
import { felt, woodGrain } from './surfaces.js';

const LENGTH = 1.9;
const WIDTH = 1.05;
const TOP = 0.62;
const RAIL = 0.09;
const BALLS = ['#ffd23f', '#3f6fc0', '#e0473f', '#7b3fa0', '#ff9f43', '#2f8f6d', '#8a2a2a', '#111111'];

/** Billiards table: carved wood frame and legs, green cloth, cushioned rails, six pockets, racked balls and a cue. */
export function PoolTable() {
  const wood = useMemo(() => woodGrain(), []);
  const cloth = useMemo(() => felt('#1f7a52'), []);
  const pockets = [-1, 0, 1].flatMap((x) => [-1, 1].map((z) => [x * (LENGTH / 2 - 0.02), z * (WIDTH / 2 - 0.02)] as const));
  const rack = useMemo(() => {
    const balls: Array<{ x: number; z: number; color: string }> = [];
    let n = 0;
    for (let row = 0; row < 4; row += 1) {
      for (let i = 0; i <= row; i += 1) {
        balls.push({ x: LENGTH * 0.22 + row * 0.052, z: (i - row / 2) * 0.06, color: BALLS[n % BALLS.length] as string });
        n += 1;
      }
    }
    return balls;
  }, []);
  return (
    <group>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <group key={`${sx}${sz}`} position={[sx * (LENGTH / 2 - 0.16), 0, sz * (WIDTH / 2 - 0.13)]}>
            <mesh position={[0, 0.27, 0]} castShadow>
              <cylinderGeometry args={[0.065, 0.05, 0.5, 12]} />
              <meshStandardMaterial map={wood} color="#8a5a3a" roughness={0.45} />
            </mesh>
            <mesh position={[0, 0.03, 0]}>
              <cylinderGeometry args={[0.07, 0.08, 0.06, 12]} />
              <meshStandardMaterial color="#c9a227" metalness={0.8} roughness={0.3} />
            </mesh>
          </group>
        )),
      )}
      <RoundedBox args={[LENGTH + 0.12, 0.14, WIDTH + 0.12]} radius={0.03} smoothness={3} position={[0, TOP - 0.07, 0]} castShadow receiveShadow>
        <meshStandardMaterial map={wood} color="#7a4a2a" roughness={0.4} />
      </RoundedBox>
      <mesh position={[0, TOP + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[LENGTH - RAIL, WIDTH - RAIL]} />
        <meshStandardMaterial map={cloth} roughness={1} />
      </mesh>
      {[
        { at: [0, -1], size: [LENGTH, WIDTH] },
        { at: [0, 1], size: [LENGTH, WIDTH] },
      ].map(({ at: [, sz] }) => (
        <mesh key={sz} position={[0, TOP + 0.03, (sz as number) * (WIDTH / 2 - RAIL / 4)]}>
          <boxGeometry args={[LENGTH - 0.12, 0.05, RAIL / 2]} />
          <meshStandardMaterial color="#17603f" roughness={0.9} />
        </mesh>
      ))}
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * (LENGTH / 2 - RAIL / 4), TOP + 0.03, 0]}>
          <boxGeometry args={[RAIL / 2, 0.05, WIDTH - 0.12]} />
          <meshStandardMaterial color="#17603f" roughness={0.9} />
        </mesh>
      ))}
      {/* Wood rail cap around the edge, with diamond sights. */}
      {[-1, 1].map((sz) => (
        <mesh key={`r${sz}`} position={[0, TOP + 0.06, sz * (WIDTH / 2 + 0.015)]} castShadow>
          <boxGeometry args={[LENGTH + 0.12, 0.03, 0.09]} />
          <meshStandardMaterial map={wood} color="#8a5a3a" roughness={0.35} />
        </mesh>
      ))}
      {[-1, 1].map((sx) => (
        <mesh key={`e${sx}`} position={[sx * (LENGTH / 2 + 0.015), TOP + 0.06, 0]} castShadow>
          <boxGeometry args={[0.09, 0.03, WIDTH + 0.12]} />
          <meshStandardMaterial map={wood} color="#8a5a3a" roughness={0.35} />
        </mesh>
      ))}
      {[-0.6, -0.3, 0.3, 0.6].flatMap((x) =>
        [-1, 1].map((sz) => (
          <mesh key={`${x}${sz}`} position={[x, TOP + 0.076, sz * (WIDTH / 2 + 0.015)]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
            <planeGeometry args={[0.014, 0.014]} />
            <meshStandardMaterial color="#f5efe0" />
          </mesh>
        )),
      )}
      {pockets.map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, TOP + 0.003, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.05, 20]} />
          <meshStandardMaterial color="#0b0b0b" />
        </mesh>
      ))}
      {rack.map((ball, i) => (
        <mesh key={i} position={[ball.x, TOP + 0.028, ball.z]} castShadow>
          <sphereGeometry args={[0.027, 16, 12]} />
          <meshPhysicalMaterial color={ball.color} roughness={0.12} clearcoat={1} />
        </mesh>
      ))}
      <mesh position={[-LENGTH * 0.25, TOP + 0.028, 0]} castShadow>
        <sphereGeometry args={[0.027, 16, 12]} />
        <meshPhysicalMaterial color="#fbfaf5" roughness={0.12} clearcoat={1} />
      </mesh>
      {/* Cue resting across the table. */}
      <mesh position={[-0.1, TOP + 0.08, 0.2]} rotation={[0, 0.25, Math.PI / 2 - 0.03]} castShadow>
        <cylinderGeometry args={[0.008, 0.014, 1.45, 10]} />
        <meshStandardMaterial map={wood} color="#d9b383" roughness={0.4} />
      </mesh>
      {/* Low-hanging lamp over the table. */}
      <group position={[0, 1.55, 0]}>
        <mesh>
          <boxGeometry args={[1.1, 0.1, 0.24]} />
          <meshStandardMaterial color="#1f5a40" roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.051, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.0, 0.18]} />
          <meshBasicMaterial color="#fff3cf" />
        </mesh>
        {[-0.4, 0.4].map((x) => (
          <mesh key={x} position={[x, 0.6, 0]}>
            <cylinderGeometry args={[0.004, 0.004, 1.1, 6]} />
            <meshStandardMaterial color="#2b2d3a" />
          </mesh>
        ))}
        <pointLight position={[0, -0.2, 0]} color="#fff0c8" intensity={1.6} distance={2.4} decay={2} />
      </group>
    </group>
  );
}
