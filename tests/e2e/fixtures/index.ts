import { test as base } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { cleanupTestUserData } from './cleanup';
import { testUserEmail, testPassword } from './test-users';

type Fixtures = { email: string };

export const test = base.extend<Fixtures>({
  // eslint-disable-next-line react-hooks/rules-of-hooks
  email: async ({}, use) => {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
    );

    // Find the seeded user by email; create them on first run (e.g. hosted Supabase).
    const { data: { users } } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    let testUser = users.find(u => u.email === testUserEmail);

    if (!testUser) {
      const { data, error } = await admin.auth.admin.createUser({
        email: testUserEmail,
        password: testPassword,
        email_confirm: true,
      });
      if (error) throw new Error(`Failed to create test user: ${error.message}`);
      if (!data.user) throw new Error(`createUser returned no user for ${testUserEmail}`);
      testUser = data.user;
    }

    await cleanupTestUserData(testUser.id);
    await use(testUserEmail);
    await cleanupTestUserData(testUser.id);
  },
});

export { expect } from '@playwright/test';
