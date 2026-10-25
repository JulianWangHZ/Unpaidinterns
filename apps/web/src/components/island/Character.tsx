import type { Session } from '@unpaidinterns/core';
import { stateGroup } from '@unpaidinterns/core';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Vector3, type Group } from 'three';
import { AGENT_NAMES } from '../../lib/agents.js';
import type { Pose } from '../../lib/island/behavior.js';
import type { Spot } from '../../lib/island/positions.js';
import { Figure, type Motion } from './Figure.js';
import { useIslandStore } from './island-store.js';

export const AGENT_COLORS = { claude: '#e07a5f', codex: '#10a37f', gemini: '#4285f4' } as const;

const WALK_SPEED = 1.6;
const ARRIVED = 0.02;

interface CharacterProps {
  session: Session;
  spot: Spot;
  pose: Pose;
  reducedMotion: boolean;
}

/** One agent on the island. It walks to its spot, then plays the pose for its state. */
export function Character({ session, spot, pose, reducedMotion }: CharacterProps) {
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

  useFrame((_, delta) => {
    const node = group.current;
    if (!node) return;
    target.current.set(...spot.position);
    const offset = target.current.clone().sub(node.position);
    const distance = offset.length();
    if (reducedMotion || distance > 12) {
      node.position.copy(target.current);
    } else if (distance > ARRIVED) {
      node.position.add(offset.multiplyScalar(Math.min(1, (WALK_SPEED * delta) / distance)));
      node.rotation.y = Math.atan2(offset.x, offset.z);
    }
    motion.current.walking = !reducedMotion && distance > ARRIVED;
    if (!motion.current.walking) node.rotation.y = spot.facing;
  });

  return (
    <group
      ref={group}
      position={start.current}
      onPointerOver={(event) => {
        event.stopPropagation();
        hover(session.sessionId);
      }}
      onPointerOut={() => hover(null)}
      onClick={(event) => {
        event.stopPropagation();
        select(session.sessionId, session.project);
      }}
    >
      <Figure
        color={AGENT_COLORS[session.agent]}
        pose={pose}
        motion={motion}
        still={reducedMotion}
        scale={intern ? 0.72 : 1}
        opacity={intern ? 0.75 : 1}
      />
      {/* The Html node stays mounted; toggling it on hover would make drei detach DOM nodes mid-render. */}
      <Html position={[0, intern ? 0.85 : 1.08, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
        <div className="bubble" data-alert={alert || undefined} hidden={!(alert || hovered || selected)}>
          <strong>{AGENT_NAMES[session.agent]}</strong> · {t(`state.${session.state}`)}
          {hovered || selected ? <span className="bubble-tool">{session.tool ?? session.project}</span> : null}
        </div>
      </Html>
    </group>
  );
}
