import { RoundedBox } from '@react-three/drei';
import { useMemo } from 'react';
import { CatmullRomCurve3, TubeGeometry, Vector3 } from 'three';
import { LEVEL, LOT, parkingBays, type Bay } from '../../../lib/scenes/street.js';
import { useCanvasTexture } from '../office/canvas-texture.js';
import { Car } from './Car.js';

type Time = 'day' | 'night';

const GROUND = LEVEL.road;
const PAINT = 0.005;
/** Cars back in, so they face the road (+z); the charge port then sits on the +x side at the back. */
const FACING_ROAD = -Math.PI / 2;
const CHARGER_Z = LOT.z1 + 0.35;

function drawParkingSign(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#2f6fd6';
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 48px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('P', 32, 35);
}

/** Slim charging post with a status light: green and breathing while a car is plugged in. */
function Charger({ x, active, night }: { x: number; active: boolean; night: boolean }) {
  return (
    <group position={[x, GROUND, CHARGER_Z]}>
      <mesh position={[0, 0.04, 0]}>
        <boxGeometry args={[0.6, 0.08, 0.45]} />
        <meshStandardMaterial color="#9a9ca6" roughness={0.9} />
      </mesh>
      <RoundedBox args={[0.34, 1.55, 0.24]} radius={0.08} smoothness={3} position={[0, 0.85, 0]} castShadow>
        <meshStandardMaterial color="#e9ebef" roughness={0.4} />
      </RoundedBox>
      <mesh position={[0, 1.5, 0.001]}>
        <boxGeometry args={[0.35, 0.22, 0.245]} />
        <meshStandardMaterial color="#202228" roughness={0.4} />
      </mesh>
      {/* Status strip facing the bay. */}
      <mesh position={[0, 0.95, 0.125]}>
        <boxGeometry args={[0.05, 0.75, 0.01]} />
        <meshBasicMaterial color={active ? '#43e07a' : night ? '#e6ecff' : '#c3c8d4'} toneMapped={false} />
      </mesh>
      {/* Holster for the plug when nothing is charging. */}
      {active ? null : (
        <mesh position={[0.18, 1.0, 0.04]}>
          <boxGeometry args={[0.06, 0.16, 0.08]} />
          <meshStandardMaterial color="#202228" />
        </mesh>
      )}
    </group>
  );
}

/** Charging cable sagging from the post to the car's charge port. */
function Cable({ bay }: { bay: Bay }) {
  const geometry = useMemo(() => {
    const from = new Vector3(bay.x + 0.18, GROUND + 1.0, CHARGER_Z + 0.08);
    const port = new Vector3(bay.x + 1.0, GROUND + 0.9, bay.carZ - 2.0);
    const sag = new Vector3((from.x + port.x) / 2 + 0.15, GROUND + 0.25, (from.z + port.z) / 2);
    return new TubeGeometry(new CatmullRomCurve3([from, sag, port]), 24, 0.025, 6);
  }, [bay]);
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#17181c" roughness={0.6} />
    </mesh>
  );
}

/** Lot to the right of the office: a row of electric cars backed into charging bays. */
export function ParkingLot({ time }: { time: Time }) {
  const night = time === 'night';
  const bays = useMemo(() => parkingBays(), []);
  const sign = useCanvasTexture(64, 64, drawParkingSign, 'parking-sign');
  const width = LOT.x2 - LOT.x1;
  const depth = LOT.z2 - LOT.z1;
  const line = night ? '#b9bccb' : '#f4f5f7';
  return (
    <group>
      <mesh position={[(LOT.x1 + LOT.x2) / 2, GROUND - 0.03, (LOT.z1 + LOT.z2) / 2]} receiveShadow>
        <boxGeometry args={[width, 0.06, depth]} />
        <meshStandardMaterial color={night ? '#2b2940' : '#666a76'} roughness={0.95} />
      </mesh>
      {/* Bay dividers. */}
      {Array.from({ length: bays.length + 1 }, (_, i) => (
        <mesh key={i} position={[LOT.x1 + i * LOT.bayWidth, GROUND + PAINT, LOT.z1 + LOT.bayDepth / 2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.1, LOT.bayDepth]} />
          <meshBasicMaterial color={line} />
        </mesh>
      ))}
      {bays.map((bay) => (
        <group key={bay.x}>
          <Charger x={bay.x} active={bay.charging} night={night} />
          {/* Wheel stop. */}
          <mesh position={[bay.x, GROUND + 0.06, LOT.z1 + 0.85]}>
            <boxGeometry args={[1.5, 0.12, 0.16]} />
            <meshStandardMaterial color="#c9c3b4" roughness={0.9} />
          </mesh>
          <Car model={bay.model} color={bay.color} night={night} charging={bay.charging} position={[bay.x, GROUND, bay.carZ]} rotation={FACING_ROAD} />
          {bay.charging ? <Cable bay={bay} /> : null}
        </group>
      ))}
      {/* Parking sign at the entrance. */}
      <group position={[LOT.x2 - 0.4, GROUND, LOT.z2 - 0.5]}>
        <mesh position={[0, 1.2, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 2.4, 8]} />
          <meshStandardMaterial color="#8a8f9c" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 2.25, 0.05]}>
          <planeGeometry args={[0.7, 0.7]} />
          <meshBasicMaterial map={sign} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}
