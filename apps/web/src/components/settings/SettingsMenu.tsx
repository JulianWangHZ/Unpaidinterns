import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../../i18n/index.js';
import { AGENT_ICONS } from '../../lib/agent-icons.js';
import { AGENT_KINDS, AGENT_NAMES } from '../../lib/agents.js';
import { SCENE_IDS } from '../../lib/scenes/types.js';
import { saveHiddenAgents, useSettingsStore } from '../../lib/settings.js';
import { SCENE_STORAGE_KEY, useIslandStore } from '../island/island-store.js';
import { GearIcon, PipIcon } from './GearIcon.js';
import { usePipControls } from './pip-context.js';

/** Gear button with a popover for scene, visible agents, language and picture-in-picture. */
export function SettingsMenu() {
  const { t, i18n } = useTranslation();
  const { available: pipAvailable, open: pipOpen, toggle: onTogglePip } = usePipControls();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const scene = useIslandStore((state) => state.scene);
  const setScene = useIslandStore((state) => state.setScene);
  const hidden = useSettingsStore((state) => state.hiddenAgents);
  const toggleAgent = useSettingsStore((state) => state.toggleAgent);

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
            <div className="seg full" role="radiogroup" aria-label={t('scene.label')}>
              {SCENE_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={scene === id}
                  onClick={() => {
                    localStorage.setItem(SCENE_STORAGE_KEY, id);
                    setScene(id);
                  }}
                >
                  {t(`scene.${id}`)}
                </button>
              ))}
            </div>
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
            <div className="seg full" role="radiogroup" aria-label={t('settings.language')}>
              {(['zh-TW', 'en'] as const).map((language) => (
                <button key={language} type="button" role="radio" aria-checked={i18n.language === language} onClick={() => setLanguage(language)}>
                  {language === 'zh-TW' ? '中文' : 'English'}
                </button>
              ))}
            </div>
          </section>
          <section>
            <button type="button" className="row-button" disabled={!pipAvailable} onClick={onTogglePip}>
              <PipIcon />
              <span>{pipOpen ? t('settings.pipClose') : t('settings.pipOpen')}</span>
            </button>
            {pipAvailable ? null : <p className="hint">{t('settings.pipUnsupported')}</p>}
          </section>
        </div>
    </div>
  );
}
