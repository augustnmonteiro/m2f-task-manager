import { createClient } from '@/lib/supabase/server';
import { AuthForm } from '@/components/auth/auth-form';

export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <AuthForm />;

  return (
    <main>
      <p>Signed in as {user.email}</p>
    </main>
  );
}
