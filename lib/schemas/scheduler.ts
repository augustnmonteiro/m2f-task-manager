import { z } from 'zod';
import { UuidSchema, DatetimeSchema } from './shared';

export const SchedulerStateSchema = z.object({
  userId: UuidSchema,
  emailSummaryLastSentAt: DatetimeSchema.nullable(),
  smsFibonacciIndex: z.number().int().min(0),
  smsLastSentAt: DatetimeSchema.nullable(),
  updatedAt: DatetimeSchema,
});

export type SchedulerState = z.infer<typeof SchedulerStateSchema>;
