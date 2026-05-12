create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  insert into public.emails (user_id, kind, subject, scheduled_at)
  values (new.id, 'summary', 'Pending tasks summary', now() + interval '60 seconds')
  on conflict do nothing;

  insert into public.sms_messages (user_id, kind, fibonacci_index, scheduled_at)
  values (new.id, 'fibonacci_summary', 0, now() + interval '1 second')
  on conflict do nothing;

  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
