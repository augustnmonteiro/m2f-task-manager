import { createClient } from '@supabase/supabase-js';

export async function cleanupUser(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  );

  await supabase.from('notification_actions').delete().eq('user_id', userId);
  await supabase.from('notification_runs').delete().eq('user_id', userId);
  await supabase.from('emails').delete().eq('user_id', userId);
  await supabase.from('sms_messages').delete().eq('user_id', userId);
  await supabase.from('scheduler_state').delete().eq('user_id', userId);
  await supabase.from('tasks').delete().eq('user_id', userId);
  await supabase.from('profiles').delete().eq('id', userId);
  await supabase.auth.admin.deleteUser(userId);
}
