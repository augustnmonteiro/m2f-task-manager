import { createClient } from '@supabase/supabase-js';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  );
}

// Wipes all data rows for a user without touching the auth account or profile.
// Called before and after each test so the seeded user always starts clean.
export async function cleanupTestUserData(userId: string) {
  const supabase = adminClient();
  await supabase.from('notification_actions').delete().eq('user_id', userId);
  await supabase.from('notification_runs').delete().eq('user_id', userId);
  await supabase.from('emails').delete().eq('user_id', userId);
  await supabase.from('sms_messages').delete().eq('user_id', userId);
  await supabase.from('scheduler_state').delete().eq('user_id', userId);
  await supabase.from('tasks').delete().eq('user_id', userId);
}

// Full teardown — only needed if you created an ephemeral user that should be deleted.
export async function cleanupUser(userId: string) {
  const supabase = adminClient();
  await cleanupTestUserData(userId);
  await supabase.from('profiles').delete().eq('id', userId);
  await supabase.auth.admin.deleteUser(userId);
}
