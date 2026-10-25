import { useEffect, useMemo, useState } from 'react';
import { Board } from './components/Board.js';
import { Header } from './components/Header.js';
import { SessionList } from './components/SessionList.js';
import { TaskEditor } from './components/TaskEditor.js';
import { projectsOf } from './lib/filters.js';
import { parseRoute, type Route } from './lib/route.js';
import { connectSessions } from './lib/socket.js';
import { useSessionStore } from './store.js';

function useRoute(): Route {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  useEffect(() => {
    const update = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  return route;
}

export function App() {
  const route = useRoute();
  const tasks = useSessionStore((state) => state.tasks);
  const sessions = useSessionStore((state) => state.sessions);
  const [editing, setEditing] = useState<string | null>(null);
  const projects = useMemo(() => projectsOf(tasks, sessions), [tasks, sessions]);

  useEffect(() => {
    const { apply, setStatus } = useSessionStore.getState();
    const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return connectSessions({ url: `${scheme}://${window.location.host}/ws`, onMessage: apply, onStatus: setStatus });
  }, []);

  return (
    <div className="app">
      <Header route={route} projects={projects} />
      <main className="page">{route === 'board' ? <Board onEdit={setEditing} /> : <SessionList />}</main>
      {editing ? <TaskEditor taskId={editing} projects={projects} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}
