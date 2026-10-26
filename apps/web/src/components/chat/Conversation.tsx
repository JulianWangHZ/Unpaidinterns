import { stateGroup, type ChatMessage, type Permission, type Session } from '@unpaidinterns/core';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AGENT_NAMES } from '../../lib/agents.js';
import { api } from '../../lib/api.js';
import { composerState, threadItems } from '../../lib/chat.js';
import { tagLabel } from '../../lib/labels.js';
import { useSessionStore } from '../../store.js';
import { Composer } from './Composer.js';
import { Avatar } from './ContactList.js';

const LONG = 1200;

function Bubble({ message, tail }: { message: ChatMessage; tail: boolean }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const long = message.text.length > LONG;
  return (
    <div className="bubble-row" data-role={message.role}>
      <div className="msg" data-tail={tail || undefined}>
        {long && !open ? `${message.text.slice(0, LONG)}…` : message.text}
        {long ? (
          <button type="button" className="more" onClick={() => setOpen((v) => !v)}>
            {open ? t('chat.less') : t('chat.more')}
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ToolRow({ messages }: { messages: ChatMessage[] }) {
  const { t } = useTranslation();
  return (
    <details className="tool-row">
      <summary>{t('chat.tools', { count: messages.length })}</summary>
      <ul>
        {messages.map((m) => (
          <li key={m.id}>
            <code>{m.text}</code>
          </li>
        ))}
      </ul>
    </details>
  );
}

function useTranscript(session: Session) {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      setMessages(await api.messages(session.sessionId));
      setError(null);
    } catch (cause) {
      setError((cause as Error).message);
    }
  }, [session.sessionId]);
  // Reload whenever the session file changes; the collector reports that as a new updatedAt.
  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load, session.updatedAt]);
  return { messages, error };
}

/** One agent's thread: header, scrolling bubbles and the composer. */
export function Conversation({ session, onBack }: { session: Session; onBack(): void }) {
  const { t, i18n } = useTranslation();
  const run = useSessionStore((state) => state.runs[session.sessionId]);
  const { messages, error } = useTranscript(session);
  const [sendError, setSendError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);
  const state = composerState(session, run);
  const busy = stateGroup(session.state) === 'working' || run?.status === 'running';
  const time = new Intl.DateTimeFormat(i18n.language, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });

  useLayoutEffect(() => {
    const node = scroller.current;
    if (node && pinned.current) node.scrollTop = node.scrollHeight;
  }, [messages, busy]);

  const send = async (text: string, options: { permission: Permission; mode: 'resume' | 'fork' }) => {
    try {
      await api.send(session.sessionId, { text, ...options });
      setSendError(null);
      pinned.current = true;
      return true;
    } catch (cause) {
      setSendError((cause as Error).message);
      return false;
    }
  };

  return (
    <div className="conversation">
      <header className="conv-head">
        <button type="button" className="back" aria-label={t('chat.back')} onClick={onBack}>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <Avatar session={session} size={34} />
        <div className="conv-title">
          <strong>{tagLabel(session)}</strong>
          <span>
            {AGENT_NAMES[session.agent]}
            {session.worktree ? ` · ${session.project}` : ''}
          </span>
        </div>
        <span className="ac-state" data-group={stateGroup(session.state)}>
          {t(`state.${session.state}`)}
        </span>
      </header>
      <div
        className="thread"
        ref={scroller}
        onScroll={(event) => {
          const node = event.currentTarget;
          pinned.current = node.scrollHeight - node.scrollTop - node.clientHeight < 40;
        }}
      >
        {messages === null && !error ? <p className="chat-empty">{t('chat.loading')}</p> : null}
        {error ? <p className="chat-error">{error}</p> : null}
        {messages?.length === 0 ? <p className="chat-empty">{t('chat.noMessages')}</p> : null}
        {threadItems(messages ?? []).map((item) =>
          item.kind === 'time' ? (
            <p key={item.key} className="thread-time">
              {time.format(item.ts)}
            </p>
          ) : item.kind === 'tools' ? (
            <ToolRow key={item.key} messages={item.messages} />
          ) : (
            <Bubble key={item.key} message={item.message} tail={item.tail} />
          ),
        )}
        {busy ? (
          <div className="bubble-row" data-role="assistant">
            <div className="msg typing" aria-label={t('chat.typing')}>
              <i />
              <i />
              <i />
            </div>
          </div>
        ) : null}
        {run?.status === 'failed' ? <p className="chat-error">{t('chat.runFailed', { error: run.error ?? '' })}</p> : null}
        {sendError ? <p className="chat-error">{sendError}</p> : null}
      </div>
      <Composer session={session} state={state} onSend={send} />
    </div>
  );
}
