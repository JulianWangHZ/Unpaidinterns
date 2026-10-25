import { useFrame } from '@react-three/fiber';
import { useRef, type MutableRefObject } from 'react';
import type { Group } from 'three';
import type { Pose } from '../../lib/island/behavior.js';

const SKIN = '#ffe0c2';
const SEATED: ReadonlySet<Pose> = new Set(['think', 'type', 'typeSlow', 'slump']);

export interface Motion {
  walking: boolean;
}

interface FigureProps {
  color: string;
  pose: Pose;
  position?: [number, number, number];
  facing?: number;
  seated?: boolean;
  apron?: boolean;
  opacity?: number;
  scale?: number;
  still?: boolean;
  motion?: MutableRefObject<Motion>;
}

/** A clay figure: capsule body, round head, two arms. Each pose is a small loop driven by the clock. */
export function Figure({
  color,
  pose,
  position = [0, 0, 0],
  facing = 0,
  seated,
  apron,
  opacity = 1,
  scale = 1,
  still = false,
  motion,
}: FigureProps) {
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const head = useRef<Group>(null);
  const left = useRef<Group>(null);
  const right = useRef<Group>(null);
  const isSeated = seated ?? SEATED.has(pose);
  const seed = useRef(Math.random() * 10);

  useFrame(({ clock }) => {
    const [b, h, l, r, g] = [body.current, head.current, left.current, right.current, root.current];
    if (!b || !h || !l || !r || !g) return;
    const t = still ? 0 : clock.elapsedTime + seed.current;
    const walking = motion?.current.walking ?? false;
    b.position.y = isSeated && !walking ? -0.1 : 0;
    b.rotation.set(0, 0, 0);
    h.rotation.set(0, 0, 0);
    l.rotation.set(0, 0, 0);
    r.rotation.set(0, 0, 0);
    g.rotation.z = 0;
    g.position.y = 0;

    if (walking) {
      const swing = Math.sin(t * 10) * 0.6;
      l.rotation.x = swing;
      r.rotation.x = -swing;
      g.position.y = Math.abs(Math.sin(t * 10)) * 0.04;
      return;
    }
    switch (pose) {
      case 'type':
      case 'typeSlow': {
        const speed = pose === 'type' ? 18 : 7;
        l.rotation.x = -1.15 + Math.sin(t * speed) * 0.12;
        r.rotation.x = -1.15 + Math.sin(t * speed + Math.PI) * 0.12;
        break;
      }
      case 'think':
        r.rotation.x = -2.3;
        h.rotation.z = Math.sin(t * 1.5) * 0.12;
        break;
      case 'wave':
        r.rotation.z = 2.6 + Math.sin(t * 8) * 0.35;
        g.position.y = Math.abs(Math.sin(t * 4)) * 0.03;
        break;
      case 'slump':
        b.rotation.x = -0.5;
        h.rotation.x = -0.5;
        l.rotation.x = -1.4;
        r.rotation.x = -1.4;
        break;
      case 'sip':
        r.rotation.x = -1.4 - Math.max(0, Math.sin(t * 1.2)) * 0.9;
        break;
      case 'sing':
        r.rotation.x = -2.5;
        b.rotation.z = Math.sin(t * 3) * 0.12;
        break;
      case 'play':
        g.position.y = Math.abs(Math.sin(t * 5)) * 0.12;
        l.rotation.x = Math.sin(t * 5) * 0.8;
        r.rotation.x = -Math.sin(t * 5) * 0.8;
        break;
      case 'lounge':
        b.rotation.x = 0.35;
        b.position.y = -0.08;
        break;
      case 'workout':
        g.position.y = Math.abs(Math.sin(t * 10)) * 0.05;
        l.rotation.x = Math.sin(t * 10) * 0.9;
        r.rotation.x = -Math.sin(t * 10) * 0.9;
        break;
      case 'nap':
        g.rotation.z = Math.PI / 2;
        g.position.y = 0.2;
        break;
    }
  });

  const material = (tint: string) => (
    <meshStandardMaterial color={tint} roughness={0.55} transparent={opacity < 1} opacity={opacity} />
  );

  return (
    <group position={position} rotation={[0, facing, 0]} scale={scale}>
      <group ref={root}>
        <group ref={body}>
          <mesh position={[0, 0.32, 0]} castShadow>
            <capsuleGeometry args={[0.14, 0.2, 6, 16]} />
            {material(color)}
          </mesh>
          {apron ? (
            <mesh position={[0, 0.3, 0.13]}>
              <boxGeometry args={[0.18, 0.2, 0.02]} />
              {material('#ffffff')}
            </mesh>
          ) : null}
          <group ref={head} position={[0, 0.6, 0]}>
            <mesh position={[0, 0.08, 0]} castShadow>
              <sphereGeometry args={[0.13, 20, 16]} />
              {material(SKIN)}
            </mesh>
          </group>
          {[
            { ref: left, x: -0.17 },
            { ref: right, x: 0.17 },
          ].map(({ ref, x }) => (
            <group key={x} ref={ref} position={[x, 0.46, 0]}>
              <mesh position={[0, -0.1, 0]} castShadow>
                <capsuleGeometry args={[0.045, 0.12, 4, 8]} />
                {material(color)}
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}
