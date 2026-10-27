import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { routeHash, type Route } from '../lib/route.js';
import { Segmented } from './Segmented.js';

/**
 * Office / Board switch. Buttons set the main window's hash, so the switch also works from the
 * picture-in-picture window, whose own address is not the app's.
 */
export function ViewTabs({ route }: { route: Route }) {
  const { t } = useTranslation();
  const options = useMemo(
    () => [
      { value: 'island' as const, label: t('nav.island') },
      { value: 'board' as const, label: t('nav.board') },
    ],
    [t],
  );
  return (
    <Segmented
      kind="tab"
      className="view-tabs"
      label={t('nav.label')}
      options={options}
      value={route}
      onChange={(value) => {
        window.location.hash = routeHash(value);
      }}
    />
  );
}
