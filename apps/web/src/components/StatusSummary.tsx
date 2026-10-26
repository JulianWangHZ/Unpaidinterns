import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore, visibleSessions } from '../lib/settings.js';
import { statusCounts, type StatusCounts } from '../lib/status-counts.js';
import { useSessionStore } from '../store.js';

const ITEMS: ReadonlyArray<keyof StatusCounts> = ['needsYou', 'working', 'done'];

/** Three headline counts in the top bar, following the agent visibility setting. */
export function StatusSummary() {
  const { t } = useTranslation();
  const sessions = useSessionStore((state) => state.sessions);
  const hidden = useSettingsStore((state) => state.hiddenAgents);
  const counts = useMemo(() => statusCounts(Object.values(visibleSessions(sessions, hidden))), [sessions, hidden]);
  return (
    <dl className="status-summary" aria-label={t('summary.label')}>
      {ITEMS.map((key) => (
        <div key={key} className="stat" data-kind={key} data-active={counts[key] > 0 || undefined}>
          <dt>{t(`summary.${key}`)}</dt>
          <dd>{counts[key]}</dd>
        </div>
      ))}
    </dl>
  );
}
