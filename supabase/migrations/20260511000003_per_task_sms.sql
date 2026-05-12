-- Each task owns its own Fibonacci SMS sequence.
-- sms_messages gains task_id; unique index changes to (task_id, fibonacci_index).

alter table public.sms_messages
  add column task_id uuid references public.tasks(id) on delete cascade;

-- Old uniqueness was (user_id, scheduled_at) — no longer meaningful.
drop index if exists sms_user_scheduled_unique_idx;

-- New: one row per (task, fibonacci step).
create unique index sms_task_fibonacci_unique_idx
  on public.sms_messages (task_id, fibonacci_index)
  where task_id is not null;

-- Remove pending rows from the old global scheme.
delete from public.sms_messages where sent_at is null and task_id is null;
