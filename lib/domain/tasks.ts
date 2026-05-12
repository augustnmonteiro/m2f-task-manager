import { TaskSchema, type Task } from '@/lib/schemas/task';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

type Client = SupabaseClient<Database>;

function toTaskDto(row: unknown): Task {
  const r = row as Record<string, unknown>;
  return TaskSchema.parse({
    id: r.id,
    userId: r.user_id,
    title: r.title,
    status: r.status,
    createdAt: r.created_at,
    completedAt: r.completed_at ?? null,
    updatedAt: r.updated_at,
  });
}

export async function getPendingTasks(
  client: Client,
  userId: string,
  cursor?: string,
  limit = 20,
): Promise<{ tasks: Task[]; hasMore: boolean }> {
  let query = client
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(limit + 1);
  if (cursor) query = query.lt('created_at', cursor);
  const { data, error } = await query;
  if (error) throw error;
  const rows = data ?? [];
  return { tasks: rows.slice(0, limit).map(toTaskDto), hasMore: rows.length > limit };
}

export async function getCompletedTasks(
  client: Client,
  userId: string,
  cursor?: string,
  limit = 20,
): Promise<{ tasks: Task[]; hasMore: boolean }> {
  let query = client
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(limit + 1);
  if (cursor) query = query.lt('completed_at', cursor);
  const { data, error } = await query;
  if (error) throw error;
  const rows = data ?? [];
  return { tasks: rows.slice(0, limit).map(toTaskDto), hasMore: rows.length > limit };
}

export async function insertTask(
  client: Client,
  userId: string,
  title: string,
): Promise<Task> {
  const { data, error } = await client
    .from('tasks')
    .insert({ user_id: userId, title, status: 'pending' })
    .select('*')
    .single();
  if (error) throw error;
  return toTaskDto(data);
}

export async function completeTask(
  client: Client,
  userId: string,
  taskId: string,
): Promise<Task> {
  const { data, error } = await client
    .from('tasks')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', taskId)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .select('*')
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    const { data: existing, error: fetchErr } = await client
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', userId)
      .single();
    if (fetchErr || !existing) throw fetchErr ?? new Error('Task not found');
    return toTaskDto(existing);
  }
  return toTaskDto(data);
}
