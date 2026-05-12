-- Private Realtime channels enforce RLS so each user can only subscribe to
-- their own dashboard channel. Without this, any authenticated user could
-- subscribe to dashboard:<another-user-uuid> and receive their broadcasts.
alter table realtime.messages enable row level security;

create policy "users_own_dashboard_channel"
  on realtime.messages
  for all
  using  (realtime.topic() = 'dashboard:' || auth.uid()::text)
  with check (realtime.topic() = 'dashboard:' || auth.uid()::text);
