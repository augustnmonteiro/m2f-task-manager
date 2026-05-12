import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { SmsSchema, type Sms } from '@/lib/schemas/sms';

type Client = SupabaseClient<Database>;

function toSmsDto(row: unknown): Sms {
  const r = row as Record<string, unknown>;
  return SmsSchema.parse({
    id: r.id,
    userId: r.user_id,
    taskId: r.task_id ?? null,
    kind: r.kind,
    body: r.body ?? null,
    fibonacciIndex: r.fibonacci_index,
    scheduledAt: r.scheduled_at ?? null,
    sentAt: r.sent_at ?? null,
    createdAt: r.created_at,
  });
}

export async function scheduleFirstTaskSms(
  client: Client,
  params: { userId: string; taskId: string; scheduledAt: string },
): Promise<void> {
  const { error } = await client.from('sms_messages').insert({
    user_id: params.userId,
    task_id: params.taskId,
    kind: 'fibonacci_summary',
    fibonacci_index: 0,
    scheduled_at: params.scheduledAt,
  });
  if (error) throw error;
}

export async function scheduleNextTaskSms(
  client: Client,
  params: { userId: string; taskId: string; fibonacciIndex: number; scheduledAt: string },
): Promise<void> {
  const { error } = await client.from('sms_messages').insert({
    user_id: params.userId,
    task_id: params.taskId,
    kind: 'fibonacci_summary',
    fibonacci_index: params.fibonacciIndex,
    scheduled_at: params.scheduledAt,
  });
  if (error) throw error;
}

export async function cancelPendingTaskSms(
  client: Client,
  taskId: string,
): Promise<void> {
  await client
    .from('sms_messages')
    .delete()
    .eq('task_id', taskId)
    .is('sent_at', null);
}

export async function getPaginatedSentSms(
  client: Client,
  userId: string,
  cursor?: string,
  limit = 20,
): Promise<{ smsMessages: Sms[]; hasMore: boolean }> {
  let query = client
    .from('sms_messages')
    .select('*')
    .eq('user_id', userId)
    .not('sent_at', 'is', null)
    .order('sent_at', { ascending: false })
    .limit(limit + 1);

  if (cursor) query = query.lt('sent_at', cursor);

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  return {
    smsMessages: rows.slice(0, limit).map(toSmsDto),
    hasMore: rows.length > limit,
  };
}
