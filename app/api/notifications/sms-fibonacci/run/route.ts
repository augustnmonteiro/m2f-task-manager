import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getPendingTasks } from '@/lib/domain/tasks';
import { insertSmsRow } from '@/lib/domain/sms';
import { updateAfterSms } from '@/lib/domain/scheduler';
import { fibonacciIntervalSeconds } from '@/lib/time/fibonacci';

function verifyCronAuth(request: Request): boolean {
  return request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`;
}

export async function POST(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServerClient();

  const { data: dueRows, error } = await supabase
    .from('sms_messages')
    .select('id, user_id, fibonacci_index')
    .is('sent_at', null)
    .lte('scheduled_at', new Date().toISOString());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let processed = 0;

  for (const row of dueRows ?? []) {
    const pendingTasks = await getPendingTasks(supabase, row.user_id);

    const body = pendingTasks.length === 0
      ? 'No pending tasks.'
      : `Pending tasks: ${pendingTasks.map(t => t.title).join(', ')}`;

    const { data: updated, error: updateErr } = await supabase
      .from('sms_messages')
      .update({ body, sent_at: new Date().toISOString() })
      .eq('id', row.id)
      .is('sent_at', null)
      .select('id')
      .maybeSingle();

    if (updateErr || !updated) continue;

    const newIndex = row.fibonacci_index + 1;
    await updateAfterSms(supabase, row.user_id, newIndex);

    const nextAt = new Date(
      Date.now() + fibonacciIntervalSeconds(newIndex) * 1000,
    ).toISOString();
    await insertSmsRow(supabase, {
      userId: row.user_id,
      fibonacciIndex: newIndex,
      scheduledAt: nextAt,
    });

    processed++;
  }

  return NextResponse.json({ processed });
}
