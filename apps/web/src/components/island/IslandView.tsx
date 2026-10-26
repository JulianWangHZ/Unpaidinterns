import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { placeAgents, seatIndexes } from '../../lib/island/behavior.js';
import { SCENES } from '../../lib/scenes/index.js';
import { useSceneManifest } from '../../lib/scenes/use-manifest.js';
import { useSessionStore } from '../../store.js';
import { ChatPanel } from '../chat/ChatPanel.js';
import { SessionList } from '../SessionList.js';
import type { Route } from '../../lib/route.js';
import { useSettingsStore, visibleSessions } from '../../lib/settings.js';
import { ViewBar } from '../ViewBar.js';
import { readSavedScene, useIslandStore } from './island-store.js';
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

export default function IslandView({ route }: { route: Route }) {
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

  const hiddenAgents = useSettingsStore((state) => state.hiddenAgents);
  const sessions = useMemo(() => Object.values(visibleSessions(sessionMap, hiddenAgents)), [sessionMap, hiddenAgents]);
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
        <ViewBar route={route} className="stage-bar">
          {selected ? (
            <button type="button" className="chip overview" onClick={() => select(null)}>
              {t('island.overview')}
            </button>
          ) : null}
        </ViewBar>
        {sessions.length === 0 ? <p className="island-empty">{t('island.empty')}</p> : null}
      </div>
      <ChatPanel sessions={sessions} />
    </div>
  );
}
