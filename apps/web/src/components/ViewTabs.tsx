import { useTranslation } from 'react-i18next';
import type { Route } from '../lib/route.js';

/** Office / Board switch. Sits at the top-left of the content in both views. */
export function ViewTabs({ route }: { route: Route }) {
  const { t } = useTranslation();
  return (
    <nav className="seg view-tabs" aria-label={t('nav.label')}>
      <a href="#/island" aria-current={route === 'island' ? 'page' : undefined}>
        {t('nav.island')}
      </a>
      <a href="#/board" aria-current={route === 'board' ? 'page' : undefined}>
        {t('nav.board')}
      </a>
    </nav>
  );
}
