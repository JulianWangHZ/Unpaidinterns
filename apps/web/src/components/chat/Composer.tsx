import { PERMISSIONS, type Permission, type Session } from '@unpaidinterns/core';
import { useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { AGENT_NAMES } from '../../lib/agents.js';
import type { ComposerState } from '../../lib/chat.js';

interface ComposerProps {
  session: Session;
  state: ComposerState;
  onSend(text: string, options: { permission: Permission; mode: 'resume' | 'fork' }): Promise<boolean>;
}

/** Pill input with send button; permission and resume/fork live in a small row underneath. */
export function Composer({ session, state, onSend }: ComposerProps) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [permission, setPermission] = useState<Permission>('edit');
  const [mode, setMode] = useState<'resume' | 'fork'>('resume');
  const [confirmFull, setConfirmFull] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  const name = AGENT_NAMES[session.agent];
  const ready = state.canSend && text.trim().length > 0;

  const send = async () => {
    if (!ready) return;
    if (await onSend(text.trim(), { permission, mode })) setText('');
    area.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter while composing Chinese or Japanese confirms the character, it must not send.
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send();
    }
  };

  const choosePermission = (value: Permission) => {
    if (value === 'full') setConfirmFull(true);
    else setPermission(value);
  };

  return (
    <div className="composer">
      {state.canSend ? null : <p className="composer-note">{t(`chat.blocked.${state.reason}`, { agent: name })}</p>}
      {confirmFull ? (
        <div className="confirm-card" role="alertdialog" aria-label={t('chat.fullTitle')}>
          <strong>{t('chat.fullTitle')}</strong>
          <p>{t('chat.fullBody', { agent: name })}</p>
          <div className="row-actions">
            <button type="button" className="btn ghost" onClick={() => setConfirmFull(false)}>
              {t('board.cancel')}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setPermission('full');
                setConfirmFull(false);
              }}
            >
              {t('chat.fullConfirm')}
            </button>
          </div>
        </div>
      ) : null}
      <div className="composer-pill" data-disabled={!state.canSend || undefined}>
        <textarea
          ref={area}
          rows={1}
          value={text}
          maxLength={8000}
          disabled={!state.canSend}
          placeholder={t('chat.placeholder', { agent: name })}
          aria-label={t('chat.placeholder', { agent: name })}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={onKeyDown}
        />
        <button type="button" className="send" disabled={!ready} aria-label={t('chat.send', { agent: name })} onClick={() => void send()}>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className="composer-options">
        <label title={t('chat.permission')}>
          <select aria-label={t('chat.permission')} value={permission} onChange={(event) => choosePermission(event.target.value as Permission)}>
            {PERMISSIONS.map((value) => (
              <option key={value} value={value}>
                {t(`chat.permissions.${value}`)}
              </option>
            ))}
          </select>
        </label>
        {session.agent === 'claude' ? (
          <label title={t('chat.mode')}>
            <select aria-label={t('chat.mode')} value={mode} onChange={(event) => setMode(event.target.value as 'resume' | 'fork')}>
              <option value="resume">{t('chat.modes.resume')}</option>
              <option value="fork">{t('chat.modes.fork')}</option>
            </select>
          </label>
        ) : null}
      </div>
    </div>
  );
}
