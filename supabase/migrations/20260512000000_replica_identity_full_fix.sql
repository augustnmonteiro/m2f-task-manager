-- REPLICA IDENTITY FULL is required for postgres_changes UPDATE events to include
-- the full row in the WAL payload. Without it, only changed columns are present,
-- so the user_id filter on realtime subscriptions cannot be evaluated and events
-- are silently dropped. This re-applies the setting to cover production databases
-- where migration 20260511000004 was not applied.
alter table public.tasks replica identity full;
alter table public.emails replica identity full;
alter table public.sms_messages replica identity full;
