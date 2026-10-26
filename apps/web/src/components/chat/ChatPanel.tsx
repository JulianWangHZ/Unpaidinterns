import type { Session } from '@unpaidinterns/core';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useIslandStore } from '../island/island-store.js';
import { ContactList } from './ContactList.js';
import { Conversation } from './Conversation.js';

function useNow(ms: number): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(timer);
  }, [ms]);
  return now;
}

/** Right-hand panel: the agent list, or a conversation with whoever is selected in the scene or the list. */
export function ChatPanel({ sessions }: { sessions: Session[] }) {
  const { t } = useTranslation();
  const selected = useIslandStore((state) => state.selectedSession);
  const select = useIslandStore((state) => state.select);
  const now = useNow(15_000);
  const session = sessions.find((s) => s.sessionId === selected);
  return (
    <aside className="chat-panel" aria-label={t('chat.title')}>
      {session ? (
        <Conversation key={session.sessionId} session={session} onBack={() => select(null)} />
      ) : (
        <ContactList sessions={sessions} now={now} onOpen={(id) => select(id)} />
      )}
    </aside>
  );
}
