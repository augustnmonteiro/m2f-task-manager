import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { getPendingTasks } from '@/lib/domain/tasks';
import { createNotificationAction } from '@/lib/domain/notification-actions';
import { insertSummaryEmailRow } from '@/lib/domain/emails';
import { updateAfterEmailSummary } from '@/lib/domain/scheduler';

function verifyCronAuth(request: Request): boolean {
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

export async function POST(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: dueRows, error } = await supabase
    .from('emails')
    .select('id, user_id')
    .eq('kind', 'summary')
    .is('sent_at', null)
    .lte('scheduled_at', new Date().toISOString());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let processed = 0;

  for (const row of dueRows ?? []) {
    const { tasks: pendingTasks } = await getPendingTasks(supabase, row.user_id);

    const body = pendingTasks.length === 0
      ? '<div><p>No pending tasks.</p></div>'
      : `<div class="space-y-1"><p class="font-medium text-slate-800">Pending tasks:</p><ul class="list-disc pl-5 space-y-1">${pendingTasks.map(t => `<li>${t.title}</li>`).join('')}</ul></div>`;

    const { data: updated, error: updateErr } = await supabase
      .from('emails')
      .update({ body, sent_at: new Date().toISOString() })
      .eq('id', row.id)
      .is('sent_at', null)
      .select('id')
      .maybeSingle();

    if (updateErr || !updated) continue;

    for (const task of pendingTasks) {
      await createNotificationAction(supabase, {
        userId: row.user_id,
        emailId: row.id,
        taskId: task.id,
      });
    }

    await updateAfterEmailSummary(supabase, row.user_id);

    const { data: profile } = await supabase
      .from('profiles')
      .select('email_summary_interval_seconds')
      .eq('id', row.user_id)
      .maybeSingle();
    const intervalSec = profile?.email_summary_interval_seconds ?? 60;
    const nextAt = new Date(Date.now() + intervalSec * 1000).toISOString();
    await insertSummaryEmailRow(supabase, { userId: row.user_id, scheduledAt: nextAt });

    processed++;
  }

  return NextResponse.json({ processed });
}
