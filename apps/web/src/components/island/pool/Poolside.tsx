import { RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, type Group, type Mesh, type MeshBasicMaterial } from 'three';
import { BAR, barStool, CABANA, HOT_TUB, LOUNGERS } from '../../../lib/scenes/pool-layout.js';
import { seeded } from '../../../lib/scenes/skyline.js';
import { useCanvasTexture } from '../office/canvas-texture.js';
import { surfaces } from '../park/materials.js';
import { Bulb, CANDY, Strut } from '../park/parts.js';

const TEAK = '#a8774f';
const THATCH = '#c9a46a';
const WHITE = '#fbf8f2';

/** Tiki torch: a bamboo pole with a flame that flickers at night. */
export function TikiTorch({ at, night }: { at: [number, number, number]; night: boolean }) {
  const flame = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (!flame.current) return;
    const t = clock.elapsedTime * 9 + at[0] * 3;
    flame.current.scale.set(1 + Math.sin(t) * 0.12, 1 + Math.sin(t * 1.3) * 0.2, 1 + Math.cos(t) * 0.12);
  });
  return (
    <group position={at}>
      <Strut from={[0, 0, 0]} to={[0, 1.6, 0]} radius={0.035} color="#b98a52" metal={false} />
      <mesh position={[0, 1.66, 0]}>
        <cylinderGeometry args={[0.07, 0.05, 0.16, 8]} />
        <meshStandardMaterial color="#3b3f52" metalness={0.5} />
      </mesh>
      {night ? (
        <>
          <mesh ref={flame} position={[0, 1.84, 0]}>
            <coneGeometry args={[0.07, 0.22, 8]} />
            <meshBasicMaterial color="#ffb347" toneMapped={false} />
          </mesh>
          <mesh position={[0, 1.84, 0]}>
            <sphereGeometry args={[0.22, 8, 6]} />
            <meshBasicMaterial color="#ff8a3d" transparent opacity={0.2} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
          </mesh>
          <pointLight position={[0, 1.9, 0]} color="#ffaa55" intensity={3} distance={4} decay={1.6} />
        </>
      ) : null}
    </group>
  );
}

function drawBarSign(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = '#6b4226';
  ctx.beginPath();
  ctx.roundRect(4, 4, width - 8, height - 8, 18);
  ctx.fill();
  ctx.strokeStyle = '#f2d39b';
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.fillStyle = '#ffe2a8';
  ctx.font = '800 58px "Baloo 2", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TIKI BAR', width / 2, height / 2 + 3);
}

/** Bar stool with a round cushioned seat whose top is at the height the scene seats people at. */
function Stool() {
  return (
    <group>
      <Strut from={[0, 0, 0]} to={[0, 0.6, 0]} radius={0.03} color="#c3c8d1" />
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.16, 0.18, 0.04, 14]} />
        <meshStandardMaterial color="#9aa0aa" metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.12, 0.012, 6, 16]} />
        <meshStandardMaterial color="#c3c8d1" metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.63, 0]}>
        <cylinderGeometry args={[0.18, 0.17, 0.06, 16]} />
        <meshStandardMaterial color="#e8364d" roughness={0.6} />
      </mesh>
    </group>
  );
}

/** Thatched tiki bar: bamboo posts, a teak counter, a back shelf of bottles, stools and string lights. */
export function TikiBar({ night }: { night: boolean }) {
  const sign = useCanvasTexture(512, 128, drawBarSign, 'tiki-sign');
  const deck = useMemo(() => surfaces.deck(1.5, 0.4), []);
  const length = BAR.length;
  const bottles = useMemo(() => {
    const random = seeded(301);
    return Array.from({ length: 14 }, (_, i) => ({ x: -length / 2 + 0.3 + i * ((length - 0.6) / 13), h: 0.18 + random() * 0.12, colour: CANDY[Math.floor(random() * CANDY.length)] as string }));
  }, [length]);
  return (
    <group>
      {/* Counter: front panel of bamboo, teak top overhanging the stools. */}
      <mesh position={[0, 0.5, 0.2]} castShadow>
        <boxGeometry args={[length, 1.0, 0.5]} />
        <meshStandardMaterial color="#8a6040" roughness={0.9} />
      </mesh>
      {Array.from({ length: Math.round(length / 0.12) }, (_, i) => (
        <mesh key={i} position={[-length / 2 + 0.06 + i * 0.12, 0.5, 0.46]}>
          <cylinderGeometry args={[0.05, 0.05, 0.98, 8]} />
          <meshStandardMaterial color={i % 2 ? '#c9a46a' : '#b8935a'} roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 1.04, 0.3]} castShadow>
        <boxGeometry args={[length + 0.2, 0.08, 0.72]} />
        <meshStandardMaterial {...deck} roughness={1} />
      </mesh>
      {/* Back shelf with bottles. */}
      <mesh position={[0, 0.9, -0.55]}>
        <boxGeometry args={[length, 1.8, 0.3]} />
        <meshStandardMaterial color="#6b4226" roughness={0.9} />
      </mesh>
      {bottles.map(({ x, h, colour }) => (
        <mesh key={x} position={[x, 1.25 + h / 2, -0.36]}>
          <cylinderGeometry args={[0.04, 0.045, h, 8]} />
          <meshStandardMaterial color={colour} transparent opacity={0.85} roughness={0.15} />
        </mesh>
      ))}
      {/* Bamboo posts and the thatched roof. */}
      {[-1, 1].flatMap((sx) =>
        [-0.75, 0.75].map((z) => <Strut key={`${sx},${z}`} from={[(sx * (length + 0.1)) / 2, 0, z]} to={[(sx * (length + 0.1)) / 2, 2.4, z]} radius={0.07} color="#b98a52" metal={false} />),
      )}
      <mesh position={[0, 2.62, 0]} rotation={[0, Math.PI / 4, 0]} scale={[(length + 1.4) / 2, 1, 1.25]} castShadow>
        <coneGeometry args={[1.42, 0.7, 4]} />
        <meshStandardMaterial color={THATCH} roughness={1} flatShading />
      </mesh>
      {/* Fringe of straw hanging off the eaves. */}
      {Array.from({ length: 40 }, (_, i) => {
        const along = (i % 20) / 19 - 0.5;
        const front = i < 20 ? 1 : -1;
        return (
          <mesh key={`f${i}`} position={[along * (length + 1.2), 2.24, front * 1.0]}>
            <boxGeometry args={[0.1, 0.22, 0.02]} />
            <meshStandardMaterial color={i % 3 ? THATCH : '#b8935a'} roughness={1} />
          </mesh>
        );
      })}
      <mesh position={[0, 2.12, 0.98]}>
        <planeGeometry args={[1.3, 0.32]} />
        <meshBasicMaterial map={sign} toneMapped={false} transparent />
      </mesh>
      {Array.from({ length: BAR.stools }, (_, i) => {
        const [x, , z] = barStool(i);
        return (
          <group key={`s${i}`} position={[x, 0, z]}>
            <Stool />
          </group>
        );
      })}
      {Array.from({ length: 12 }, (_, i) => (
        <Bulb key={`b${i}`} at={[-length / 2 + i * (length / 11), 2.2 - Math.sin((i / 11) * Math.PI) * 0.12, 1.05]} night={night} color={CANDY[i % CANDY.length]} size={0.04} />
      ))}
      <TikiTorch at={[-length / 2 - 0.5, 0, 1.0]} night={night} />
      <TikiTorch at={[length / 2 + 0.5, 0, 1.0]} night={night} />
      {night ? <pointLight position={[0, 1.8, 0.6]} color="#ffbf73" intensity={8} distance={6} decay={1.5} /> : null}
    </group>
  );
}

/** Raised round hot tub: stone surround, mosaic inside, bench ring, steps, and water that bubbles. */
export function HotTub({ night }: { night: boolean }) {
  const bubbles = useRef<Group>(null);
  const tiles = useMemo(() => surfaces.mosaic('#4fb6dd', 6, 1), []);
  const { radius, rim, water, bench, floor } = HOT_TUB;
  const spots = useMemo(() => {
    const random = seeded(77);
    return Array.from({ length: 24 }, () => {
      const a = random() * Math.PI * 2;
      const r = Math.sqrt(random()) * (radius - 0.2);
      return { x: Math.cos(a) * r, z: Math.sin(a) * r, phase: random() * 10 };
    });
  }, [radius]);
  useFrame(({ clock }) => {
    bubbles.current?.children.forEach((bubble, i) => {
      const spot = spots[i];
      if (!spot) return;
      const t = (clock.elapsedTime * 0.8 + spot.phase) % 1;
      bubble.position.set(spot.x, water + 0.01 + t * 0.03, spot.z);
      bubble.scale.setScalar(0.4 + t);
    });
  });
  return (
    <group>
      {/* Stone surround with a flat lip to sit on. */}
      <mesh position={[0, rim / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius + 0.25, radius + 0.3, rim, 40, 1, true]} />
        <meshStandardMaterial color={night ? '#a7a2c4' : '#efe6d6'} roughness={0.9} side={2} />
      </mesh>
      <mesh position={[0, rim, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius, radius + 0.26, 40]} />
        <meshStandardMaterial color={night ? '#bdb8d8' : '#faf6ee'} roughness={0.7} />
      </mesh>
      <mesh position={[0, (rim + floor) / 2, 0]}>
        <cylinderGeometry args={[radius, radius, rim - floor, 40, 1, true]} />
        <meshStandardMaterial {...tiles} side={1} roughness={1} />
      </mesh>
      <mesh position={[0, floor, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 40]} />
        <meshStandardMaterial {...tiles} roughness={1} />
      </mesh>
      {/* Bench ring round the inside wall: seat top at the bathers' seat height. */}
      <mesh position={[0, (bench + floor) / 2, 0]}>
        <cylinderGeometry args={[radius - 0.02, radius - 0.02, bench - floor, 40, 1, true]} />
        <meshStandardMaterial color="#3a9cc8" side={2} />
      </mesh>
      <mesh position={[0, bench, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - 0.42, radius, 40]} />
        <meshStandardMaterial color="#5cc6e6" roughness={0.4} side={2} />
      </mesh>
      <mesh position={[0, water, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius, 40]} />
        <meshPhysicalMaterial color={night ? '#2fb8e8' : '#7fd8f2'} transparent opacity={0.5} roughness={0.05} clearcoat={1} depthWrite={false} />
      </mesh>
      <group ref={bubbles}>
        {spots.map((spot, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.035, 6, 5]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.7} />
          </mesh>
        ))}
      </group>
      {/* Two steps up the outside and a grab rail. */}
      {[0, 1].map((i) => (
        <mesh key={i} position={[0, 0.11 + i * 0.22, radius + 0.55 - i * 0.2]} castShadow>
          <boxGeometry args={[0.8, 0.22 + i * 0.22, 0.3]} />
          <meshStandardMaterial color={night ? '#a7a2c4' : '#efe6d6'} roughness={0.9} />
        </mesh>
      ))}
      <Strut from={[0.45, 0, radius + 0.7]} to={[0.45, rim + 0.6, radius + 0.15]} radius={0.025} color="#e6eaf0" />
      {night ? (
        <>
          <pointLight position={[0, water - 0.2, 0]} color="#5fe0ff" intensity={6} distance={4} decay={1.5} />
          <mesh position={[0, water + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[radius, 40]} />
            <meshBasicMaterial color="#2fc2ff" transparent opacity={0.25} depthWrite={false} blending={AdditiveBlending} toneMapped={false} />
          </mesh>
        </>
      ) : null}
    </group>
  );
}

/** Lounger: frame, slats, cushion with the back raised behind the sitter, and a folded towel. */
function Lounger({ towel }: { towel: string }) {
  return (
    <group>
      {[-0.27, 0.27].flatMap((x) =>
        [-0.6, 0.85].map((z) => (
          <mesh key={`${x},${z}`} position={[x, 0.12, z]}>
            <boxGeometry args={[0.05, 0.24, 0.05]} />
            <meshStandardMaterial color={WHITE} />
          </mesh>
        )),
      )}
      <mesh position={[0, 0.25, 0.4]}>
        <boxGeometry args={[0.62, 0.05, 1.1]} />
        <meshStandardMaterial color={TEAK} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.31, 0.4]}>
        <boxGeometry args={[0.56, 0.07, 1.06]} />
        <meshStandardMaterial color={WHITE} roughness={0.9} />
      </mesh>
      {/* Backrest raised behind the hips. */}
      <group position={[0, 0.28, -0.08]} rotation={[0.85, 0, 0]}>
        <mesh position={[0, 0, -0.33]}>
          <boxGeometry args={[0.62, 0.05, 0.7]} />
          <meshStandardMaterial color={TEAK} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.06, -0.33]}>
          <boxGeometry args={[0.56, 0.07, 0.66]} />
          <meshStandardMaterial color={WHITE} roughness={0.9} />
        </mesh>
      </group>
      <mesh position={[0, 0.37, 0.75]}>
        <boxGeometry args={[0.4, 0.05, 0.28]} />
        <meshStandardMaterial color={towel} roughness={1} />
      </mesh>
    </group>
  );
}

/** Sun umbrella with a fringed canopy. */
function Umbrella({ colour }: { colour: string }) {
  return (
    <group>
      <Strut from={[0, 0, 0]} to={[0, 2.2, 0]} radius={0.025} color="#e6eaf0" />
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[0, 2.2, 0]} castShadow>
          <coneGeometry args={[1.0, 0.36, 4, 1, true, (i / 8) * Math.PI * 2, Math.PI / 4]} />
          <meshStandardMaterial color={i % 2 ? WHITE : colour} side={2} />
        </mesh>
      ))}
    </group>
  );
}

/** A row of loungers facing the sea, with umbrellas and small side tables between them. */
export function LoungerRow() {
  const half = (LOUNGERS.count - 1) / 2;
  return (
    <group>
      {Array.from({ length: LOUNGERS.count }, (_, i) => (
        <group key={i} position={[(i - half) * LOUNGERS.gap, 0, 0]}>
          <Lounger towel={CANDY[i % CANDY.length] as string} />
        </group>
      ))}
      {Array.from({ length: Math.floor(LOUNGERS.count / 2) }, (_, i) => (
        <group key={`u${i}`} position={[(i * 2 + 0.5 - half) * LOUNGERS.gap, 0, -0.75]}>
          <Umbrella colour={i % 2 ? '#2a74d6' : '#e8364d'} />
          <mesh position={[0, 0.25, 0.55]}>
            <cylinderGeometry args={[0.16, 0.16, 0.04, 14]} />
            <meshStandardMaterial color={WHITE} />
          </mesh>
          <Strut from={[0, 0, 0.55]} to={[0, 0.24, 0.55]} radius={0.02} color="#c3c8d1" />
        </group>
      ))}
    </group>
  );
}

/** Two loungers under one umbrella, for a quieter nap spot. */
export function LoungerPair() {
  return (
    <group>
      {[-0.6, 0.6].map((x, i) => (
        <group key={x} position={[x, 0, 0]}>
          <Lounger towel={i ? '#ffd25e' : '#4fc3ea'} />
        </group>
      ))}
      <group position={[0, 0, -0.8]}>
        <Umbrella colour="#ffb347" />
      </group>
    </group>
  );
}

/** White cabana: posts, a canopy with a scalloped valance, curtains tied back, and a cushioned daybed. */
export function Cabana() {
  const curtain = useRef<Group>(null);
  useFrame(({ clock }) => {
    curtain.current?.children.forEach((panel, i) => {
      panel.rotation.y = Math.sin(clock.elapsedTime * 1.2 + i) * 0.06;
    });
  });
  const { width, depth } = CABANA;
  return (
    <group>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => <Strut key={`${sx},${sz}`} from={[(sx * width) / 2, 0, (sz * depth) / 2]} to={[(sx * width) / 2, 2.3, (sz * depth) / 2]} radius={0.05} color={WHITE} metal={false} />),
      )}
      <mesh position={[0, 2.38, 0]} castShadow>
        <boxGeometry args={[width + 0.2, 0.12, depth + 0.2]} />
        <meshStandardMaterial color={WHITE} roughness={0.9} />
      </mesh>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} position={[-width / 2 + (i + 0.5) * (width / 10), 2.27, depth / 2 + 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[width / 20, width / 20, 0.01, 12, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#4fc3ea" side={2} />
        </mesh>
      ))}
      <group ref={curtain}>
        {[-1, 1].map((sx) => (
          <mesh key={sx} position={[(sx * width) / 2 - sx * 0.12, 1.2, depth / 2]}>
            <boxGeometry args={[0.24, 2.1, 0.04]} />
            <meshStandardMaterial color="#ffffff" roughness={1} transparent opacity={0.9} />
          </mesh>
        ))}
      </group>
      <mesh position={[0, 1.2, -depth / 2]}>
        <boxGeometry args={[width, 2.1, 0.03]} />
        <meshStandardMaterial color="#ffffff" roughness={1} transparent opacity={0.75} />
      </mesh>
      {/* Daybed: teak base and a thick cushion whose top is the seat height, with bolsters. */}
      <mesh position={[0, 0.2, 0.05]} castShadow>
        <boxGeometry args={[width - 0.2, 0.4, depth - 0.3]} />
        <meshStandardMaterial color={TEAK} roughness={0.8} />
      </mesh>
      <RoundedBox args={[width - 0.26, 0.12, depth - 0.36]} radius={0.04} smoothness={2} position={[0, 0.44, 0.05]}>
        <meshStandardMaterial color={WHITE} roughness={1} />
      </RoundedBox>
      {[-0.55, 0, 0.55].map((x, i) => (
        <mesh key={x} position={[x, 0.62, -depth / 2 + 0.32]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.1, 0.32, 4, 8]} />
          <meshStandardMaterial color={['#4fc3ea', '#ffd25e', '#ff8fab'][i] as string} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

/** BBQ station: a hooded grill with glowing coals, a prep counter and an umbrella. */
export function GrillStation({ night }: { night: boolean }) {
  return (
    <group position={[0, 0, -0.4]}>
      <mesh position={[-0.55, 0.45, 0]} castShadow>
        <boxGeometry args={[0.8, 0.9, 0.55]} />
        <meshStandardMaterial color="#2f3446" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[-0.55, 0.92, 0]}>
        <boxGeometry args={[0.76, 0.04, 0.5]} />
        <meshBasicMaterial color={night ? '#ff7a2e' : '#7a2e1e'} toneMapped={false} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[-0.88 + i * 0.095, 0.95, 0]}>
          <boxGeometry args={[0.015, 0.015, 0.48]} />
          <meshStandardMaterial color="#9aa0aa" metalness={0.8} />
        </mesh>
      ))}
      <mesh position={[-0.55, 1.15, -0.28]} rotation={[-1.1, 0, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.8, 16, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#e8364d" metalness={0.4} roughness={0.4} side={2} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={`f${i}`} position={[-0.75 + i * 0.2, 0.99, 0.05]}>
          <capsuleGeometry args={[0.035, 0.12, 4, 6]} />
          <meshStandardMaterial color="#9b4a2a" roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0.45, 0.45, 0]} castShadow>
        <boxGeometry args={[0.9, 0.9, 0.55]} />
        <meshStandardMaterial color={WHITE} roughness={0.8} />
      </mesh>
      <mesh position={[0.45, 0.92, 0]}>
        <boxGeometry args={[0.96, 0.05, 0.6]} />
        <meshStandardMaterial color={TEAK} roughness={0.7} />
      </mesh>
      <group position={[0.1, 0, -0.5]}>
        <Umbrella colour="#e8364d" />
      </group>
      {night ? <pointLight position={[-0.55, 1.2, 0.2]} color="#ff8a3d" intensity={3} distance={3} decay={1.6} /> : null}
    </group>
  );
}

/** DJ booth: a decks table under a light truss, with speakers either side and lights that pulse at night. */
export function DjBooth({ night }: { night: boolean }) {
  const lamps = useRef<Array<MeshBasicMaterial | null>>([]);
  useFrame(({ clock }) => {
    lamps.current.forEach((lamp, i) => {
      if (!lamp) return;
      const on = Math.sin(clock.elapsedTime * 4 + i * 1.7) > 0;
      lamp.color.set(night ? (on ? (CANDY[i % CANDY.length] as string) : '#2a2d3a') : '#d8dce6');
    });
  });
  return (
    <group position={[0, 0, -0.45]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.3, 1.0, 0.55]} />
        <meshStandardMaterial color="#23252f" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.6, 0.28]}>
        <planeGeometry args={[1.2, 0.5]} />
        <meshBasicMaterial color={night ? '#7a5cff' : '#3b3f52'} toneMapped={false} />
      </mesh>
      {[-0.35, 0.35].map((x) => (
        <mesh key={x} position={[x, 1.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.16, 20]} />
          <meshStandardMaterial color="#111318" roughness={0.3} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 1.05, 0, 0]}>
          <RoundedBox args={[0.5, 1.2, 0.45]} radius={0.04} smoothness={2} position={[0, 0.6, 0]} castShadow>
            <meshStandardMaterial color="#1b1d24" roughness={0.6} />
          </RoundedBox>
          {[0.85, 0.4].map((y, i) => (
            <mesh key={y} position={[0, y, 0.23]}>
              <circleGeometry args={[i ? 0.17 : 0.1, 20]} />
              <meshStandardMaterial color="#3b3f52" roughness={0.4} />
            </mesh>
          ))}
        </group>
      ))}
      {[-1.4, 1.4].map((x) => (
        <Strut key={x} from={[x, 0, -0.2]} to={[x, 2.4, -0.2]} radius={0.04} color="#9aa0aa" />
      ))}
      <Strut from={[-1.4, 2.4, -0.2]} to={[1.4, 2.4, -0.2]} radius={0.05} color="#9aa0aa" />
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={`l${i}`} position={[-1.0 + i * 0.5, 2.25, -0.1]} rotation={[0.6, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.09, 0.16, 10]} />
          <meshBasicMaterial
            ref={(lamp) => {
              lamps.current[i] = lamp;
            }}
            color="#d8dce6"
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
