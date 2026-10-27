import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Board } from './components/Board.js';
import { Header } from './components/Header.js';
import { CompactContext } from './components/compact.js';
import { PipContext } from './components/settings/pip-context.js';
import { StatusSummary } from './components/StatusSummary.js';
import { ViewTabs } from './components/ViewTabs.js';
import { TaskEditor } from './components/TaskEditor.js';
import { openPipWindow, pipSupported } from './lib/pip.js';
import { parseRoute, type Route } from './lib/route.js';
import { loadHiddenAgents, useSettingsStore } from './lib/settings.js';
import { connectSessions } from './lib/socket.js';
import { useSessionStore } from './store.js';

// The 3D bundle only loads when the office is opened.
const IslandView = lazy(() => import('./components/island/IslandView.js'));

const PIP_SIZE = { width: 720, height: 480 };
/** `?pip=1` renders the picture-in-picture layout in a normal tab, for previews and tests. */
const PIP_PREVIEW = new URLSearchParams(window.location.search).get('pip') === '1';

function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  useEffect(() => {
    const update = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  return route;
}

/** The current view renders into a picture-in-picture window while one is open, and back into the page after. */
function usePictureInPicture() {
  const [pip, setPip] = useState<Window | null>(null);
  const toggle = useCallback(async () => {
    if (pip) {
      pip.close();
      return;
    }
    const opened = await openPipWindow(PIP_SIZE.width, PIP_SIZE.height);
    opened.addEventListener('pagehide', () => setPip(null), { once: true });
    setPip(opened);
  }, [pip]);
  return { pip, toggle, available: pipSupported() };
}

export function App() {
  const { t } = useTranslation();
  const route = useRoute();
  const [editing, setEditing] = useState<string | null>(null);
  const { pip, toggle, available } = usePictureInPicture();

  useEffect(() => {
    useSettingsStore.getState().setHiddenAgents(loadHiddenAgents(localStorage));
    const { apply, setStatus } = useSessionStore.getState();
    const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return connectSessions({ url: `${scheme}://${window.location.host}/ws`, onMessage: apply, onStatus: setStatus });
  }, []);

  const view =
    route === 'board' ? (
      <Board route={route} onEdit={setEditing} />
    ) : (
      <Suspense fallback={<p className="empty">{t('island.loading')}</p>}>
        <IslandView route={route} />
      </Suspense>
    );

  const pipControls = { available, open: pip !== null, toggle: () => void toggle() };

  const compactView = (
    <CompactContext.Provider value>
      <div className="pip-page">
        <div className="pip-bar">
          <ViewTabs route={route} />
          <StatusSummary compact />
        </div>
        <div className="pip-content">{view}</div>
      </div>
    </CompactContext.Provider>
  );

  if (PIP_PREVIEW) return compactView;

  return (
    <PipContext.Provider value={pipControls}>
      <div className="app">
        <Header />
        <main className="page">
          {pip ? (
            <div className="pip-placeholder">
              <p>{t('settings.pipActive')}</p>
              <button type="button" className="btn" onClick={() => pip.close()}>
                {t('settings.pipClose')}
              </button>
            </div>
          ) : (
            view
          )}
        </main>
        {pip ? createPortal(compactView, pip.document.body) : null}
        {editing ? <TaskEditor taskId={editing} onClose={() => setEditing(null)} /> : null}
      </div>
    </PipContext.Provider>
  );
}
