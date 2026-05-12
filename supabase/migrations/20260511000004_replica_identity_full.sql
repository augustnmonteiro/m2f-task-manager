-- postgres_changes UPDATE payloads only include changed columns by default.
-- REPLICA IDENTITY FULL ensures the full row is included so RealtimeProvider
-- can reconstruct complete task/email/sms objects from UPDATE events.
alter table public.tasks replica identity full;
alter table public.emails replica identity full;
alter table public.sms_messages replica identity full;
