import { useTranslation } from 'react-i18next';
import { PipIcon } from './GearIcon.js';
import { usePipControls } from './pip-context.js';

/** Toolbar icon that opens the picture-in-picture window, or closes it when it is open. */
export function PipButton() {
  const { t } = useTranslation();
  const { available, open, toggle } = usePipControls();
  const label = available ? t(open ? 'settings.pipClose' : 'settings.pipOpen') : t('settings.pipUnsupported');
  return (
    <button
      type="button"
      className="tool-button"
      aria-label={label}
      aria-pressed={open}
      // aria-disabled rather than disabled, so the tooltip still explains why on hover.
      aria-disabled={!available || undefined}
      data-tip={label}
      data-open={open || undefined}
      onClick={available ? toggle : undefined}
    >
      <PipIcon />
    </button>
  );
}
