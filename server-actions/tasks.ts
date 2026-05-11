'use server';

import { createClient } from '@/lib/supabase/server';
import { CreateTaskInputSchema, CompleteTaskInputSchema, type Task } from '@/lib/schemas/task';
import { insertTask, completeTask as completeTaskDomain } from '@/lib/domain/tasks';
import {
  insertImmediateEmail,
  insertSummaryEmailRow,
  hasPendingScheduledSummary,
} from '@/lib/domain/emails';
import { insertSmsRow, hasPendingScheduledSms } from '@/lib/domain/sms';
import { createNotificationAction } from '@/lib/domain/notification-actions';
import { getOrCreateSchedulerState } from '@/lib/domain/scheduler';
import { fibonacciIntervalSeconds } from '@/lib/time/fibonacci';
import { ok, err, type ActionResult } from '@/lib/result';
import type { Email } from '@/lib/schemas/email';
import { formatTimestamp } from '@/lib/time/format';

export async function createTask(
  input: unknown,
): Promise<ActionResult<{ task: Task; email: Email }>> {
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
    const now = new Date().toISOString();

    const email = await insertImmediateEmail(supabase, {
      userId: user.id,
      taskId: task.id,
      subject: `Task added: ${task.title}`,
      body: `A new task was added: ${task.title}.\nCreated at: ${formatTimestamp(task.createdAt)}.`,
      scheduledAt: now,
    });

    await createNotificationAction(supabase, {
      userId: user.id,
      emailId: email.id,
      taskId: task.id,
    });

    if (!(await hasPendingScheduledSummary(supabase, user.id))) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email_summary_interval_seconds')
        .eq('id', user.id)
        .maybeSingle();
      const intervalSec = profile?.email_summary_interval_seconds ?? 60;
      const summaryAt = new Date(Date.now() + intervalSec * 1000).toISOString();
      await insertSummaryEmailRow(supabase, { userId: user.id, scheduledAt: summaryAt });
    }

    if (!(await hasPendingScheduledSms(supabase, user.id))) {
      const state = await getOrCreateSchedulerState(supabase, user.id);
      const smsAt = new Date(
        Date.now() + fibonacciIntervalSeconds(state.smsFibonacciIndex) * 1000,
      ).toISOString();
      await insertSmsRow(supabase, {
        userId: user.id,
        fibonacciIndex: state.smsFibonacciIndex,
        scheduledAt: smsAt,
      });
    }

    return ok({ task, email });
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
