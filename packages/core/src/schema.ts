import { z } from 'zod';
import { runStatusSchema } from './chat.js';
import { taskSchema } from './task.js';

export const agentKindSchema = z.enum(['claude', 'codex', 'gemini']);
export type AgentKind = z.infer<typeof agentKindSchema>;

export const sessionStateSchema = z.enum([
  'thinking',
  'running',
  'writing',
  'waiting',
  'done',
  'interrupted',
  'error',
  'idle',
]);
export type SessionState = z.infer<typeof sessionStateSchema>;

export const agentEventSchema = z.object({
  agent: agentKindSchema,
  sessionId: z.string().min(1),
  parentSessionId: z.string().min(1).optional(),
  cwd: z.string(),
  project: z.string(),
  /** Folder name of the git worktree the session runs in, when it is not the main checkout. */
  worktree: z.string().min(1).optional(),
  state: sessionStateSchema,
  tool: z.string().optional(),
  detail: z.string().optional(),
  ts: z.number().int().nonnegative(),
});
export type AgentEvent = z.infer<typeof agentEventSchema>;

export const sessionSchema = agentEventSchema.omit({ ts: true }).extend({
  startedAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
});
export type Session = z.infer<typeof sessionSchema>;

export const serverMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('snapshot'), sessions: z.array(sessionSchema) }),
  z.object({ type: z.literal('upsert'), session: sessionSchema }),
  z.object({ type: z.literal('remove'), sessionId: z.string().min(1) }),
  z.object({ type: z.literal('tasks'), tasks: z.array(taskSchema) }),
  z.object({
    type: z.literal('run'),
    sessionId: z.string().min(1),
    status: runStatusSchema,
    error: z.string().optional(),
  }),
]);
export type ServerMessage = z.infer<typeof serverMessageSchema>;
