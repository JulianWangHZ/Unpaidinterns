import { z } from 'zod';

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
]);
export type ServerMessage = z.infer<typeof serverMessageSchema>;
