import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { SmsSchema, type Sms } from '@/lib/schemas/sms';

type Client = SupabaseClient<Database>;

function toSmsDto(row: unknown): Sms {
  const r = row as Record<string, unknown>;
  return SmsSchema.parse({
    id: r.id,
    userId: r.user_id,
    kind: r.kind,
    body: r.body ?? null,
    fibonacciIndex: r.fibonacci_index,
    scheduledAt: r.scheduled_at ?? null,
    sentAt: r.sent_at ?? null,
    createdAt: r.created_at,
  });
}

export async function insertSmsRow(
  client: Client,
  params: {
    userId: string;
    fibonacciIndex: number;
    scheduledAt: string;
  },
): Promise<Sms> {
  const { data, error } = await client
    .from('sms_messages')
    .insert({
      user_id: params.userId,
      kind: 'fibonacci_summary',
      fibonacci_index: params.fibonacciIndex,
      scheduled_at: params.scheduledAt,
    })
    .select('*')
    .single();
  if (error) throw error;
  return toSmsDto(data);
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
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (cursor) query = query.lt('created_at', cursor);

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  return {
    smsMessages: rows.slice(0, limit).map(toSmsDto),
    hasMore: rows.length > limit,
  };
}

export async function hasPendingScheduledSms(
  client: Client,
  userId: string,
): Promise<boolean> {
  const { count } = await client
    .from('sms_messages')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('sent_at', null);
  return (count ?? 0) > 0;
}
