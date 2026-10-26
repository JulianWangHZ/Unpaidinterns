import { stateGroup, type Session } from '@unpaidinterns/core';
import { projectLabel } from '../../lib/labels.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AGENT_NAMES } from '../../lib/agents.js';
import { placeAgents, seatIndexes } from '../../lib/island/behavior.js';
import { SCENES } from '../../lib/scenes/index.js';
import { SCENE_IDS } from '../../lib/scenes/types.js';
import { useSceneManifest } from '../../lib/scenes/use-manifest.js';
import { useSessionStore } from '../../store.js';
import { AgentAvatar } from '../AgentAvatar.js';
import { SessionList } from '../SessionList.js';
import { readSavedScene, SCENE_STORAGE_KEY, useIslandStore } from './island-store.js';
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

function SceneTabs() {
  const { t } = useTranslation();
  const scene = useIslandStore((state) => state.scene);
  const setScene = useIslandStore((state) => state.setScene);
  return (
    <div className="seg scene-tabs" role="tablist" aria-label={t('scene.label')}>
      {SCENE_IDS.map((id) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={scene === id}
          onClick={() => {
            localStorage.setItem(SCENE_STORAGE_KEY, id);
            setScene(id);
          }}
        >
          {t(`scene.${id}`)}
        </button>
      ))}
    </div>
  );
}

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
              onClick={() => select(selected === session.sessionId ? null : session.sessionId)}
            >
              <AgentAvatar agent={session.agent} />
              <span className="side-main">
                <span>
                  {AGENT_NAMES[session.agent]}
                  {session.parentSessionId ? ` · ${t('list.intern')}` : ''} · {projectLabel(session)}
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
  const sceneId = useIslandStore((state) => state.scene);
  const selected = useIslandStore((state) => state.selectedSession);
  const select = useIslandStore((state) => state.select);
  const now = useNow();
  const reducedMotion = useReducedMotion();
  const [webGl] = useState(hasWebGl);
  const manifest = useSceneManifest(sceneId);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    useIslandStore.getState().setScene(readSavedScene(localStorage));
  }, []);

  const sessions = useMemo(() => Object.values(sessionMap), [sessionMap]);
  const placements = useMemo(() => placeAgents(sessions, now), [sessions, now]);
  const seats = useMemo(() => seatIndexes(sessions), [sessions]);

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
      <div className="island-stage" ref={stage}>
        <IslandScene
          htmlPortal={stage}
          scene={SCENES[sceneId]}
          manifest={manifest}
          sessions={sessions}
          placements={placements}
          seats={seats}
          reducedMotion={reducedMotion}
        />
        <div className="stage-bar">
          <SceneTabs />
          {selected ? (
            <button type="button" className="chip overview" onClick={() => select(null)}>
              {t('island.overview')}
            </button>
          ) : null}
        </div>
        {sessions.length === 0 ? <p className="island-empty">{t('island.empty')}</p> : null}
      </div>
      <Sidebar sessions={sessions} />
    </div>
  );
}
