import { useEffect, useRef, useState, type FormEvent } from 'react';
import { projectLabel } from '../lib/labels.js';
import { useTranslation } from 'react-i18next';
import { AGENT_NAMES } from '../lib/agents.js';
import { api } from '../lib/api.js';
import { useSessionStore } from '../store.js';
import { AgentAvatar } from './AgentAvatar.js';

export function TaskEditor({ taskId, onClose }: { taskId: string; onClose(): void }) {
  const { t } = useTranslation();
  const task = useSessionStore((state) => state.tasks.find((candidate) => candidate.id === taskId));
  const sessions = useSessionStore((state) => state.sessions);
  const tasks = useSessionStore((state) => state.tasks);
  const projects = [...new Set([...tasks.map((t) => t.project), ...Object.values(sessions).map((s) => s.project)].filter(Boolean))].sort();
  const dialog = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState(task?.title ?? '');
  const [note, setNote] = useState(task?.note ?? '');
  const [project, setProject] = useState(task?.project ?? '');
  const [sessionIds, setSessionIds] = useState<string[]>(task?.sessionIds ?? []);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  if (!task) return null;

  // Sessions in the task's project come first, so the likely match is at the top.
  const live = Object.values(sessions).sort(
    (a, b) => Number(b.project === project) - Number(a.project === project) || b.updatedAt - a.updatedAt,
  );

  const toggleSession = (id: string, sessionProject: string) => {
    const selected = sessionIds.includes(id);
    setSessionIds(selected ? sessionIds.filter((value) => value !== id) : [...sessionIds, id]);
    if (!selected && project === '') setProject(sessionProject);
  };

  const run = async (action: () => Promise<unknown>) => {
    try {
      await action();
      dialog.current?.close();
    } catch (cause) {
      setError((cause as Error).message);
    }
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    const patch = { title: title.trim(), note, project: project.trim(), sessionIds };
    void run(async () => {
      await api.patchTask(task.id, patch);
      useSessionStore.getState().patchTask(task.id, patch);
    });
  };

  return (
    <dialog ref={dialog} className="editor" aria-labelledby="editor-heading" onClose={onClose}>
      <form onSubmit={save}>
        <h2 id="editor-heading">{t('editor.heading')}</h2>
        <label>
          {t('editor.title')}
          <input required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label>
          {t('editor.note')}
          <textarea rows={3} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        <label>
          {t('editor.project')}
          <input list="project-options" maxLength={200} value={project} onChange={(e) => setProject(e.target.value)} />
          <datalist id="project-options">
            {projects.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </label>
        <fieldset>
          <legend>{t('editor.sessions')}</legend>
          {live.length === 0 ? <p className="meta">{t('editor.noSessions')}</p> : null}
          {live.map((session) => (
            <label key={session.sessionId} className="pick">
              <input
                type="checkbox"
                checked={sessionIds.includes(session.sessionId)}
                onChange={() => toggleSession(session.sessionId, session.project)}
              />
              <AgentAvatar agent={session.agent} />
              <span>
                {AGENT_NAMES[session.agent]} · {projectLabel(session)} · {t(`state.${session.state}`)}
              </span>
            </label>
          ))}
        </fieldset>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="row-actions">
          <button type="button" className="btn ghost danger" onClick={() => void run(() => api.deleteTask(task.id))}>
            {t('editor.delete')}
          </button>
          <span className="spacer" />
          <button type="button" className="btn ghost" onClick={() => dialog.current?.close()}>
            {t('editor.cancel')}
          </button>
          <button type="submit" className="btn">
            {t('editor.save')}
          </button>
        </div>
      </form>
    </dialog>
  );
}
