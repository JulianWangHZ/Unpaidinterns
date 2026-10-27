import { useTranslation } from 'react-i18next';
import { routeHash, type Route } from '../lib/route.js';

const ROUTES: readonly Route[] = ['island', 'board'];

/**
 * Office / Board switch. Buttons set the main window's hash, so the switch also works from the
 * picture-in-picture window, whose own address is not the app's.
 */
export function ViewTabs({ route }: { route: Route }) {
  const { t } = useTranslation();
  return (
    <div className="seg view-tabs" role="tablist" aria-label={t('nav.label')}>
      {ROUTES.map((value) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={route === value}
          onClick={() => {
            window.location.hash = routeHash(value);
          }}
        >
          {t(value === 'island' ? 'nav.island' : 'nav.board')}
        </button>
      ))}
    </div>
  );
}
