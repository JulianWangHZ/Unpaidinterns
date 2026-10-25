import { z } from 'zod';

export const TASK_COLUMNS = ['todo', 'doing', 'done'] as const;
export const taskColumnSchema = z.enum(TASK_COLUMNS);
export type TaskColumn = z.infer<typeof taskColumnSchema>;

const title = z.string().trim().min(1).max(200);
const note = z.string().max(2000);
const project = z.string().trim().max(200);
const sessionIds = z.array(z.string().min(1)).max(20);

export const taskSchema = z.object({
  id: z.string().min(1),
  title,
  note,
  project,
  column: taskColumnSchema,
  order: z.number().finite(),
  sessionIds,
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
});
export type Task = z.infer<typeof taskSchema>;

export const taskCreateSchema = z.object({
  title,
  note: note.default(''),
  project: project.default(''),
  column: taskColumnSchema.default('todo'),
  sessionIds: sessionIds.default([]),
});
export type TaskCreate = z.input<typeof taskCreateSchema>;

export const taskPatchSchema = z
  .object({ title, note, project, column: taskColumnSchema, order: z.number().finite(), sessionIds })
  .partial()
  .strict();
export type TaskPatch = z.infer<typeof taskPatchSchema>;
