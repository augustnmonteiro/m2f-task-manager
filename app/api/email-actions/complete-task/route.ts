import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { validateAndConsumeToken } from '@/lib/domain/notification-actions';
import { completeTask } from '@/lib/domain/tasks';

const QuerySchema = z.object({
  token: z.string().min(32).max(512),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = QuerySchema.safeParse({ token: searchParams.get('token') });
  if (!parsed.success) {
    return NextResponse.redirect(new URL('/?emailAction=invalid', request.url));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL('/?emailAction=unauthenticated', request.url));
  }

  try {
    const result = await validateAndConsumeToken(supabase, parsed.data.token, user.id);
    if (!result) {
      return NextResponse.redirect(new URL('/?emailAction=invalid', request.url));
    }
    await completeTask(supabase, user.id, result.taskId);
    return NextResponse.redirect(new URL('/?emailAction=completed', request.url), 303);
  } catch {
    return NextResponse.redirect(new URL('/?emailAction=error', request.url));
  }
}
