import { z } from 'zod';
import { UuidSchema, DatetimeSchema } from './shared';

export const TaskStatusSchema = z.enum(['pending', 'completed']);

export const CreateTaskInputSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required').max(160),
});

export const CompleteTaskInputSchema = z.object({
  taskId: UuidSchema,
});

export const TaskSchema = z.object({
  id: UuidSchema,
  userId: UuidSchema,
  title: z.string().min(1).max(160),
  status: TaskStatusSchema,
  createdAt: DatetimeSchema,
  completedAt: DatetimeSchema.nullable(),
  updatedAt: DatetimeSchema,
});

export type Task = z.infer<typeof TaskSchema>;
