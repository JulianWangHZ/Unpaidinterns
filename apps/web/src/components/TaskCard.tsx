import type { Task } from '@unpaidinterns/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';
import { AGENT_NAMES } from '../lib/agents.js';
import { cardStatus } from '../lib/task-status.js';
import { useSessionStore } from '../store.js';
import { AgentAvatar } from './AgentAvatar.js';
import { WavingIntern } from './WavingIntern.js';

interface TaskCardProps {
  task: Task;
  onEdit(id: string): void;
  onMoveToDone(id: string): void;
}

export function TaskCard({ task, onEdit, onMoveToDone }: TaskCardProps) {
  const { t } = useTranslation();
  const sessions = useSessionStore((state) => state.sessions);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });
  const status = cardStatus(task, sessions);

  return (
    <article
      ref={setNodeRef}
      className="kc"
      data-needs-you={status.needsYou || undefined}
      data-column={task.column}
      data-dragging={isDragging || undefined}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...listeners}
    >
      {status.needsYou ? <WavingIntern /> : null}
      <div className="kc-head">
        <button type="button" className="kc-title" onClick={() => onEdit(task.id)} aria-label={t('card.edit', { title: task.title })}>
          {task.title}
        </button>
        <button type="button" className="grip" ref={setActivatorNodeRef} {...attributes} aria-label={task.title}>
          <svg width="10" height="14" viewBox="0 0 10 14" aria-hidden="true">
            {[2, 7, 12].map((y) => (
              <g key={y}>
                <circle cx="2.5" cy={y} r="1.2" />
                <circle cx="7.5" cy={y} r="1.2" />
              </g>
            ))}
          </svg>
        </button>
      </div>
      {task.project ? <p className="meta">{task.project}</p> : null}
      {status.bound.length > 0 ? (
        <ul className="sess">
          {status.bound.map((session) => (
            <li key={session.sessionId} className="s" data-state={session.state}>
              <AgentAvatar agent={session.agent} />
              <span>
                {AGENT_NAMES[session.agent]} · {t(`state.${session.state}`)}
              </span>
              {session.tool ? <code>{session.tool}</code> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="meta">{t('card.noAgent')}</p>
      )}
      {status.ended > 0 ? <p className="meta">{t('card.ended', { count: status.ended })}</p> : null}
      {status.suggestDone ? (
        <button type="button" className="btn" onClick={() => onMoveToDone(task.id)}>
          {t('card.moveToDone')}
        </button>
      ) : null}
    </article>
  );
}
