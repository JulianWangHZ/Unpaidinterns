import type { Session } from '@unpaidinterns/core';
import { stateGroup } from '@unpaidinterns/core';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AGENT_ICONS } from '../../lib/agent-icons.js';
import { AGENT_NAMES } from '../../lib/agents.js';
import { formatDuration } from '../../lib/duration.js';

function useTicker(ms: number): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(timer);
  }, [ms]);
  return now;
}

/** What one agent is doing, shown on hover over its character. */
export function AgentCard({ session }: { session: Session }) {
  const { t } = useTranslation();
  const now = useTicker(1000);
  const group = stateGroup(session.state);
  const card = useRef<HTMLDivElement>(null);
  const [shift, setShift] = useState({ x: 0, y: 0 });

  // Keep the card inside the scene: nudge it sideways at the edges and drop it below the tag near the top.
  useLayoutEffect(() => {
    const node = card.current;
    const stage = node?.closest('.island-stage');
    if (!node || !stage) return;
    const box = node.getBoundingClientRect();
    const bounds = stage.getBoundingClientRect();
    const margin = 8;
    const x = Math.max(bounds.left + margin - box.left, Math.min(0, bounds.right - margin - box.right));
    const y = box.top < bounds.top + margin ? box.height + 56 : 0;
    setShift({ x, y });
  }, []);

  return (
    <div ref={card} className="agent-card" data-group={group} style={{ marginLeft: shift.x, marginBottom: -shift.y }}>
      <header>
        <img src={AGENT_ICONS[session.agent]} alt="" width={18} height={18} />
        <div className="ac-title">
          <strong>{session.worktree ?? session.project}</strong>
          <span>
            {AGENT_NAMES[session.agent]}
            {session.worktree ? ` · ${session.project}` : ''}
            {session.parentSessionId ? ` · ${t('list.intern')}` : ''}
          </span>
        </div>
        <span className="ac-state">{t(`state.${session.state}`)}</span>
      </header>
      {session.tool ? (
        <div className="ac-row">
          <span>{t('card.doing')}</span>
          <code>{session.tool}</code>
        </div>
      ) : null}
      {session.detail ? (
        <div className="ac-row">
          <span>{t('card.lastReply')}</span>
          <p>{session.detail}</p>
        </div>
      ) : null}
      <footer>
        <span>{t('card.started', { time: formatDuration(now - session.startedAt) })}</span>
        <span>{t('card.updated', { time: formatDuration(now - session.updatedAt) })}</span>
      </footer>
    </div>
  );
}
