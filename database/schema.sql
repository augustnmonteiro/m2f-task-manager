-- Task Notifier SPA — Supabase schema
-- Run in Supabase SQL editor or as a migration.

-- Enums
create type public.task_status as enum ('pending', 'completed');
create type public.email_kind as enum ('immediate_task', 'summary');
create type public.sms_kind as enum ('fibonacci_summary');
create type public.notification_action_type as enum ('complete_task');
create type public.notification_run_kind as enum ('email_summary', 'sms_fibonacci');

-- Utility trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  email_summary_interval_seconds integer not null default 60 check (email_summary_interval_seconds > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 160),
  status public.task_status not null default 'pending',
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint tasks_completion_consistency check (
    (status = 'pending' and completed_at is null)
    or
    (status = 'completed' and completed_at is not null)
  )
);

create index if not exists tasks_user_status_created_idx
  on public.tasks (user_id, status, created_at desc);

create index if not exists tasks_user_completed_idx
  on public.tasks (user_id, completed_at desc)
  where status = 'completed';

create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

-- Emails
create table if not exists public.emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind public.email_kind not null,
  task_id uuid references public.tasks(id) on delete set null,
  subject text not null check (char_length(trim(subject)) > 0),
  body text not null check (char_length(trim(body)) > 0),
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists emails_user_created_idx
  on public.emails (user_id, created_at desc);

-- Paginated inbox query: only sent emails, newest first
create index if not exists emails_user_sent_created_idx
  on public.emails (user_id, created_at desc)
  where sent_at is not null;

create unique index if not exists emails_user_summary_scheduled_unique_idx
  on public.emails (user_id, scheduled_at)
  where kind = 'summary' and scheduled_at is not null;

-- Cron pickup: unsent emails that are due
create index if not exists emails_pending_send_idx
  on public.emails (scheduled_at)
  where sent_at is null and scheduled_at is not null;

-- SMS
create table if not exists public.sms_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  kind public.sms_kind not null default 'fibonacci_summary',
  body text,
  fibonacci_index integer not null check (fibonacci_index >= 0),
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists sms_user_created_idx
  on public.sms_messages (user_id, created_at desc);

-- Paginated inbox query: only sent SMS, newest first
create index if not exists sms_user_sent_idx
  on public.sms_messages (user_id, sent_at desc)
  where sent_at is not null;

-- One row per (task, fibonacci step)
create unique index if not exists sms_task_fibonacci_unique_idx
  on public.sms_messages (task_id, fibonacci_index)
  where task_id is not null;

-- Cron pickup: unsent SMS that are due
create index if not exists sms_pending_send_idx
  on public.sms_messages (scheduled_at)
  where sent_at is null and scheduled_at is not null;

-- Notification actions
create table if not exists public.notification_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email_id uuid not null references public.emails(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  action_type public.notification_action_type not null default 'complete_task',
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notification_actions_user_email_idx
  on public.notification_actions (user_id, email_id);

create index if not exists notification_actions_user_task_idx
  on public.notification_actions (user_id, task_id);

-- Scheduler state
create table if not exists public.scheduler_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_summary_last_sent_at timestamptz,
  sms_fibonacci_index integer not null default 0 check (sms_fibonacci_index >= 0),
  sms_last_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger scheduler_state_set_updated_at
before update on public.scheduler_state
for each row execute function public.set_updated_at();

-- Notification run idempotency ledger
create table if not exists public.notification_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind public.notification_run_kind not null,
  schedule_bucket timestamptz not null,
  created_at timestamptz not null default now(),
  unique (user_id, kind, schedule_bucket)
);

create index if not exists notification_runs_user_kind_idx
  on public.notification_runs (user_id, kind, schedule_bucket desc);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.emails enable row level security;
alter table public.sms_messages enable row level security;
alter table public.notification_actions enable row level security;
alter table public.scheduler_state enable row level security;
alter table public.notification_runs enable row level security;

-- Profiles policies
create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Tasks policies
create policy "tasks_select_own"
  on public.tasks for select
  using (user_id = auth.uid());

create policy "tasks_insert_own"
  on public.tasks for insert
  with check (user_id = auth.uid());

create policy "tasks_update_own"
  on public.tasks for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "tasks_delete_own"
  on public.tasks for delete
  using (user_id = auth.uid());

-- Emails policies
create policy "emails_select_own"
  on public.emails for select
  using (user_id = auth.uid());

create policy "emails_insert_own"
  on public.emails for insert
  with check (user_id = auth.uid());

-- SMS policies
create policy "sms_select_own"
  on public.sms_messages for select
  using (user_id = auth.uid());

create policy "sms_insert_own"
  on public.sms_messages for insert
  with check (user_id = auth.uid());

-- Notification action policies
create policy "notification_actions_select_own"
  on public.notification_actions for select
  using (user_id = auth.uid());

create policy "notification_actions_insert_own"
  on public.notification_actions for insert
  with check (user_id = auth.uid());

create policy "notification_actions_update_own"
  on public.notification_actions for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Scheduler state policies
create policy "scheduler_state_select_own"
  on public.scheduler_state for select
  using (user_id = auth.uid());

create policy "scheduler_state_insert_own"
  on public.scheduler_state for insert
  with check (user_id = auth.uid());

create policy "scheduler_state_update_own"
  on public.scheduler_state for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Notification run policies
create policy "notification_runs_select_own"
  on public.notification_runs for select
  using (user_id = auth.uid());

create policy "notification_runs_insert_own"
  on public.notification_runs for insert
  with check (user_id = auth.uid());

-- Realtime publication
-- Supabase may already have this publication. Add tables if not already present.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.tasks;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.emails;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.sms_messages;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.scheduler_state;
    exception when duplicate_object then null;
    end;
  end if;
end $$;
