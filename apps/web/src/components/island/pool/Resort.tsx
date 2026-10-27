import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, Shape, type Group } from 'three';
import { seeded } from '../../../lib/scenes/skyline.js';
import type { Vec3 } from '../../../lib/scenes/types.js';
import { useCanvasTexture } from '../office/canvas-texture.js';
import { Bulb, CANDY, Strut } from '../park/parts.js';

type Time = 'day' | 'night';

const SEA = -1.2;
const SAND = -1.15;
const HOTEL = { z: -21, width: 30, floors: 5, floorHeight: 2.2, depth: 5 } as const;
const PIER = { x: 19, z1: 4, z2: 26, width: 2.2 } as const;

/** Rows of rooms with balconies: a wall of windows lit warm at night, pale blue glass by day. */
function drawHotelFacade(night: boolean) {
  return (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const random = seeded(night ? 409 : 408);
    ctx.fillStyle = night ? '#3a3352' : '#f6efe4';
    ctx.fillRect(0, 0, width, height);
    const columns = 12;
    const rows = HOTEL.floors;
    const cw = width / columns;
    const rh = height / rows;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < columns; c += 1) {
        const lit = random();
        ctx.fillStyle = night ? (lit < 0.55 ? '#ffd28a' : lit < 0.7 ? '#9fd8ff' : '#2a2540') : '#9cc9e6';
        ctx.fillRect(c * cw + cw * 0.15, r * rh + rh * 0.18, cw * 0.7, rh * 0.62);
        ctx.fillStyle = night ? '#4a4366' : '#ffffff';
        ctx.fillRect(c * cw + cw * 0.08, r * rh + rh * 0.78, cw * 0.84, rh * 0.08);
      }
    }
  };
}

function drawHotelSign(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = '#0f6b8f';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 64px "Baloo 2", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('INTERN BAY RESORT', width / 2, height / 2 + 4);
}

/** Terraced resort hotel behind the pool: each floor steps back, with balcony rails and a rooftop sign. */
function Hotel({ night }: { night: boolean }) {
  const facade = useCanvasTexture(1024, 400, useMemo(() => drawHotelFacade(night), [night]), `hotel:${night}`);
  const sign = useCanvasTexture(1024, 128, drawHotelSign, 'hotel-sign');
  const height = HOTEL.floors * HOTEL.floorHeight;
  return (
    <group position={[1, SAND, HOTEL.z]}>
      {[-1, 0, 1].map((wing) => {
        const width = wing === 0 ? HOTEL.width * 0.42 : HOTEL.width * 0.3;
        const x = wing * HOTEL.width * 0.36;
        const z = wing === 0 ? 0 : 1.6;
        return (
          <group key={wing} position={[x, 0, z]} rotation={[0, -wing * 0.18, 0]}>
            <mesh position={[0, height / 2, 0]} castShadow>
              <boxGeometry args={[width, height, HOTEL.depth]} />
              <meshStandardMaterial color={night ? '#4a4366' : '#f6efe4'} roughness={0.9} />
            </mesh>
            <mesh position={[0, height / 2, HOTEL.depth / 2 + 0.01]}>
              <planeGeometry args={[width, height]} />
              {night ? (
                <meshStandardMaterial map={facade} emissiveMap={facade} emissive="#ffffff" emissiveIntensity={0.9} />
              ) : (
                <meshStandardMaterial map={facade} roughness={0.8} />
              )}
            </mesh>
            {/* Balcony slabs and glass rails along every floor. */}
            {Array.from({ length: HOTEL.floors }, (_, f) => (
              <group key={f} position={[0, (f + 1) * HOTEL.floorHeight - 0.42, HOTEL.depth / 2 + 0.35]}>
                <mesh>
                  <boxGeometry args={[width, 0.12, 0.7]} />
                  <meshStandardMaterial color={night ? '#5d5878' : '#ffffff'} />
                </mesh>
                <mesh position={[0, 0.42, 0.34]}>
                  <boxGeometry args={[width, 0.7, 0.03]} />
                  <meshPhysicalMaterial color="#dff2ff" transparent opacity={0.3} roughness={0.05} depthWrite={false} />
                </mesh>
              </group>
            ))}
            <mesh position={[0, height + 0.3, 0]}>
              <boxGeometry args={[width + 0.6, 0.6, HOTEL.depth + 0.6]} />
              <meshStandardMaterial color={night ? '#5d5878' : '#e2d6c2'} />
            </mesh>
          </group>
        );
      })}
      <mesh position={[0, height + 1.4, 0.4]}>
        <planeGeometry args={[9, 1.1]} />
        <meshBasicMaterial map={sign} toneMapped={false} />
      </mesh>
      {night ? <pointLight position={[0, height * 0.5, HOTEL.depth + 3]} color="#ffc98a" intensity={30} distance={22} decay={1.4} /> : null}
    </group>
  );
}

/** Beach umbrella with a towel laid out under it. */
function BeachUmbrella({ at, colour, towel }: { at: Vec3; colour: string; towel: string }) {
  return (
    <group position={at}>
      <Strut from={[0, 0, 0]} to={[0.1, 2.0, 0]} radius={0.03} color="#e6eaf0" />
      {Array.from({ length: 8 }, (_, i) => (
        <mesh key={i} position={[0.1, 2.0, 0]} castShadow>
          <coneGeometry args={[1.1, 0.4, 4, 1, true, (i / 8) * Math.PI * 2, Math.PI / 4]} />
          <meshStandardMaterial color={i % 2 ? '#ffffff' : colour} side={2} />
        </mesh>
      ))}
      <mesh position={[0.6, 0.02, 0.4]} rotation={[-Math.PI / 2, 0, 0.3]}>
        <planeGeometry args={[0.8, 1.6]} />
        <meshStandardMaterial color={towel} roughness={1} />
      </mesh>
    </group>
  );
}

const NET = { width: 8.8, top: 2.43, height: 0.9, cell: 0.1, post: 4.6 } as const;

/** The net's mesh as line segments: a square grid of cords between the top and bottom bands. */
function netMesh(): BufferGeometry {
  const points: number[] = [];
  const half = NET.width / 2;
  const bottom = NET.top - NET.height;
  for (let x = -half; x <= half + 1e-6; x += NET.cell) points.push(x, bottom, 0, x, NET.top, 0);
  for (let y = bottom; y <= NET.top + 1e-6; y += NET.cell) points.push(-half, y, 0, half, y, 0);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(points, 3));
  return geometry;
}

/**
 * Beach volleyball court: boundary tape pegged into the sand, padded posts held up by guy ropes,
 * a net of square mesh between a white top band and a bottom cord, and striped antennas.
 */
function VolleyballCourt({ at }: { at: Vec3 }) {
  const mesh = useMemo(() => netMesh(), []);
  const half = NET.width / 2;
  const bottom = NET.top - NET.height;
  return (
    <group position={at} rotation={[0, 0.2, 0]}>
      {/* Boundary tape (8 x 16 court) with corner pegs. */}
      {[
        [0, -8, 8, 0.07],
        [0, 8, 8, 0.07],
        [-4, 0, 0.07, 16],
        [4, 0, 0.07, 16],
      ].map(([x, z, w, d]) => (
        <mesh key={`${x},${z}`} position={[x as number, 0.015, z as number]}>
          <boxGeometry args={[w as number, 0.015, d as number]} />
          <meshStandardMaterial color="#2a74d6" roughness={0.6} />
        </mesh>
      ))}
      {[-4, 4].flatMap((x) =>
        [-8, 8].map((z) => (
          <mesh key={`${x},${z}`} position={[x, 0.05, z]}>
            <boxGeometry args={[0.12, 0.1, 0.12]} />
            <meshStandardMaterial color="#e8364d" />
          </mesh>
        )),
      )}
      {/* Posts with foam padding, a winch on one, and guy ropes to pegs outside the court. */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * NET.post, 0, 0]}>
          <Strut from={[0, -0.3, 0]} to={[0, NET.top + 0.15, 0]} radius={0.05} color="#d8dce6" />
          <mesh position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 1.8, 14]} />
            <meshStandardMaterial color="#2a74d6" roughness={0.8} />
          </mesh>
          <mesh position={[0, NET.top + 0.17, 0]}>
            <sphereGeometry args={[0.06, 10, 8]} />
            <meshStandardMaterial color="#d8dce6" metalness={0.6} />
          </mesh>
          {side > 0 ? (
            <mesh position={[0.14, 1.95, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.06, 0.06, 0.12, 12]} />
              <meshStandardMaterial color="#3b3f52" metalness={0.5} />
            </mesh>
          ) : null}
          {[-0.9, 0.9].map((z) => (
            <group key={z}>
              <Strut from={[0, NET.top + 0.1, 0]} to={[side * 1.2, 0.02, z]} radius={0.008} color="#f4f4f4" metal={false} />
              <mesh position={[side * 1.2, 0.04, z]}>
                <coneGeometry args={[0.04, 0.12, 6]} />
                <meshStandardMaterial color="#9aa0aa" metalness={0.5} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      {/* Net: mesh, white top band, bottom cord, side tapes, and cords tying it to the posts. */}
      <lineSegments geometry={mesh}>
        <lineBasicMaterial color="#2f3446" transparent opacity={0.75} />
      </lineSegments>
      <mesh position={[0, NET.top - 0.035, 0]}>
        <boxGeometry args={[NET.width, 0.07, 0.015]} />
        <meshStandardMaterial color="#ffffff" roughness={0.7} />
      </mesh>
      <mesh position={[0, bottom, 0]}>
        <boxGeometry args={[NET.width, 0.02, 0.01]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * (half - 0.025), NET.top - NET.height / 2, 0]}>
            <boxGeometry args={[0.05, NET.height, 0.012]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          {/* Antenna: a red and white striped rod rising above the net at each sideline. */}
          {Array.from({ length: 8 }, (_, i) => (
            <mesh key={i} position={[side * (half - 0.025), NET.top - 0.4 + i * 0.13 + 0.065, 0.02]}>
              <cylinderGeometry args={[0.012, 0.012, 0.13, 6]} />
              <meshStandardMaterial color={i % 2 ? '#ffffff' : '#e8364d'} />
            </mesh>
          ))}
          {[NET.top - 0.03, bottom].map((y) => (
            <Strut key={y} from={[side * half, y, 0]} to={[side * NET.post, y, 0]} radius={0.006} color="#f4f4f4" metal={false} />
          ))}
        </group>
      ))}
      <mesh position={[1.6, 0.18, 2.4]}>
        <sphereGeometry args={[0.18, 18, 14]} />
        <meshStandardMaterial color="#ffd25e" roughness={0.6} />
      </mesh>
      {/* Seams wrapped round the ball itself. */}
      {[0, Math.PI / 3, -Math.PI / 3].map((turn) => (
        <mesh key={turn} position={[1.6, 0.18, 2.4]} rotation={[Math.PI / 2, turn, 0]}>
          <torusGeometry args={[0.181, 0.006, 4, 32]} />
          <meshStandardMaterial color="#2a74d6" />
        </mesh>
      ))}
    </group>
  );
}

/** Kayaks pulled up on the sand. */
function Kayaks({ at }: { at: Vec3 }) {
  return (
    <group position={at}>
      {['#ff8a3d', '#ffd25e', '#4fc3ea'].map((colour, i) => (
        <mesh key={colour} position={[i * 0.9, 0.18, i * 0.3]} rotation={[0, 0.4 + i * 0.1, 0]} scale={[0.35, 0.22, 1.9]}>
          <sphereGeometry args={[1, 16, 10]} />
          <meshStandardMaterial color={colour} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

/** A small sailboat rocking at anchor. */
function Sailboat({ at, sail, phase }: { at: Vec3; sail: string; phase: number }) {
  const boat = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!boat.current) return;
    const t = clock.elapsedTime * 0.8 + phase;
    boat.current.rotation.z = Math.sin(t) * 0.06;
    boat.current.position.y = at[1] + Math.sin(t * 1.3) * 0.08;
  });
  const shape = useMemo(() => {
    const s = new Shape();
    s.moveTo(0, -1.5);
    s.lineTo(1.6, -1.5);
    s.lineTo(0, 1.6);
    s.closePath();
    return s;
  }, []);
  return (
    <group ref={boat} position={at}>
      <mesh scale={[1, 0.5, 2.6]}>
        <sphereGeometry args={[0.7, 14, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} side={2} />
      </mesh>
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 3.6, 6]} />
        <meshStandardMaterial color="#c3c8d1" />
      </mesh>
      <mesh position={[0.02, 1.9, 0.6]} rotation={[0, Math.PI / 2, 0]}>
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial color={sail} side={2} roughness={0.8} />
      </mesh>
    </group>
  );
}

/** Wooden pier on piles out into the sea, lamp posts along it and a lighthouse at the end. */
function Pier({ night }: { night: boolean }) {
  const beam = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (beam.current) beam.current.rotation.y = clock.elapsedTime * 0.6;
  });
  const length = PIER.z2 - PIER.z1;
  const planks = Math.round(length / 0.35);
  return (
    <group position={[PIER.x, 0, 0]}>
      {Array.from({ length: planks }, (_, i) => (
        <mesh key={i} position={[0, SEA + 0.6, PIER.z1 + (i + 0.5) * (length / planks)]} castShadow>
          <boxGeometry args={[PIER.width, 0.08, length / planks - 0.04]} />
          <meshStandardMaterial color={i % 3 ? '#a8774f' : '#9b6c46'} roughness={0.9} />
        </mesh>
      ))}
      {Array.from({ length: Math.floor(length / 2.5) + 1 }, (_, i) => (
        <group key={`p${i}`}>
          {[-1, 1].map((side) => (
            <Strut key={side} from={[(side * PIER.width) / 2, SEA - 0.4, PIER.z1 + i * 2.5]} to={[(side * PIER.width) / 2, SEA + 1.5, PIER.z1 + i * 2.5]} radius={0.08} color="#7a5638" metal={false} />
          ))}
        </group>
      ))}
      {[-1, 1].map((side) => (
        <Strut key={`r${side}`} from={[(side * PIER.width) / 2, SEA + 1.45, PIER.z1]} to={[(side * PIER.width) / 2, SEA + 1.45, PIER.z2]} radius={0.04} color="#ffffff" metal={false} />
      ))}
      {[0.2, 0.45, 0.7].map((t) => {
        const z = PIER.z1 + t * length;
        return (
          <group key={t} position={[PIER.width / 2, SEA + 0.6, z]}>
            <Strut from={[0, 0, 0]} to={[0, 2.2, 0]} radius={0.04} color="#2f3446" />
            <Bulb at={[0, 2.3, 0]} night={night} size={0.12} />
            {night ? <pointLight position={[0, 2.2, 0]} color="#ffd9a0" intensity={4} distance={6} decay={1.5} /> : null}
          </group>
        );
      })}
      {/* Lighthouse: striped tower, gallery, lantern room and a sweeping beam at night. */}
      <group position={[0, SEA + 0.6, PIER.z2 + 1.2]}>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[1.6, 1.8, 0.6, 20]} />
          <meshStandardMaterial color="#9a9a9a" roughness={0.95} />
        </mesh>
        {Array.from({ length: 5 }, (_, i) => (
          <mesh key={i} position={[0, 0.6 + i * 1.2 + 0.6, 0]} castShadow>
            <cylinderGeometry args={[0.95 - (i + 1) * 0.08, 0.95 - i * 0.08, 1.2, 20]} />
            <meshStandardMaterial color={i % 2 ? '#ffffff' : '#e8364d'} roughness={0.7} />
          </mesh>
        ))}
        <mesh position={[0, 6.7, 0]}>
          <cylinderGeometry args={[0.85, 0.85, 0.12, 20]} />
          <meshStandardMaterial color="#2f3446" />
        </mesh>
        <mesh position={[0, 7.2, 0]}>
          <cylinderGeometry args={[0.45, 0.45, 0.9, 16]} />
          <meshBasicMaterial color={night ? '#fff2c4' : '#cfe6ff'} toneMapped={false} transparent opacity={0.85} />
        </mesh>
        <mesh position={[0, 7.85, 0]}>
          <coneGeometry args={[0.6, 0.5, 16]} />
          <meshStandardMaterial color="#e8364d" />
        </mesh>
        {night ? (
          <>
            <group ref={beam} position={[0, 7.2, 0]}>
              <mesh position={[0, 0, 12]} rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[2.4, 24, 20, 1, true]} />
                <meshBasicMaterial color="#fff2c4" transparent opacity={0.1} depthWrite={false} blending={AdditiveBlending} side={2} toneMapped={false} />
              </mesh>
            </group>
            <pointLight position={[0, 7.2, 0]} color="#fff2c4" intensity={20} distance={18} decay={1.4} />
          </>
        ) : null}
      </group>
    </group>
  );
}

/** Low-poly palms dotted along the beach. */
function BeachPalm({ at, lean }: { at: Vec3; lean: number }) {
  return (
    <group position={at} rotation={[0, lean * 3, lean]}>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[0, 0.3 + i * 0.55, 0]}>
          <cylinderGeometry args={[0.13 - i * 0.008, 0.15 - i * 0.008, 0.56, 8]} />
          <meshStandardMaterial color={i % 2 ? '#9a7652' : '#8a6848'} roughness={0.95} />
        </mesh>
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <group key={`f${i}`} position={[0, 4.0, 0]} rotation={[0, (i / 8) * Math.PI * 2, 0]}>
          <mesh position={[0.75, -0.2, 0]} rotation={[Math.PI / 2, 0, -0.4]} scale={[1, 1, 0.35]}>
            <coneGeometry args={[0.3, 1.6, 4]} />
            <meshStandardMaterial color={i % 2 ? '#3f9c55' : '#4fae66'} flatShading side={2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Tropical beach resort round the pool club: sea, sandy shore, hotel, beach, pier and lighthouse. */
export function Resort({ time }: { time: Time }) {
  const night = time === 'night';
  const islands = useMemo(() => {
    const random = seeded(31);
    return Array.from({ length: 6 }, () => ({
      at: [(random() - 0.5) * 160, -1.5, 50 + random() * 60] as Vec3,
      size: 6 + random() * 9,
    }));
  }, []);
  const umbrellas = useMemo(() => {
    const random = seeded(55);
    return Array.from({ length: 7 }, (_, i) => ({
      at: [-14 + i * 3.6 + random(), SAND, 13.5 + random() * 2.5] as Vec3,
      colour: CANDY[i % CANDY.length] as string,
      towel: CANDY[(i + 3) % CANDY.length] as string,
    }));
  }, []);
  return (
    <group>
      <mesh position={[0, SEA, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[260, 64]} />
        <meshStandardMaterial color={night ? '#163a63' : '#3fb0e0'} roughness={0.12} metalness={0.15} />
      </mesh>
      {/* Shallow turquoise water near the shore, then sand. */}
      <mesh position={[1, SEA + 0.01, -4]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.6, 1, 1.15]}>
        <circleGeometry args={[22, 64]} />
        <meshStandardMaterial color={night ? '#1f5c80' : '#6fdcd8'} roughness={0.1} transparent opacity={0.9} />
      </mesh>
      <mesh position={[1, SAND, -6]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.55, 1, 1.15]}>
        <circleGeometry args={[19, 64]} />
        <meshStandardMaterial color={night ? '#6f6788' : '#f1e1bf'} roughness={1} />
      </mesh>
      <mesh position={[1, SAND + 0.01, -6]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.55, 1, 1.15]}>
        <ringGeometry args={[18.5, 19.4, 64]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={night ? 0.25 : 0.65} />
      </mesh>
      <Hotel night={night} />
      {umbrellas.map((u) => (
        <BeachUmbrella key={`${u.at}`} {...u} />
      ))}
      <VolleyballCourt at={[-18, SAND, -6]} />
      <Kayaks at={[13.5, SAND, 12.5]} />
      <Pier night={night} />
      {([[-24, SAND, -14], [-23, SAND, 6], [24, SAND, -8], [15, SAND, 14.5], [-8, SAND, 16]] as Vec3[]).map((at, i) => (
        <BeachPalm key={`${at}`} at={at} lean={(i % 3) * 0.08 - 0.08} />
      ))}
      {islands.map(({ at, size }, index) => (
        <mesh key={index} position={at} scale={[size, size * 0.45, size]}>
          <sphereGeometry args={[1, 14, 10]} />
          <meshStandardMaterial color={night ? '#2f4a40' : '#86c98a'} flatShading />
        </mesh>
      ))}
      <Sailboat at={[30, SEA + 0.1, 30]} sail="#ffffff" phase={0} />
      <Sailboat at={[-30, SEA + 0.1, 34]} sail="#ff8f9c" phase={2} />
      <Sailboat at={[6, SEA + 0.1, 44]} sail="#ffd25e" phase={4} />
    </group>
  );
}
