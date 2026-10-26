import { z } from 'zod';

export const chatRoleSchema = z.enum(['user', 'assistant', 'tool']);
export type ChatRole = z.infer<typeof chatRoleSchema>;

export const chatMessageSchema = z.object({
  id: z.string().min(1),
  role: chatRoleSchema,
  text: z.string(),
  ts: z.number().int().nonnegative(),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const PERMISSIONS = ['readOnly', 'edit', 'full'] as const;
export const permissionSchema = z.enum(PERMISSIONS);
export type Permission = z.infer<typeof permissionSchema>;

export const sendMessageSchema = z.object({
  text: z.string().trim().min(1).max(8000),
  mode: z.enum(['resume', 'fork']).default('resume'),
  permission: permissionSchema.default('edit'),
});
export type SendMessage = z.input<typeof sendMessageSchema>;

export const runStatusSchema = z.enum(['running', 'done', 'failed']);
export type RunStatus = z.infer<typeof runStatusSchema>;
