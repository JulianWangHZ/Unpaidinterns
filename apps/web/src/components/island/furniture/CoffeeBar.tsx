import { RoundedBox } from '@react-three/drei';
import { useMemo } from 'react';
import { Mini } from '../characters/Mini.js';
import { brushedMetal, chalkMenu, woodGrain } from './surfaces.js';

const BARISTA = { gender: 'female', skirt: false, skin: '#efc29b', hair: 'bun', hairColor: '#4a2f22', pants: '#1f2430', shoes: '#1b1b22', glasses: false } as const;

function Steel({ tint = '#d9dde2' }: { tint?: string }) {
  const metal = useMemo(() => brushedMetal(), []);
  return <meshStandardMaterial color={tint} map={metal.map} roughnessMap={metal.roughnessMap} metalness={0.85} roughness={0.35} />;
}

function Glass() {
  return <meshPhysicalMaterial color="#e8f4ff" transparent opacity={0.22} roughness={0.05} metalness={0} />;
}

/** Two-group espresso machine: steel body, group heads with portafilters, steam wand, drip tray and cups warming on top. */
function EspressoMachine() {
  return (
    <group>
      <RoundedBox args={[0.38, 0.24, 0.24]} radius={0.02} smoothness={3} position={[0, 0.12, 0]} castShadow>
        <Steel />
      </RoundedBox>
      {/* Coloured front fascia, the part a barista actually faces. */}
      <mesh position={[0, 0.15, 0.121]}>
        <boxGeometry args={[0.34, 0.1, 0.004]} />
        <meshStandardMaterial color="#c0392b" roughness={0.35} metalness={0.2} />
      </mesh>
      {[-0.09, 0.09].map((x) => (
        <group key={x} position={[x, 0.085, 0.13]}>
          <mesh>
            <cylinderGeometry args={[0.028, 0.028, 0.03, 16]} />
            <Steel />
          </mesh>
          <mesh position={[0, -0.025, 0.035]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.009, 0.009, 0.08, 8]} />
            <meshStandardMaterial color="#1b1b1b" roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.07, 0]}>
            <cylinderGeometry args={[0.022, 0.018, 0.04, 14]} />
            <meshStandardMaterial color="#ffffff" roughness={0.25} />
          </mesh>
        </group>
      ))}
      <mesh position={[0.17, 0.08, 0.1]} rotation={[0.3, 0, 0.15]}>
        <cylinderGeometry args={[0.005, 0.005, 0.16, 8]} />
        <Steel />
      </mesh>
      {[-0.06, 0.06].map((x) => (
        <mesh key={x} position={[x, 0.21, 0.125]}>
          <circleGeometry args={[0.022, 18]} />
          <meshStandardMaterial color="#f5f5f5" emissive="#ffffff" emissiveIntensity={0.15} />
        </mesh>
      ))}
      <mesh position={[0, 0.005, 0.1]}>
        <boxGeometry args={[0.32, 0.01, 0.07]} />
        <Steel tint="#9aa0a6" />
      </mesh>
      {[-0.12, -0.04, 0.04, 0.12].map((x) => (
        <mesh key={x} position={[x, 0.265, -0.02]}>
          <cylinderGeometry args={[0.022, 0.018, 0.04, 14]} />
          <meshStandardMaterial color="#ffffff" roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

function Grinder() {
  return (
    <group>
      <RoundedBox args={[0.1, 0.16, 0.13]} radius={0.015} smoothness={3} position={[0, 0.08, 0]} castShadow>
        <meshStandardMaterial color="#2b2d3a" roughness={0.4} />
      </RoundedBox>
      {/* Bean hopper: tinted glass with beans inside. */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.055, 0.035, 0.12, 18]} />
        <meshPhysicalMaterial color="#8a5a33" transparent opacity={0.35} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.19, 0]}>
        <cylinderGeometry args={[0.04, 0.032, 0.05, 14]} />
        <meshStandardMaterial color="#4a2c17" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** Glass pastry case with croissants and muffins, lit from inside. */
function PastryCase() {
  return (
    <group>
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[0.32, 0.02, 0.22]} />
        <Steel />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.32, 0.18, 0.22]} />
        <Glass />
      </mesh>
      {[-0.08, 0.02, 0.1].map((x, i) => (
        <mesh key={x} position={[x, 0.045, 0]} rotation={[0, i, 0]} scale={i === 1 ? [0.045, 0.03, 0.045] : [0.06, 0.025, 0.035]}>
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color={i === 1 ? '#7a4a2a' : '#e3a95c'} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function BarStool() {
  return (
    <group>
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.13, 0.15, 0.02, 20]} />
        <Steel />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.48, 10]} />
        <Steel />
      </mesh>
      <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.1, 0.008, 8, 24]} />
        <Steel />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.12, 0.06, 22]} />
        <meshStandardMaterial color="#3d2a20" roughness={0.6} />
      </mesh>
    </group>
  );
}

/** A small café bar: wood-topped counter, espresso machine, grinder, pastry case, menu board and stools. */
export function CoffeeBar() {
  const wood = useMemo(() => woodGrain(), []);
  const menu = useMemo(() => chalkMenu(), []);
  return (
    <group position={[0, 0, -0.15]}>
      {/* Counter body with a recessed kick plate and a tiled front. */}
      <mesh position={[0, 0.03, 0.02]}>
        <boxGeometry args={[1.06, 0.06, 0.4]} />
        <meshStandardMaterial color="#2b2d3a" />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.5, 0.44]} />
        <meshStandardMaterial color="#e9e4dc" roughness={0.6} />
      </mesh>
      {[-0.4, -0.2, 0, 0.2, 0.4].map((x) => (
        <mesh key={x} position={[x, 0.3, 0.222]}>
          <boxGeometry args={[0.005, 0.46, 0.003]} />
          <meshStandardMaterial color="#cfc6b8" />
        </mesh>
      ))}
      <RoundedBox args={[1.2, 0.04, 0.52]} radius={0.012} smoothness={3} position={[0, 0.57, 0]} castShadow receiveShadow>
        <meshStandardMaterial map={wood} roughness={0.5} />
      </RoundedBox>
      <group position={[-0.25, 0.59, -0.08]}>
        <EspressoMachine />
      </group>
      <group position={[0.12, 0.59, -0.1]}>
        <Grinder />
      </group>
      <group position={[0.36, 0.59, 0.06]}>
        <PastryCase />
      </group>
      {/* Back counter with the menu board above. */}
      <mesh position={[0, 0.45, -0.55]} castShadow>
        <boxGeometry args={[1.1, 0.9, 0.18]} />
        <meshStandardMaterial color="#8a6446" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.28, -0.6]}>
        <planeGeometry args={[0.72, 0.45]} />
        <meshStandardMaterial map={menu} roughness={0.9} />
      </mesh>
      {[-0.35, 0, 0.35].map((x) => (
        <group key={x} position={[x, 0.9, -0.55]}>
          <mesh>
            <cylinderGeometry args={[0.04, 0.035, 0.1, 14]} />
            <meshStandardMaterial color={x ? '#ffffff' : '#c0392b'} roughness={0.3} />
          </mesh>
        </group>
      ))}
      {[-0.32, 0.32].map((x) => (
        <group key={x} position={[x, 0, 0.52]}>
          <BarStool />
        </group>
      ))}
      <group position={[0.05, 0, -0.32]}>
        <Mini look={BARISTA} shirt="#3d2a20" extra="apron" pose="sip" seated={false} />
      </group>
    </group>
  );
}
