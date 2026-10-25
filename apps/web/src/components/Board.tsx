import { TASK_COLUMNS, type Task, type TaskColumn, type TaskPatch } from '@unpaidinterns/core';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../lib/api.js';
import { filterTasks, useFilterStore } from '../lib/filters.js';
import { columnsOf, idsOf, moveId, placeTask, type ColumnIds } from '../lib/order.js';
import { useSessionStore } from '../store.js';
import { AddTask } from './AddTask.js';
import { Column } from './Column.js';

const isColumn = (id: string): id is TaskColumn => (TASK_COLUMNS as readonly string[]).includes(id);

function columnOf(ids: ColumnIds, id: string): TaskColumn | undefined {
  return isColumn(id) ? id : TASK_COLUMNS.find((column) => ids[column].includes(id));
}

export function Board({ onEdit }: { onEdit(id: string): void }) {
  const { t } = useTranslation();
  const tasks = useSessionStore((state) => state.tasks);
  const sessions = useSessionStore((state) => state.sessions);
  const { setTasks, patchTask } = useSessionStore.getState();
  const filters = useFilterStore();
  const [preview, setPreview] = useState<ColumnIds | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = useMemo(() => filterTasks(tasks, sessions, filters), [tasks, sessions, filters]);
  const ids = preview ?? idsOf(columnsOf(visible));
  const byId = useMemo(() => new Map(visible.map((task) => [task.id, task])), [visible]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const save = async (id: string, patch: TaskPatch) => {
    patchTask(id, patch);
    try {
      await api.patchTask(id, patch);
      setError(null);
    } catch (cause) {
      setError(t('board.saveFailed', { message: (cause as Error).message }));
      setTasks(await api.listTasks());
    }
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return;
    const current = preview ?? ids;
    const from = columnOf(current, String(active.id));
    const to = columnOf(current, String(over.id));
    if (from && to && from !== to) setPreview(moveId(current, String(active.id), to, String(over.id)));
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const current = preview ?? ids;
    setPreview(null);
    if (!over) return;
    const id = String(active.id);
    const column = columnOf(current, String(over.id));
    const task = byId.get(id);
    if (!column || !task) return;
    const list = current[column];
    const overIndex = isColumn(String(over.id)) ? list.length - 1 : list.indexOf(String(over.id));
    const finalList = arrayMove(list, list.indexOf(id), overIndex);
    const placement = placeTask(visible, id, column, finalList.indexOf(id));
    const sameSpot = task.column === column && idsOf(columnsOf(visible))[column].indexOf(id) === finalList.indexOf(id);
    if (!sameSpot) void save(id, placement);
  };

  const create = async (title: string) => {
    try {
      await api.createTask({ title, project: filters.project });
      setTasks(await api.listTasks());
      setError(null);
    } catch (cause) {
      setError(t('board.saveFailed', { message: (cause as Error).message }));
    }
  };

  const moveToDone = (id: string) => {
    const doneCount = tasks.filter((task) => task.column === 'done' && task.id !== id).length;
    void save(id, placeTask(tasks, id, 'done', doneCount));
  };
  const columnTasks = (column: TaskColumn): Task[] =>
    ids[column].flatMap((id) => (byId.get(id) ? [byId.get(id) as Task] : []));

  return (
    <>
      {error ? (
        <p className="error-banner" role="alert">
          {error}
        </p>
      ) : null}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={() => setPreview(ids)}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onDragCancel={() => setPreview(null)}
      >
        <div className="board">
          {TASK_COLUMNS.map((column) => (
            <Column
              key={column}
              column={column}
              tasks={columnTasks(column)}
              onEdit={onEdit}
              onMoveToDone={moveToDone}
              footer={column === 'todo' ? <AddTask onCreate={create} /> : undefined}
            />
          ))}
        </div>
      </DndContext>
    </>
  );
}
