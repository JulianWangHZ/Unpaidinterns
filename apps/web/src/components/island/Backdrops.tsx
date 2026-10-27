import { useMemo, type ReactNode } from 'react';
import { buildBackdropTowers, buildSkyline, seeded } from '../../lib/scenes/skyline.js';
import type { SceneId } from '../../lib/scenes/types.js';
import { LEVEL } from '../../lib/scenes/street.js';
import { ParkingLot } from './city/ParkingLot.js';
import { Street } from './city/Street.js';
import { facade, nightFacade } from './textures.js';

const STREET = -60;
const FLOOR_UNIT = 1.6;

function Building({ x, z, width, depth, top, tint }: { x: number; z: number; width: number; depth: number; top: number; tint: string }) {
  const height = top - STREET;
  const map = useMemo(() => facade(Math.max(1, Math.round(width / 2)), Math.max(1, Math.round(height / FLOOR_UNIT / 8))), [width, height]);
  return (
    <group position={[x, STREET + height / 2, z]}>
      <mesh>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={tint} map={map} roughness={0.8} />
      </mesh>
      <mesh position={[0, height / 2 + 0.3, 0]}>
        <boxGeometry args={[width * 0.6, 0.6, depth * 0.6]} />
        <meshStandardMaterial color="#9aa6c8" />
      </mesh>
    </group>
  );
}

function Clouds({ seed, height, spread }: { seed: number; height: number; spread: number }) {
  const clouds = useMemo(() => {
    const random = seeded(seed);
    return Array.from({ length: 14 }, () => ({
      at: [(random() - 0.5) * spread, height + random() * 10, (random() - 0.5) * spread - spread * 0.25] as [number, number, number],
      scale: 3 + random() * 5,
    }));
  }, [seed, height, spread]);
  return (
    <>
      {clouds.map(({ at, scale }, index) => (
        <mesh key={index} position={at} scale={[scale * 2.2, scale * 0.6, scale]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color="#ffffff" roughness={1} transparent opacity={0.85} />
        </mesh>
      ))}
    </>
  );
}

type Time = 'day' | 'night';

function SkylineTower({ x, z, width, depth, top, time }: { x: number; z: number; width: number; depth: number; top: number; time: Time }) {
  const columns = Math.max(1, Math.round(width / 2));
  const rows = Math.max(1, Math.round(top / FLOOR_UNIT / 8));
  const map = useMemo(() => (time === 'night' ? nightFacade(columns, rows) : facade(columns, rows)), [time, columns, rows]);
  return (
    // Stands on the ground below the street, not at the office floor.
    <mesh position={[x, (top + LEVEL.base) / 2, z]}>
      <boxGeometry args={[width, top - LEVEL.base, depth]} />
      {time === 'night' ? (
        <meshStandardMaterial color="#ffffff" map={map} emissiveMap={map} emissive="#ffffff" emissiveIntensity={0.85} />
      ) : (
        <meshStandardMaterial color="#c9d3ec" map={map} roughness={0.8} />
      )}
    </mesh>
  );
}

/** The skyline behind the office tower, with the street and parking lot around it; lit windows at night, blue glass by day. */
function City({ time }: { time: Time }) {
  const towers = useMemo(() => buildBackdropTowers(60), []);
  const night = time === 'night';
  return (
    <>
      <mesh position={[0, LEVEL.base - 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color={night ? '#1b1834' : '#b9c2d6'} />
      </mesh>
      <Street time={time} />
      <ParkingLot time={time} />
      {towers.map((tower, index) => (
        <SkylineTower key={index} {...tower} time={time} />
      ))}
      {night ? null : <Clouds seed={5} height={30} spread={200} />}
    </>
  );
}

function Countryside(_props: { time: Time }) {
  const hills = useMemo(() => {
    const random = seeded(21);
    return Array.from({ length: 16 }, (_, i) => {
      const angle = (i / 16) * Math.PI * 2;
      const distance = 30 + random() * 20;
      return { at: [Math.cos(angle) * distance, -3, Math.sin(angle) * distance] as [number, number, number], size: 8 + random() * 10 };
    });
  }, []);
  const city = useMemo(() => buildSkyline(30, 3).map((t) => ({ ...t, x: t.x * 1.8, z: t.z * 1.8 - 40, top: t.top - 40 })), []);
  return (
    <>
      <mesh position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[220, 48]} />
        <meshStandardMaterial color="#a8d99a" />
      </mesh>
      {hills.map(({ at, size }, index) => (
        <mesh key={index} position={at} scale={[size, size * 0.5, size]}>
          <sphereGeometry args={[1, 16, 10]} />
          <meshStandardMaterial color={index % 2 ? '#8fcf8a' : '#9ad69a'} roughness={1} flatShading />
        </mesh>
      ))}
      {city.map((tower, index) => (
        <Building key={index} {...tower} />
      ))}
      <Clouds seed={8} height={18} spread={180} />
    </>
  );
}

function Seaside(_props: { time: Time }) {
  const islands = useMemo(() => {
    const random = seeded(31);
    return Array.from({ length: 6 }, () => ({
      at: [(random() - 0.5) * 140, -1.5, -40 - random() * 50] as [number, number, number],
      size: 5 + random() * 8,
    }));
  }, []);
  return (
    <>
      <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[260, 48]} />
        <meshStandardMaterial color="#58bfe6" roughness={0.2} />
      </mesh>
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[11, 16, 48]} />
        <meshStandardMaterial color="#f3e2c0" />
      </mesh>
      {islands.map(({ at, size }, index) => (
        <mesh key={index} position={at} scale={[size, size * 0.45, size]}>
          <sphereGeometry args={[1, 14, 10]} />
          <meshStandardMaterial color="#86c98a" flatShading />
        </mesh>
      ))}
      <mesh position={[-38, -1.6, -78]} scale={[22, 3, 14]}>
        <sphereGeometry args={[1, 20, 10]} />
        <meshStandardMaterial color="#f3e2c0" flatShading />
      </mesh>
      <Building x={-38} z={-80} width={16} depth={7} top={14} tint="#f7efe3" />
      <Clouds seed={13} height={16} spread={200} />
    </>
  );
}

const BACKDROPS: Record<SceneId, (props: { time: Time }) => ReactNode> = { office: City, park: Countryside, pool: Seaside };

/** Sky gradient (top, horizon) for each scene at each time of day. */
export const SKIES: Record<SceneId, Record<Time, [string, string]>> = {
  office: { day: ['#6fb1ec', '#e4eefb'], night: ['#120d2b', '#4a3470'] },
  park: { day: ['#9ccdf2', '#fdeedd'], night: ['#0f1530', '#3b3a6b'] },
  pool: { day: ['#7cc6f0', '#e8f7fd'], night: ['#0b1a33', '#2f4a72'] },
};

export function Backdrop({ scene, time }: { scene: SceneId; time: Time }) {
  const Scene = BACKDROPS[scene];
  return <Scene time={time} />;
}
