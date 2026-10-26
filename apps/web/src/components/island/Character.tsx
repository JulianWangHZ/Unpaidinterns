import type { Session } from '@unpaidinterns/core';
import { AGENT_ICONS } from '../../lib/agent-icons.js';
import { projectLabel, tagLabel } from '../../lib/labels.js';
import { stateGroup } from '@unpaidinterns/core';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Suspense, useMemo, useRef, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { Vector3, type Group } from 'three';
import { AGENT_NAMES } from '../../lib/agents.js';
import type { Pose } from '../../lib/island/behavior.js';
import type { Outfit, Spot } from '../../lib/scenes/types.js';
import { lookFor } from '../../lib/characters/look.js';
import { AgentBadge } from './characters/AgentBadge.js';
import { Mini } from './characters/Mini.js';
import type { Motion } from './characters/motion.js';
import { useIslandStore } from './island-store.js';
import { ModelCharacter } from './ModelCharacter.js';

export const AGENT_COLORS = { claude: '#e07a5f', codex: '#10a37f', gemini: '#4285f4' } as const;

// Units per second, scaled with the character so big indoor scenes do not take forever to cross.
const WALK_SPEED = 2.4;
/** Desk poses done sitting in the office chair. Waving stands up. */
const DESK_SEATED: ReadonlySet<Pose> = new Set(['think', 'type', 'typeSlow', 'slump']);
const ARRIVED = 0.02;

interface CharacterProps {
  session: Session;
  spot: Spot;
  pose: Pose;
  outfit: Outfit;
  model: { url: string; scale: number } | null;
  nameTag: boolean;
  scale: number;
  htmlPortal: RefObject<HTMLDivElement | null>;
  reducedMotion: boolean;
}

/** One agent in the scene. It walks to its spot, then plays the pose for its state. */
export function Character({ session, spot, pose, outfit, model, nameTag, scale, htmlPortal, reducedMotion }: CharacterProps) {
  const { t } = useTranslation();
  const group = useRef<Group>(null);
  const motion = useRef<Motion>({ walking: false });
  const target = useRef(new Vector3());
  // Only the first spot is passed as a prop; later spots are walked to in useFrame.
  const start = useRef(spot.position);
  const { hover, select } = useIslandStore.getState();
  const hovered = useIslandStore((state) => state.hoveredSession === session.sessionId);
  const selected = useIslandStore((state) => state.selectedSession === session.sessionId);
  const intern = Boolean(session.parentSessionId);
  const alert = ['needsYou', 'trouble'].includes(stateGroup(session.state));
  const brand = AGENT_COLORS[session.agent];
  const look = useMemo(() => lookFor(session.sessionId), [session.sessionId]);
  const seated = spot.seated ?? DESK_SEATED.has(pose);
  const height = ((outfit.headwear === 'mascot' ? 1.12 : 1.0) - (seated ? 0.06 : 0)) * scale;

  useFrame((_, delta) => {
    const node = group.current;
    if (!node) return;
    target.current.set(...spot.position);
    const offset = target.current.clone().sub(node.position);
    const distance = offset.length();
    // Changing floors jumps straight there; walking would cut through the ceiling.
    if (reducedMotion || distance > 14 || Math.abs(offset.y) > 0.5) {
      node.position.copy(target.current);
    } else if (distance > ARRIVED) {
      node.position.add(offset.multiplyScalar(Math.min(1, (WALK_SPEED * scale * delta) / distance)));
      node.rotation.y = Math.atan2(offset.x, offset.z);
    }
    motion.current.walking = !reducedMotion && distance > ARRIVED;
    if (!motion.current.walking) node.rotation.y = spot.facing;
  });

  const figure = (
    <Mini
      look={look}
      shirt={outfit.body ?? brand}
      pose={pose}
      seated={seated}
      headwear={outfit.headwear}
      headwearColor={outfit.headwearColor}
      extra={outfit.extra}
      motion={motion}
      still={reducedMotion}
      opacity={intern ? 0.85 : 1}
    />
  );

  return (
    <group
      ref={group}
      position={start.current}
      scale={(intern ? 0.72 : 1) * scale}
      onPointerOver={(event) => {
        event.stopPropagation();
        hover(session.sessionId);
      }}
      onPointerOut={() => hover(null)}
      onClick={(event) => {
        event.stopPropagation();
        select(session.sessionId);
      }}
    >
      {model ? (
        <Suspense fallback={figure}>
          <ModelCharacter url={model.url} scale={model.scale} pose={pose} motion={motion} />
        </Suspense>
      ) : (
        figure
      )}
      <AgentBadge color={brand} height={height / scale} />
      {/* Always mounted, into a fixed container: remounting drei Html under React 19 can leave it empty. */}
      <Html
        portal={htmlPortal as RefObject<HTMLElement>}
        position={[0, (height + 0.22) / scale, 0]}
        center
        zIndexRange={[40, 21]}
        style={{ pointerEvents: 'none' }}
      >
        {nameTag ? (
          <div className="nametag" data-alert={alert || undefined} data-selected={hovered || selected || undefined}>
            <span className="nt-name" style={{ background: brand }}>
              <img className="nt-icon" src={AGENT_ICONS[session.agent]} alt={AGENT_NAMES[session.agent]} />
              {tagLabel(session)}
              {intern ? ` · ${t('list.intern')}` : ''}
            </span>
            <span className="nt-state">{t(`state.${session.state}`)}</span>
            {hovered || selected ? <span className="nt-tool">{session.tool ?? ''}</span> : null}
          </div>
        ) : (
          <div className="bubble" data-alert={alert || undefined} hidden={!(alert || hovered || selected)}>
            <strong>{AGENT_NAMES[session.agent]}</strong> · {t(`state.${session.state}`)}
            {hovered || selected ? <span className="bubble-tool">{projectLabel(session)}{session.tool ? ` · ${session.tool}` : ''}</span> : null}
          </div>
        )}
      </Html>
    </group>
  );
}
