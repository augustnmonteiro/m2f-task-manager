-- Fix private channel RLS policy.
-- The old 'for all' policy with auth.uid()::text returned null when Realtime
-- evaluated it before the JWT was in context, blocking every subscription.
-- A select-only policy scoped to 'authenticated' with (select auth.uid()) is
-- evaluated once per statement and works reliably in Realtime's auth check.
-- The insert path (broadcast trigger) runs as security definer and bypasses RLS.

drop policy if exists "users_own_dashboard_channel" on realtime.messages;

create policy "users can subscribe to own dashboard channel"
  on realtime.messages
  for select
  to authenticated
  using (realtime.topic() = 'dashboard:' || (select auth.uid())::text);
