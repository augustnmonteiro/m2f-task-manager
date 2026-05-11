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

export async function getPendingTasks(client: Client, userId: string): Promise<Task[]> {
  const { data, error } = await client
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toTaskDto);
}

export async function getCompletedTasks(client: Client, userId: string): Promise<Task[]> {
  const { data, error } = await client
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toTaskDto);
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
