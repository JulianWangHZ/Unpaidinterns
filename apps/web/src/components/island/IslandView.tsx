import { stateGroup, type Session } from '@unpaidinterns/core';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AGENT_NAMES } from '../../lib/agents.js';
import { placeAgents } from '../../lib/island/behavior.js';
import { assignSlots, buildLayout } from '../../lib/island/layout.js';
import { loadSlots, saveSlots } from '../../lib/island/slots.js';
import { useSessionStore } from '../../store.js';
import { AgentAvatar } from '../AgentAvatar.js';
import { SessionList } from '../SessionList.js';
import { useIslandStore } from './island-store.js';
import { IslandScene } from './IslandScene.js';

const CLOCK_MS = 15_000;

function useNow(): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), CLOCK_MS);
    return () => clearInterval(timer);
  }, []);
  return now;
}

function useReducedMotion(): boolean {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return reduced;
}

function hasWebGl(): boolean {
  try {
    return Boolean(document.createElement('canvas').getContext('webgl2'));
  } catch {
    return false;
  }
}

const rank = (session: Session) => ({ needsYou: 0, trouble: 0, working: 1, resting: 2 })[stateGroup(session.state)];

function Sidebar({ sessions }: { sessions: Session[] }) {
  const { t } = useTranslation();
  const selected = useIslandStore((state) => state.selectedSession);
  const select = useIslandStore((state) => state.select);
  const sorted = [...sessions].sort((a, b) => rank(a) - rank(b) || b.updatedAt - a.updatedAt);
  return (
    <aside className="island-side" aria-label={t('island.agents')}>
      <h2>
        {t('island.agents')} <small>{sessions.length}</small>
      </h2>
      <ul>
        {sorted.map((session) => (
          <li key={session.sessionId}>
            <button
              type="button"
              className="side-row"
              data-state={session.state}
              aria-pressed={selected === session.sessionId}
              onClick={() => select(session.sessionId, session.project)}
            >
              <AgentAvatar agent={session.agent} />
              <span className="side-main">
                <span>
                  {AGENT_NAMES[session.agent]}
                  {session.parentSessionId ? ` · ${t('list.intern')}` : ''} · {session.project}
                </span>
                <span className="side-state">{t(`state.${session.state}`)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default function IslandView() {
  const { t } = useTranslation();
  const sessionMap = useSessionStore((state) => state.sessions);
  const focusProject = useIslandStore((state) => state.focusProject);
  const selected = useIslandStore((state) => state.selectedSession);
  const focus = useIslandStore((state) => state.focus);
  const now = useNow();
  const reducedMotion = useReducedMotion();
  const [webGl] = useState(hasWebGl);

  const sessions = useMemo(() => Object.values(sessionMap), [sessionMap]);
  const projects = useMemo(
    () => [...new Set([...sessions].sort((a, b) => a.startedAt - b.startedAt).map((s) => s.project))],
    [sessions],
  );
  const slots = useMemo(() => assignSlots(projects, loadSlots(localStorage)), [projects]);
  useEffect(() => saveSlots(localStorage, slots), [slots]);

  const layout = useMemo(() => buildLayout(sessions, slots), [sessions, slots]);
  const placements = useMemo(() => placeAgents(sessions, now), [sessions, now]);

  if (!webGl) {
    return (
      <div>
        <p className="error-banner" role="status">
          {t('island.noWebgl')}
        </p>
        <SessionList />
      </div>
    );
  }

  return (
    <div className="island">
      <div className="island-stage">
        <IslandScene layout={layout} sessions={sessions} placements={placements} reducedMotion={reducedMotion} />
        {focusProject || selected ? (
          <button type="button" className="chip overview" onClick={() => focus(null)}>
            {t('island.overview')}
          </button>
        ) : null}
        {sessions.length === 0 ? <p className="island-empty">{t('island.empty')}</p> : null}
      </div>
      <Sidebar sessions={sessions} />
    </div>
  );
}
