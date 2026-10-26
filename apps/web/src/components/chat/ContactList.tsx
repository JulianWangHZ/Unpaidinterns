import { stateGroup, type Session } from '@unpaidinterns/core';
import { useTranslation } from 'react-i18next';
import { AGENT_ICONS } from '../../lib/agent-icons.js';
import { AGENT_NAMES } from '../../lib/agents.js';
import { formatDuration } from '../../lib/duration.js';
import { tagLabel } from '../../lib/labels.js';

const rank = (session: Session) => ({ needsYou: 0, trouble: 0, working: 1, resting: 2 })[stateGroup(session.state)];

export function Avatar({ session, size = 40 }: { session: Session; size?: number }) {
  return (
    <span className="chat-avatar" style={{ width: size, height: size }} data-group={stateGroup(session.state)}>
      <img src={AGENT_ICONS[session.agent]} alt={AGENT_NAMES[session.agent]} />
      <i aria-hidden="true" />
    </span>
  );
}

/** Every agent as a conversation, the ones that need you first. */
export function ContactList({ sessions, now, onOpen }: { sessions: Session[]; now: number; onOpen(id: string): void }) {
  const { t } = useTranslation();
  const sorted = [...sessions].sort((a, b) => rank(a) - rank(b) || b.updatedAt - a.updatedAt);
  return (
    <div className="contacts">
      <h2>
        {t('chat.title')} <small>{sessions.length}</small>
      </h2>
      {sorted.length === 0 ? <p className="chat-empty">{t('island.empty')}</p> : null}
      <ul>
        {sorted.map((session) => (
          <li key={session.sessionId}>
            <button type="button" className="contact" onClick={() => onOpen(session.sessionId)}>
              <Avatar session={session} />
              <span className="contact-main">
                <span className="contact-top">
                  <strong>{tagLabel(session)}</strong>
                  <time>{formatDuration(now - session.updatedAt)}</time>
                </span>
                <span className="contact-preview" data-group={stateGroup(session.state)}>
                  {session.parentSessionId ? `${t('list.intern')} · ` : ''}
                  {session.detail ?? session.tool ?? t(`state.${session.state}`)}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
