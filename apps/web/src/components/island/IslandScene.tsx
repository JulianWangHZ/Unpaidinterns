import type { Session } from '@unpaidinterns/core';
import { stateGroup } from '@unpaidinterns/core';
import { ContactShadows, Html } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Placement } from '../../lib/island/behavior.js';
import type { IslandLayout } from '../../lib/island/layout.js';
import { amenitySeat, deskSpot, internOffset, tileCentre, type Spot, type Vec3 } from '../../lib/island/positions.js';
import { AmenityProps } from './Amenities.js';
import { CameraRig } from './CameraRig.js';
import { Character } from './Character.js';
import { Desk } from './Desk.js';
import { useIslandStore } from './island-store.js';
import { PulseRing } from './PulseRing.js';
import { IslandBase, Tiles } from './Tiles.js';

interface SceneProps {
  layout: IslandLayout;
  sessions: Session[];
  placements: Map<string, Placement>;
  reducedMotion: boolean;
}

function spotsFor(layout: IslandLayout, sessions: Session[], placements: Map<string, Placement>): Map<string, Spot> {
  const seats = new Map(layout.districts.flatMap((d) => d.seats.map((seat) => [seat.sessionId, seat.hex] as const)));
  const amenityHex = new Map(layout.amenities.map(({ amenity, hex }) => [amenity, hex] as const));
  const spots = new Map<string, Spot>();
  for (const session of sessions.filter((s) => !s.parentSessionId)) {
    const placement = placements.get(session.sessionId);
    const desk = seats.get(session.sessionId);
    if (!placement || !desk) continue;
    const hex = placement.at.kind === 'amenity' ? amenityHex.get(placement.at.amenity) : undefined;
    spots.set(session.sessionId, hex && placement.at.kind === 'amenity' ? amenitySeat(hex, placement.at.seat) : deskSpot(desk));
  }
  for (const intern of sessions.filter((s) => s.parentSessionId)) {
    const parent = spots.get(intern.parentSessionId as string);
    if (parent) spots.set(intern.sessionId, { position: internOffset(parent.position), facing: parent.facing });
  }
  return spots;
}

function DistrictLabels({ layout }: { layout: IslandLayout }) {
  const { t } = useTranslation();
  const focus = useIslandStore((state) => state.focus);
  return (
    <>
      {layout.districts.map((district) => {
        const [x, , z] = tileCentre(district.anchor);
        return (
          <Html key={district.project} position={[x, 1.9, z]} center zIndexRange={[20, 0]}>
            <button
              type="button"
              className="district-label"
              style={{ background: district.color }}
              aria-label={t('island.focus', { project: district.project })}
              onClick={() => focus(district.project)}
            >
              {district.project} <small>{district.seats.length}</small>
            </button>
          </Html>
        );
      })}
    </>
  );
}

export function IslandScene({ layout, sessions, placements, reducedMotion }: SceneProps) {
  const focusProject = useIslandStore((state) => state.focusProject);
  const selected = useIslandStore((state) => state.selectedSession);
  const spots = useMemo(() => spotsFor(layout, sessions, placements), [layout, sessions, placements]);
  const byId = useMemo(() => new Map(sessions.map((s) => [s.sessionId, s])), [sessions]);

  const focus: Vec3 | null = useMemo(() => {
    const picked = selected ? spots.get(selected) : undefined;
    if (picked) return picked.position;
    const district = layout.districts.find((d) => d.project === focusProject);
    return district ? tileCentre(district.anchor) : null;
  }, [selected, spots, layout, focusProject]);

  return (
    <Canvas flat shadows="percentage" camera={{ position: [0, 25, 21], fov: 32 }} dpr={[1, 2]}>
      <color attach="background" args={['#eef0fb']} />
      <hemisphereLight args={['#ffffff', '#c3c9ee', 1.6]} />
      <directionalLight position={[6, 12, 8]} intensity={1.3} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0005}>
        <orthographicCamera attach="shadow-camera" args={[-14, 14, 14, -14, 1, 40]} />
      </directionalLight>
      <IslandBase radius={layout.radius} />
      <Tiles tiles={layout.tiles} />
      <ContactShadows position={[0, -2.2, 0]} scale={layout.radius * 5} blur={2.4} opacity={0.25} far={4} />
      {layout.amenities.map(({ amenity, hex }) => (
        <AmenityProps key={amenity} amenity={amenity} hex={hex} />
      ))}
      {layout.districts.flatMap((district) =>
        district.seats.map((seat) => {
          const state = byId.get(seat.sessionId)?.state;
          const alert = state ? ['needsYou', 'trouble'].includes(stateGroup(state)) : false;
          return (
            <group key={seat.sessionId}>
              <Desk hex={seat.hex} state={placements.get(seat.sessionId)?.at.kind === 'desk' ? state : undefined} />
              {alert ? <PulseRing hex={seat.hex} still={reducedMotion} /> : null}
            </group>
          );
        }),
      )}
      {sessions.map((session) => {
        const spot = spots.get(session.sessionId);
        const placement = placements.get(session.sessionId);
        return spot && placement ? (
          <Character key={session.sessionId} session={session} spot={spot} pose={placement.pose} reducedMotion={reducedMotion} />
        ) : null;
      })}
      <DistrictLabels layout={layout} />
      <CameraRig focus={focus} radius={layout.radius} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
