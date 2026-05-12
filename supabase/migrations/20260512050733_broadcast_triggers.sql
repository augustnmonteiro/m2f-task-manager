-- Replace postgres_changes with Broadcast from Database.
-- A single trigger function fans out to the user's private dashboard channel.
create or replace function public.broadcast_user_table_changes()
returns trigger
security definer
language plpgsql
as $$
declare
  v_user_id uuid;
begin
  v_user_id := case tg_op when 'DELETE' then old.user_id else new.user_id end;
  perform realtime.broadcast_changes(
    'dashboard:' || v_user_id::text,
    tg_op,
    tg_op,
    tg_table_name,
    tg_table_schema,
    new,
    old
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists tasks_broadcast on public.tasks;
create trigger tasks_broadcast
  after insert or update or delete on public.tasks
  for each row execute function public.broadcast_user_table_changes();

drop trigger if exists emails_broadcast on public.emails;
create trigger emails_broadcast
  after insert or update or delete on public.emails
  for each row execute function public.broadcast_user_table_changes();

drop trigger if exists sms_messages_broadcast on public.sms_messages;
create trigger sms_messages_broadcast
  after insert or update or delete on public.sms_messages
  for each row execute function public.broadcast_user_table_changes();
