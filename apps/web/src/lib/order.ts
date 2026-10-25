import { TASK_COLUMNS, type Task, type TaskColumn } from '@unpaidinterns/core';

export type Columns = Record<TaskColumn, Task[]>;

const byOrder = (a: Task, b: Task) => a.order - b.order;

export function orderBetween(before: number | undefined, after: number | undefined): number {
  if (before === undefined && after === undefined) return 1;
  if (before === undefined) return (after as number) - 1;
  if (after === undefined) return before + 1;
  return (before + after) / 2;
}

export function columnsOf(tasks: readonly Task[]): Columns {
  const sorted = [...tasks].sort(byOrder);
  return Object.fromEntries(
    TASK_COLUMNS.map((column) => [column, sorted.filter((task) => task.column === column)]),
  ) as Columns;
}

/** Order value that drops task `id` at `index` of `column`, counting only the other tasks there. */
export function placeTask(
  tasks: readonly Task[],
  id: string,
  column: TaskColumn,
  index: number,
): { column: TaskColumn; order: number } {
  const siblings = tasks.filter((task) => task.column === column && task.id !== id).sort(byOrder);
  return { column, order: orderBetween(siblings[index - 1]?.order, siblings[index]?.order) };
}

export type ColumnIds = Record<TaskColumn, string[]>;

export function idsOf(columns: Columns): ColumnIds {
  return Object.fromEntries(TASK_COLUMNS.map((column) => [column, columns[column].map((task) => task.id)])) as ColumnIds;
}

/** Moves `id` into column `to`, before `overId`, or to the end when `overId` is the column itself. */
export function moveId(ids: ColumnIds, id: string, to: TaskColumn, overId: string): ColumnIds {
  const from = TASK_COLUMNS.find((column) => ids[column].includes(id));
  if (!from) return ids;
  const without = { ...ids, [from]: ids[from].filter((value) => value !== id) };
  const target = without[to];
  const overIndex = target.indexOf(overId);
  const index = overIndex === -1 ? target.length : overIndex;
  return { ...without, [to]: [...target.slice(0, index), id, ...target.slice(index)] };
}
