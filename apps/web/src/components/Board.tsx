import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Route } from '../lib/route.js';
import { useSettingsStore, visibleSessions } from '../lib/settings.js';
import { boardLanes, LANES } from '../lib/status-counts.js';
import { useSessionStore } from '../store.js';
import { useCompact } from './compact.js';
import { AgentCard } from './island/AgentCard.js';
import { ViewBar } from './ViewBar.js';

/** Every agent as a card, side by side in three lanes: needs you, working and done. */
export function Board({ route }: { route: Route }) {
  const compact = useCompact();
  const { t } = useTranslation();
  const sessions = useSessionStore((state) => state.sessions);
  const hidden = useSettingsStore((state) => state.hiddenAgents);
  const lanes = useMemo(() => boardLanes(Object.values(visibleSessions(sessions, hidden))), [sessions, hidden]);

  return (
    <>
      {compact ? null : <ViewBar route={route} />}
      <div className="lanes" data-compact={compact || undefined}>
        {LANES.map((lane) => (
          <section key={lane} className="lane" data-lane={lane} aria-labelledby={`lane-${lane}`}>
            <h2 id={`lane-${lane}`}>
              <i aria-hidden="true" />
              {t(`summary.${lane}`)}
              <small>{lanes[lane].length}</small>
            </h2>
            <div className="lane-cards">
              {lanes[lane].map((session) => (
                <AgentCard key={session.sessionId} session={session} pinned={false} actions />
              ))}
              {lanes[lane].length === 0 ? <p className="lane-empty">{t(`board.empty.${lane}`)}</p> : null}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
