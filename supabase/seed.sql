-- E2E test user — present in local / CI environments only, never in production.
-- The on_auth_user_created trigger will insert the matching profile row.
insert into auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  '00000000-0000-0000-0000-000000000000',
  'e2e@test.local',
  crypt('TestPassword123!', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  false,
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
) on conflict (id) do update set
  confirmation_token = '',
  recovery_token = '',
  email_change_token_new = '',
  email_change = '';

-- Identity for the E2E test user (required for Supabase Auth admin API to recognise the user).
insert into auth.identities (
  id,
  user_id,
  provider_id,
  provider,
  identity_data,
  last_sign_in_at,
  created_at,
  updated_at
) values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaab',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'e2e@test.local',
  'email',
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","email":"e2e@test.local","email_verified":true,"phone_verified":false}',
  now(),
  now(),
  now()
) on conflict (id) do nothing;
