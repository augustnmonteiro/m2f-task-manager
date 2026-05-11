import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { PaginatedEmailQuerySchema } from '@/lib/schemas/email';
import { getPaginatedSentEmails } from '@/lib/domain/emails';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = PaginatedEmailQuerySchema.safeParse({
    cursor: searchParams.get('cursor') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

  try {
    const result = await getPaginatedSentEmails(
      supabase,
      user.id,
      parsed.data.cursor,
      parsed.data.limit,
    );
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
