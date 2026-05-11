import { createClient } from '@/lib/supabase/server';
import { AuthForm } from '@/components/auth/auth-form';
import { TaskPanel } from '@/components/dashboard/task-panel';
import { getPendingTasks, getCompletedTasks } from '@/lib/domain/tasks';

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <AuthForm />;

  const [pending, completed] = await Promise.all([
    getPendingTasks(supabase, user.id),
    getCompletedTasks(supabase, user.id),
  ]);

  return (
    <main className="p-4">
      <TaskPanel initialPending={pending} initialCompleted={completed} />
    </main>
  );
}
