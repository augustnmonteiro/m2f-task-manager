'use server';

import { createClient } from '@/lib/supabase/server';
import { UpdateEmailSummaryIntervalInputSchema } from '@/lib/schemas/profile';
import { ok, err, type ActionResult } from '@/lib/result';

export async function updateEmailSummaryInterval(
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = UpdateEmailSummaryIntervalInputSchema.safeParse(input);
  if (!parsed.success) {
    return err({ code: 'VALIDATION_ERROR', message: 'Invalid interval.' });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err({ code: 'UNAUTHENTICATED', message: 'Not signed in.' });

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, email_summary_interval_seconds: parsed.data.intervalSeconds });

  if (error) return err({ code: 'INTERNAL_ERROR', message: 'Failed to update setting.' });
  return ok(null);
}
