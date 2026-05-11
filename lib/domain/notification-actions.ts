import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const TOKEN_EXPIRY_DAYS = 7;

type Client = SupabaseClient<Database>;

export function generateToken(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  return { rawToken, tokenHash };
}

export function hashToken(rawToken: string): string {
  return crypto
    .createHmac('sha256', process.env.ACTION_TOKEN_SECRET!)
    .update(rawToken)
    .digest('hex');
}

export async function createNotificationAction(
  client: Client,
  params: { userId: string; emailId: string; taskId: string },
): Promise<{ rawToken: string }> {
  const { rawToken, tokenHash } = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_DAYS * 86400_000).toISOString();

  const { error } = await client.from('notification_actions').insert({
    user_id: params.userId,
    email_id: params.emailId,
    task_id: params.taskId,
    action_type: 'complete_task',
    token_hash: tokenHash,
    expires_at: expiresAt,
  });
  if (error) throw error;
  return { rawToken };
}

export async function validateAndConsumeToken(
  client: Client,
  rawToken: string,
  userId: string,
): Promise<{ taskId: string } | null> {
  const tokenHash = hashToken(rawToken);

  const { data, error } = await client
    .from('notification_actions')
    .select('id, task_id, expires_at, used_at')
    .eq('token_hash', tokenHash)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  if (data.used_at) return { taskId: data.task_id };
  if (new Date(data.expires_at) < new Date()) return null;

  const { error: updateErr } = await client
    .from('notification_actions')
    .update({ used_at: new Date().toISOString() })
    .eq('id', data.id);
  if (updateErr) throw updateErr;

  return { taskId: data.task_id };
}
