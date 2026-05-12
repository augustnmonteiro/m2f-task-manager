import { z } from 'zod';

const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  ACTION_TOKEN_SECRET: z.string().min(32),
  EMAIL_JWT_SECRET: z.string().min(32),
  CRON_SECRET: z.string().min(32),
  E2E_TEST_MODE: z.enum(['true', 'false']).default('false'),
});

export const env = EnvSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  ACTION_TOKEN_SECRET: process.env.ACTION_TOKEN_SECRET,
  EMAIL_JWT_SECRET: process.env.EMAIL_JWT_SECRET,
  CRON_SECRET: process.env.CRON_SECRET,
  E2E_TEST_MODE: process.env.E2E_TEST_MODE,
});
