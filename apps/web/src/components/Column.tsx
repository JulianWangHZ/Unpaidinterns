import type { Task, TaskColumn } from '@unpaidinterns/core';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { TaskCard } from './TaskCard.js';

interface ColumnProps {
  column: TaskColumn;
  tasks: Task[];
  onEdit(id: string): void;
  onMoveToDone(id: string): void;
  footer?: ReactNode;
}

export function Column({ column, tasks, onEdit, onMoveToDone, footer }: ColumnProps) {
  const { t } = useTranslation();
  const { setNodeRef } = useDroppable({ id: column });
  const headingId = `column-${column}`;

  return (
    <section className="col" data-column={column} aria-labelledby={headingId}>
      <h2 id={headingId}>
        {t(`column.${column}`)} <small>{tasks.length}</small>
      </h2>
      <SortableContext id={column} items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="stack">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={onEdit} onMoveToDone={onMoveToDone} />
          ))}
          {tasks.length === 0 ? <p className="empty-col">{t('board.emptyColumn')}</p> : null}
        </div>
      </SortableContext>
      {footer}
    </section>
  );
}
