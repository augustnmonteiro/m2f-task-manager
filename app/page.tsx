import { createClient } from '@/lib/supabase/server';
import { AuthForm } from '@/components/auth/auth-form';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { getPendingTasks, getCompletedTasks } from '@/lib/domain/tasks';
import { getPaginatedSentEmails } from '@/lib/domain/emails';
import { getPaginatedSentSms } from '@/lib/domain/sms';

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <AuthForm />;

  const [pending, completed, emailsResult, smsResult, profile] = await Promise.all([
    getPendingTasks(supabase, user.id),
    getCompletedTasks(supabase, user.id),
    getPaginatedSentEmails(supabase, user.id),
    getPaginatedSentSms(supabase, user.id),
    supabase.from('profiles').select('email_summary_interval_seconds').eq('id', user.id).maybeSingle(),
  ]);

  return (
    <DashboardClient
      userId={user.id}
      userEmail={user.email ?? ''}
      initialPending={pending}
      initialCompleted={completed}
      initialEmails={emailsResult.emails}
      initialSms={smsResult.smsMessages}
      hasMoreEmails={emailsResult.hasMore}
      hasMoreSms={smsResult.hasMore}
      initialIntervalSeconds={profile.data?.email_summary_interval_seconds ?? 60}
    />
  );
}
