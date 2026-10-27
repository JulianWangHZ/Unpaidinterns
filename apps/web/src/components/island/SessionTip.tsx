import type { Session } from '@unpaidinterns/core';
import { useLayoutEffect, useRef, useState } from 'react';
import { placeTip } from '../../lib/tip-position.js';
import { AgentCard } from './AgentCard.js';
import { useIslandStore } from './island-store.js';

/** The session card for whoever is hovered, or pinned by a click, floating beside the pointer. */
export function SessionTip({ sessions }: { sessions: Session[] }) {
  const selected = useIslandStore((state) => state.selectedSession);
  const hovered = useIslandStore((state) => state.hoveredSession);
  const at = useIslandStore((state) => state.tipAt);
  const id = selected ?? hovered;
  const session = sessions.find((s) => s.sessionId === id);
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const node = box.current;
    if (!node || !at) return;
    setPos(placeTip(at, { width: node.offsetWidth, height: node.offsetHeight }, { width: window.innerWidth, height: window.innerHeight }));
  }, [at, id, session]);

  if (!session || !at) return null;
  return (
    <div ref={box} className="session-tip" style={pos ? { left: pos.left, top: pos.top } : { visibility: 'hidden' }}>
      <AgentCard session={session} pinned={selected === session.sessionId} />
    </div>
  );
}
