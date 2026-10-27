import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../../i18n/index.js';
import { AGENT_ICONS } from '../../lib/agent-icons.js';
import { AGENT_KINDS, AGENT_NAMES } from '../../lib/agents.js';
import { SCENE_IDS } from '../../lib/scenes/types.js';
import { saveHiddenAgents, useSettingsStore } from '../../lib/settings.js';
import { saveTheme, type Theme } from '../../lib/theme.js';
import { Segmented } from '../Segmented.js';
import { SCENE_STORAGE_KEY, useIslandStore } from '../island/island-store.js';
import { GearIcon, ThemeIcon } from './GearIcon.js';

/** Gear button with a popover for scene, appearance, visible agents and language. */
export function SettingsMenu() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const scene = useIslandStore((state) => state.scene);
  const setScene = useIslandStore((state) => state.setScene);
  const hidden = useSettingsStore((state) => state.hiddenAgents);
  const toggleAgent = useSettingsStore((state) => state.toggleAgent);
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const chooseTheme = (value: Theme) => {
    saveTheme(localStorage, value);
    setTheme(value);
  };

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !root.current?.contains(event.target as Node)) setOpen(false);
    };
    // The menu may live in the picture-in-picture window, which has its own document.
    const doc = root.current?.ownerDocument ?? document;
    doc.addEventListener('pointerdown', close);
    doc.addEventListener('keydown', close);
    return () => {
      doc.removeEventListener('pointerdown', close);
      doc.removeEventListener('keydown', close);
    };
  }, [open]);

  useEffect(() => saveHiddenAgents(localStorage, hidden), [hidden]);

  return (
    <div className="settings" ref={root}>
      <button
        type="button"
        className="gear"
        aria-label={t('settings.open')}
        aria-expanded={open}
        aria-haspopup="dialog"
        data-open={open || undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <GearIcon />
      </button>
      {/* Always mounted so opening and closing are CSS transitions that can reverse mid-way. */}
      <div className="settings-pop" role="dialog" aria-label={t('settings.title')} data-open={open || undefined} aria-hidden={!open} inert={!open}>
          <section>
            <h3>{t('scene.label')}</h3>
            <Segmented
              kind="radio"
              className="full"
              label={t('scene.label')}
              options={SCENE_IDS.map((id) => ({ value: id, label: t(`scene.${id}`) }))}
              value={scene}
              onChange={(id) => {
                localStorage.setItem(SCENE_STORAGE_KEY, id);
                setScene(id);
              }}
            />
          </section>
          <section>
            <h3>{t('settings.theme')}</h3>
            <Segmented
              kind="radio"
              className="full"
              label={t('settings.theme')}
              options={(['day', 'night'] as const).map((value) => ({
                value,
                label: (
                  <>
                    <ThemeIcon kind={value} />
                    {t(`settings.${value}`)}
                  </>
                ),
              }))}
              value={theme}
              onChange={chooseTheme}
            />
          </section>
          <section>
            <h3>{t('settings.agents')}</h3>
            <ul className="agent-switches">
              {AGENT_KINDS.map((agent) => {
                const shown = !hidden.includes(agent);
                return (
                  <li key={agent}>
                    <img src={AGENT_ICONS[agent]} alt="" width={18} height={18} />
                    <span>{AGENT_NAMES[agent]}</span>
                    <button type="button" role="switch" aria-checked={shown} aria-label={AGENT_NAMES[agent]} className="switch" onClick={() => toggleAgent(agent)}>
                      <span />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
          <section>
            <h3>{t('settings.language')}</h3>
            <Segmented
              kind="radio"
              className="full"
              label={t('settings.language')}
              options={[
                { value: 'zh-TW' as const, label: '中文' },
                { value: 'en' as const, label: 'English' },
              ]}
              value={i18n.language === 'en' ? 'en' : 'zh-TW'}
              onChange={setLanguage}
            />
          </section>
        </div>
    </div>
  );
}
