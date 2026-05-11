import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { SchedulerStateSchema, type SchedulerState } from '@/lib/schemas/scheduler';

type Client = SupabaseClient<Database>;

function toDto(row: unknown): SchedulerState {
  const r = row as Record<string, unknown>;
  return SchedulerStateSchema.parse({
    userId: r.user_id,
    emailSummaryLastSentAt: r.email_summary_last_sent_at ?? null,
    smsFibonacciIndex: r.sms_fibonacci_index,
    smsLastSentAt: r.sms_last_sent_at ?? null,
    updatedAt: r.updated_at,
  });
}

export async function getOrCreateSchedulerState(
  client: Client,
  userId: string,
): Promise<SchedulerState> {
  const { data, error } = await client
    .from('scheduler_state')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (data) return toDto(data);

  const { data: created, error: createErr } = await client
    .from('scheduler_state')
    .insert({ user_id: userId })
    .select('*')
    .single();
  if (createErr) throw createErr;
  return toDto(created);
}

export async function updateAfterEmailSummary(
  client: Client,
  userId: string,
): Promise<void> {
  await client
    .from('scheduler_state')
    .upsert({ user_id: userId, email_summary_last_sent_at: new Date().toISOString() });
}

export async function updateAfterSms(
  client: Client,
  userId: string,
  newIndex: number,
): Promise<void> {
  await client
    .from('scheduler_state')
    .upsert({
      user_id: userId,
      sms_fibonacci_index: newIndex,
      sms_last_sent_at: new Date().toISOString(),
    });
}
