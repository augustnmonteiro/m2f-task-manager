-- Remove duplicate SELECT policies created by 20260512000002_rls_read_policies.sql.
-- Equivalent policies already exist from the initial schema migration.
drop policy if exists "Users can read own tasks" on public.tasks;
drop policy if exists "Users can read own emails" on public.emails;
drop policy if exists "Users can read own sms" on public.sms_messages;
