import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { scheduleNextTaskSms } from '@/lib/domain/sms';
import { fibonacciIntervalSeconds } from '@/lib/time/fibonacci';

function verifyCronAuth(request: Request): boolean {
  return request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  const { data: dueRows, error } = await supabase
    .from('sms_messages')
    .select('id, user_id, task_id, fibonacci_index')
    .not('task_id', 'is', null)
    .is('sent_at', null)
    .lte('scheduled_at', new Date().toISOString());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let processed = 0;

  for (const row of dueRows ?? []) {
    const taskId = row.task_id!;
    const now = new Date().toISOString();

    const { data: task } = await supabase
      .from('tasks')
      .select('title, status, created_at')
      .eq('id', taskId)
      .maybeSingle();

    if (!task || task.status === 'completed') {
      await supabase.from('sms_messages').delete().eq('id', row.id);
      continue;
    }

    const code = Math.floor(100000 + Math.random() * 900000);
    const smsBody = `${task.title}\nCreated at: ${new Date(task.created_at).toLocaleString('en-US')}\nReply DONE-${code} for this task to be marked as done`;

    const { data: updated, error: updateErr } = await supabase
      .from('sms_messages')
      .update({ body: smsBody, sent_at: now })
      .eq('id', row.id)
      .is('sent_at', null)
      .select('id')
      .maybeSingle();

    if (updateErr || !updated) continue;

    const newIndex = row.fibonacci_index + 1;
    const nextAt = new Date(
      Date.now() + fibonacciIntervalSeconds(newIndex) * 1000,
    ).toISOString();

    await scheduleNextTaskSms(supabase, {
      userId: row.user_id,
      taskId,
      fibonacciIndex: newIndex,
      scheduledAt: nextAt,
    });

    processed++;
  }

  return NextResponse.json({ processed });
}
