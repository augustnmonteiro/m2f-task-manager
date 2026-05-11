import { z } from 'zod';
import { UuidSchema, DatetimeSchema } from './shared';

export const SmsSchema = z.object({
  id: UuidSchema,
  userId: UuidSchema,
  kind: z.literal('fibonacci_summary'),
  body: z.string().nullable(),
  fibonacciIndex: z.number().int().min(0),
  scheduledAt: DatetimeSchema.nullable(),
  sentAt: DatetimeSchema.nullable(),
  createdAt: DatetimeSchema,
});

export type Sms = z.infer<typeof SmsSchema>;

export const PaginatedSmsQuerySchema = z.object({
  cursor: DatetimeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
