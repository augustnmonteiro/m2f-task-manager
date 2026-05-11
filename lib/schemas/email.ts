import { z } from 'zod';
import { UuidSchema, DatetimeSchema } from './shared';

export const EmailKindSchema = z.enum(['immediate_task', 'summary']);

export const EmailActionSchema = z.object({
  id: UuidSchema,
  taskId: UuidSchema,
  label: z.string().min(1),
  href: z.string().min(1),
  usedAt: DatetimeSchema.nullable(),
  expiresAt: DatetimeSchema,
});

export const EmailSchema = z.object({
  id: UuidSchema,
  userId: UuidSchema,
  kind: EmailKindSchema,
  taskId: UuidSchema.nullable(),
  subject: z.string().min(1),
  body: z.string().nullable(),
  scheduledAt: DatetimeSchema.nullable(),
  sentAt: DatetimeSchema.nullable(),
  createdAt: DatetimeSchema,
  actions: z.array(EmailActionSchema).default([]),
});

export type Email = z.infer<typeof EmailSchema>;
export type EmailAction = z.infer<typeof EmailActionSchema>;

export const PaginatedEmailQuerySchema = z.object({
  cursor: DatetimeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
