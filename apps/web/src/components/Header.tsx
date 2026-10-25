import { useTranslation } from 'react-i18next';
import { setLanguage } from '../i18n/index.js';
import { AGENT_KINDS, AGENT_NAMES } from '../lib/agents.js';
import { useFilterStore } from '../lib/filters.js';
import type { Route } from '../lib/route.js';
import { useSessionStore } from '../store.js';
import { AgentAvatar } from './AgentAvatar.js';

export function Header({ route, projects }: { route: Route; projects: string[] }) {
  const { t, i18n } = useTranslation();
  const status = useSessionStore((state) => state.status);
  const { project, query, hiddenAgents, setProject, setQuery, toggleAgent } = useFilterStore();

  return (
    <header className="top">
      <span className="brand">Unpaidinterns</span>
      <nav className="seg" aria-label={t('nav.label')}>
        <a href="#/island" aria-current={route === 'island' ? 'page' : undefined}>
          {t('nav.island')}
        </a>
        <a href="#/board" aria-current={route === 'board' ? 'page' : undefined}>
          {t('nav.board')}
        </a>
      </nav>
      {status === 'closed' ? (
        <span className="banner" role="status">
          {t('connection.reconnecting')}
        </span>
      ) : null}
      <div className="filters">
        <select className="chip" value={project} onChange={(e) => setProject(e.target.value)} aria-label={t('filter.allProjects')}>
          <option value="">{t('filter.allProjects')}</option>
          {projects.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <div className="chip agents" role="group" aria-label={t('filter.agents')}>
          {AGENT_KINDS.map((agent) => (
            <button
              key={agent}
              type="button"
              className="agent-toggle"
              aria-pressed={!hiddenAgents.includes(agent)}
              aria-label={AGENT_NAMES[agent]}
              onClick={() => toggleAgent(agent)}
            >
              <AgentAvatar agent={agent} size={14} />
            </button>
          ))}
        </div>
        <input
          className="chip search"
          type="search"
          value={query}
          placeholder={t('filter.search')}
          aria-label={t('filter.search')}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="button"
          className="chip"
          aria-label={t('language.label')}
          onClick={() => setLanguage(i18n.language === 'zh-TW' ? 'en' : 'zh-TW')}
        >
          {t('language.switch')}
        </button>
      </div>
    </header>
  );
}
