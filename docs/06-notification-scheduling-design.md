# 06 — Notification and Scheduling Design

## Summary

Notifications are simulated by persisting rows to Supabase tables:

- Email notifications → `emails`
- SMS notifications → `sms_messages`

No third-party Email or SMS provider is integrated.

Recurring notifications are triggered by a server-side cron job, not a client-side scheduler. Each notification row records `scheduled_at` (when the cron planned the send) and `sent_at` (when it was actually processed).

## Notification types

| Type | Trigger | Destination table | Required body content |
|---|---|---|---|
| Immediate email | Task added | `emails` | Added task title and action link |
| Recurring email summary | Every 1 minute | `emails` | Current pending tasks and action links |
| Fibonacci SMS | 1, 1, 2, 3, 5... minute intervals | `sms_messages` | One SMS per pending task (task title only) |

## Immediate task email

Triggered inside the same server-side operation that creates a task.

### Subject

```text
Task added: {taskTitle}
```

### Body

```text
A new task was added: {taskTitle}.
Created at: {formattedTimestamp}.
```

### Action

One action per immediate email:

```text
Complete task
```

The action link points to:

```text
/api/email-actions/complete-task?token={rawToken}
```

The raw token is shown only in the rendered email action URL. Store only the token hash in `notification_actions`.

## Recurring email summary

Triggered by the cron job according to the user's `email_summary_interval` setting stored in `profiles`.

### Interval

The interval is stored as `profiles.email_summary_interval_seconds` (integer, default 60). The UI exposes preset options that map to seconds:

| UI label | Seconds |
|---|---|
| Every minute (default) | 60 |
| Every 15 minutes | 900 |
| Every hour | 3600 |
| Daily | 86400 |
| Weekly | 604800 |

Custom values are supported — any positive integer of seconds is valid.

The cron job runs frequently (e.g. every minute) and checks `now() - scheduler_state.email_summary_last_sent_at >= interval '1 second' * profiles.email_summary_interval_seconds` to decide whether a summary is due for each user.

### Subject

```text
Pending tasks summary
```

### Body if tasks exist

```text
Pending tasks:
1. Buy milk
2. Send invoice
```

### Body if no tasks exist

```text
No pending tasks.
```

### Actions

For every pending task in the summary, generate one complete action token and render one link/button.

Example labels:

```text
Complete Buy milk
Complete Send invoice
```

## Fibonacci SMS

Triggered by the cron job.

### Sequence

Intervals follow the Fibonacci sequence in seconds (1 min, 1 min, 2 min, 3 min, ...):

```text
60, 60, 120, 180, 300, 480, 780, 1260, ...
```

Implementation utility:

```ts
export function fibonacciIntervalSeconds(index: number): number {
  if (index <= 1) return 60;
  let prev = 60;
  let curr = 60;
  for (let i = 2; i <= index; i += 1) {
    const next = prev + curr;
    prev = curr;
    curr = next;
  }
  return curr;
}
```

### Body per SMS (one SMS per pending task)

```text
Buy milk
```

```text
Send invoice
```

### Body if no tasks exist

```text
No pending tasks.
```

### State advancement

After a successful SMS insert:

- insert `sms_messages.fibonacci_index = currentIndex`;
- update `scheduler_state.sms_fibonacci_index = currentIndex + 1`;
- set `scheduler_state.sms_last_sent_at = now()`.

## Cron job responsibilities

The cron job runs on a fixed server-side schedule (e.g. every minute) and is responsible for two things:

1. **Send pending notifications** — find rows where `scheduled_at <= now() AND sent_at IS NULL`, process each one, and set `sent_at` only after the notification is successfully stored. Use `SELECT ... FOR UPDATE SKIP LOCKED` so concurrent cron runs never process the same row twice.
2. **Schedule the next notification** — after sending, insert the next email summary or SMS row with the appropriate future `scheduled_at`, based on the user's `email_summary_interval_seconds` or the next Fibonacci interval.

### Transactional safety

Each notification is processed in a single database transaction:

```
BEGIN
  SELECT ... FROM emails WHERE id = $id FOR UPDATE  -- lock the row
  -- simulate sending (content already stored in the row)
  UPDATE emails SET sent_at = now() WHERE id = $id
  INSERT INTO emails (..., scheduled_at = now() + interval_seconds)  -- schedule next
COMMIT
```

If anything fails before `COMMIT`, the transaction rolls back, `sent_at` stays `NULL`, and the cron will retry on the next run.

## Idempotency

`SELECT ... FOR UPDATE SKIP LOCKED` ensures overlapping cron runs never process the same row. Once `sent_at` is set the row is never picked up again. The unique index on `(user_id, scheduled_at)` prevents duplicate scheduled rows for the same bucket.

### Email summary idempotency

Use schedule bucket rounded to minute:

```text
2026-05-11T14:06:00.000Z
```

Insert into `notification_runs`:

```text
(user_id, kind='email_summary', schedule_bucket)
```

If insert conflicts, return success with `created: false`.

### SMS idempotency

Use a schedule bucket based on server time and the current Fibonacci index. Insert into `notification_runs`:

```text
(user_id, kind='sms_fibonacci', schedule_bucket)
```

If insert conflicts, return success with `created: false`.

## Duplicate-run behavior

`SKIP LOCKED` and `sent_at` together guarantee:

- At most one cron worker processes any given notification row.
- At most one scheduled row per user per bucket (unique index).
- All open tabs receive the `sent_at` update through Realtime.

## Testability

E2E tests must not wait real minutes. Implement at least one of:

1. An E2E-only control endpoint guarded by `E2E_TEST_MODE=true` that manually triggers the notification handlers.
2. Playwright clock installation combined with a reduced cron interval in the test environment.

## Failure behavior

If a scheduled notification endpoint fails:

- show a non-blocking status message;
- retry on the next interval;
- never block task management.
