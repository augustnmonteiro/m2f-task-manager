create policy "Users can read own tasks"
on public.tasks
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can read own emails"
on public.emails
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can read own sms"
on public.sms_messages
for select
to authenticated
using (auth.uid() = user_id);
