'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ok, err, type ActionResult } from '@/lib/result';

const AuthInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function signUp(formData: FormData): Promise<ActionResult<null>> {
  const parsed = AuthInputSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return err({ code: 'VALIDATION_ERROR', message: 'Invalid email or password.' });
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp(parsed.data);
  if (error) return err({ code: 'INTERNAL_ERROR', message: error.message });
  return ok(null);
}

export async function signIn(formData: FormData): Promise<ActionResult<null>> {
  const parsed = AuthInputSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return err({ code: 'VALIDATION_ERROR', message: 'Invalid email or password.' });
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return err({ code: 'UNAUTHENTICATED', message: 'Invalid credentials.' });
  return ok(null);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
