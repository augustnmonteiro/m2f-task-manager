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

  const [pendingResult, completedResult, emailsResult, smsResult, profile, pendingCount] = await Promise.all([
    getPendingTasks(supabase, user.id),
    getCompletedTasks(supabase, user.id),
    getPaginatedSentEmails(supabase, user.id),
    getPaginatedSentSms(supabase, user.id),
    supabase.from('profiles').select('email_summary_interval_seconds').eq('id', user.id).maybeSingle(),
    supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'pending'),
  ]);

  const intervalSec = profile.data?.email_summary_interval_seconds ?? 60;

  return (
    <DashboardClient
      userId={user.id}
      userEmail={user.email ?? ''}
      initialPending={pendingResult.tasks}
      totalPendingCount={pendingCount.count ?? pendingResult.tasks.length}
      hasMorePending={pendingResult.hasMore}
      initialCompleted={completedResult.tasks}
      hasMoreCompleted={completedResult.hasMore}
      initialEmails={emailsResult.emails}
      initialSms={smsResult.smsMessages}
      hasMoreEmails={emailsResult.hasMore}
      hasMoreSms={smsResult.hasMore}
      initialIntervalSeconds={intervalSec}
    />
  );
}
