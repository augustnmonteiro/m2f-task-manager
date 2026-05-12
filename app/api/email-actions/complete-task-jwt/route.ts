import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyTaskJwt } from '@/lib/email/jwt';
import { createServiceClient } from '@/lib/supabase/server';
import { completeTask } from '@/lib/domain/tasks';

const QuerySchema = z.object({ token: z.string().min(1) });

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = QuerySchema.safeParse({ token: searchParams.get('token') });
  if (!parsed.success) {
    return NextResponse.redirect(new URL('/task-done?status=error', request.url));
  }

  let userId: string;
  let taskId: string;
  try {
    ({ userId, taskId } = await verifyTaskJwt(parsed.data.token));
  } catch {
    return NextResponse.redirect(new URL('/task-done?status=error', request.url));
  }

  try {
    const supabase = createServiceClient();
    await completeTask(supabase, userId, taskId);
  } catch {
    return NextResponse.redirect(new URL('/task-done?status=error', request.url));
  }

  return NextResponse.redirect(new URL('/task-done?status=completed', request.url));
}
