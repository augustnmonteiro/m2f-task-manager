import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { EmailSchema, type Email } from '@/lib/schemas/email';

type Client = SupabaseClient<Database>;

function toEmailDto(row: unknown, actions: Email['actions'] = []): Email {
  const r = row as Record<string, unknown>;
  return EmailSchema.parse({
    id: r.id,
    userId: r.user_id,
    kind: r.kind,
    taskId: r.task_id ?? null,
    subject: r.subject,
    body: r.body ?? null,
    scheduledAt: r.scheduled_at ?? null,
    sentAt: r.sent_at ?? null,
    createdAt: r.created_at,
    actions,
  });
}

export async function insertImmediateEmail(
  client: Client,
  params: {
    userId: string;
    taskId: string;
    subject: string;
    body: string;
    scheduledAt: string;
  },
): Promise<Email> {
  const now = new Date().toISOString();
  const { data, error } = await client
    .from('emails')
    .insert({
      user_id: params.userId,
      kind: 'immediate_task',
      task_id: params.taskId,
      subject: params.subject,
      body: params.body,
      scheduled_at: params.scheduledAt,
      sent_at: now,
    })
    .select('*')
    .single();
  if (error) throw error;
  return toEmailDto(data);
}

export async function insertSummaryEmailRow(
  client: Client,
  params: { userId: string; scheduledAt: string },
): Promise<Email> {
  const { data, error } = await client
    .from('emails')
    .insert({
      user_id: params.userId,
      kind: 'summary',
      subject: 'Pending tasks summary',
      scheduled_at: params.scheduledAt,
    })
    .select('*')
    .single();
  if (error) throw error;
  return toEmailDto(data);
}

export async function getPaginatedSentEmails(
  client: Client,
  userId: string,
  cursor?: string,
  limit = 20,
): Promise<{ emails: Email[]; hasMore: boolean }> {
  let query = client
    .from('emails')
    .select('*')
    .eq('user_id', userId)
    .not('sent_at', 'is', null)
    .order('sent_at', { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    query = query.lt('sent_at', cursor);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  return {
    emails: rows.slice(0, limit).map(r => toEmailDto(r)),
    hasMore,
  };
}

export async function getEmailWithActions(
  client: Client,
  emailId: string,
  userId: string,
): Promise<Email | null> {
  const { data: emailRow, error } = await client
    .from('emails')
    .select('*')
    .eq('id', emailId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !emailRow) return null;

  const { data: actions } = await client
    .from('notification_actions')
    .select('id, task_id, expires_at, used_at')
    .eq('email_id', emailId)
    .eq('user_id', userId);

  const mappedActions = (actions ?? []).map(a => ({
    id: a.id,
    taskId: a.task_id,
    label: 'Complete task',
    href: `/api/email-actions/complete-task?token=PLACEHOLDER`,
    usedAt: a.used_at ?? null,
    expiresAt: a.expires_at,
  }));

  return toEmailDto(emailRow, mappedActions);
}

export async function hasPendingScheduledSummary(
  client: Client,
  userId: string,
): Promise<boolean> {
  const { count } = await client
    .from('emails')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('kind', 'summary')
    .is('sent_at', null);
  return (count ?? 0) > 0;
}
