'use server';

import { createClient } from '@/lib/supabase/server';
import { CreateTaskInputSchema, CompleteTaskInputSchema } from '@/lib/schemas/task';
import { insertTask, completeTask as completeTaskDomain } from '@/lib/domain/tasks';
import { ok, err, type ActionResult } from '@/lib/result';
import type { Task } from '@/lib/schemas/task';

export async function createTask(
  input: unknown,
): Promise<ActionResult<{ task: Task }>> {
  const parsed = CreateTaskInputSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err({ code: 'UNAUTHENTICATED', message: 'Not signed in.' });

  try {
    const task = await insertTask(supabase, user.id, parsed.data.title);
    return ok({ task });
  } catch {
    return err({ code: 'INTERNAL_ERROR', message: 'Failed to create task.' });
  }
}

export async function completeTask(
  input: unknown,
): Promise<ActionResult<{ task: Task }>> {
  const parsed = CompleteTaskInputSchema.safeParse(input);
  if (!parsed.success) {
    return err({ code: 'VALIDATION_ERROR', message: 'Invalid task ID.' });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err({ code: 'UNAUTHENTICATED', message: 'Not signed in.' });

  try {
    const task = await completeTaskDomain(supabase, user.id, parsed.data.taskId);
    return ok({ task });
  } catch {
    return err({ code: 'INTERNAL_ERROR', message: 'Failed to complete task.' });
  }
}
