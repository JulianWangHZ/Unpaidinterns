import type { AgentKind, Session, SessionState } from '@unpaidinterns/core';
import { useEffect, useMemo } from 'react';
import { groupSessions } from './lib/group.js';
import { connectSessions } from './lib/socket.js';
import { useSessionStore } from './store.js';

const AGENT_LABELS: Record<AgentKind, string> = { claude: 'Claude', codex: 'Codex', gemini: 'Gemini' };

const STATE_LABELS: Record<SessionState, string> = {
  thinking: 'Thinking',
  running: 'Running',
  writing: 'Writing reply',
  waiting: 'Needs you',
  done: 'Done',
  interrupted: 'Interrupted',
  error: 'Error',
  idle: 'Idle',
};

function SessionSection({ title, sessions }: { title: string; sessions: Session[] }) {
  if (sessions.length === 0) return null;
  return (
    <section className="group">
      <h2>
        {title} <span className="count">{sessions.length}</span>
      </h2>
      <ul>
        {sessions.map((session) => (
          <li key={session.sessionId} className="row" data-state={session.state}>
            <span className="agent" data-agent={session.agent}>
              {AGENT_LABELS[session.agent]}
              {session.parentSessionId ? ' · intern' : ''}
            </span>
            <span className="project">{session.project}</span>
            <span className="state">{STATE_LABELS[session.state]}</span>
            <code className="tool">{session.tool ?? ''}</code>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function App() {
  const sessions = useSessionStore((state) => state.sessions);
  const status = useSessionStore((state) => state.status);
  const apply = useSessionStore((state) => state.apply);
  const setStatus = useSessionStore((state) => state.setStatus);

  useEffect(() => {
    const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return connectSessions({ url: `${scheme}://${window.location.host}/ws`, onMessage: apply, onStatus: setStatus });
  }, [apply, setStatus]);

  const groups = useMemo(() => groupSessions(Object.values(sessions)), [sessions]);
  const isEmpty = Object.keys(sessions).length === 0;

  return (
    <main className="page">
      <header className="top">
        <h1>Unpaidinterns</h1>
        {status === 'closed' ? <p className="banner">Reconnecting…</p> : null}
      </header>
      {isEmpty && status === 'open' ? (
        <p className="empty">No active sessions. Start Claude Code in any project and it shows up here.</p>
      ) : null}
      <SessionSection title="Needs you" sessions={groups.needsYou} />
      <SessionSection title="Working" sessions={groups.working} />
      <SessionSection title="Resting" sessions={groups.resting} />
    </main>
  );
}
