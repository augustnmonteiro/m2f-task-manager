import { test as base } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { cleanupUser } from './cleanup';
import { uniqueEmail } from './test-users';

type Fixtures = { email: string };

export const test = base.extend<Fixtures>({
  email: async ({}, use) => {
    const email = uniqueEmail();
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(email);
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
    );
    const { data } = await admin.auth.admin.listUsers();
    const user = data?.users.find(u => u.email === email);
    if (user) await cleanupUser(user.id);
  },
});

export { expect } from '@playwright/test';
