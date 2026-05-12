-- body is null for pre-scheduled rows until the cron fills it at send time
alter table public.emails
  alter column body drop not null,
  drop constraint if exists emails_body_check;

alter table public.sms_messages
  alter column body drop not null,
  drop constraint if exists sms_messages_body_check;
