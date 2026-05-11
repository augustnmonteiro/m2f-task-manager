# 03 — Data Model

## Entities

### profiles

One profile row per authenticated user.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key; references `auth.users(id)` |
| `email` | text | Optional denormalized email |
| `display_name` | text | Optional |
| `email_summary_interval_seconds` | integer | Seconds between summary emails; default 60; must be > 0 |
| `created_at` | timestamptz | Default now |
| `updated_at` | timestamptz | Updated by trigger |

### tasks

User-owned task domain entity.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner; references `auth.users(id)` |
| `title` | text | Trimmed; 1-160 chars |
| `status` | enum | `pending` or `completed` |
| `created_at` | timestamptz | Default now |
| `completed_at` | timestamptz | Nullable; set once completed |
| `updated_at` | timestamptz | Updated by trigger |

Invariants:

- `completed_at` is null when status is `pending`.
- `completed_at` is non-null when status is `completed`.
- Completion is idempotent.

### emails

Simulated received email messages.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner |
| `kind` | enum | `immediate_task` or `summary` |
| `task_id` | uuid | Nullable; immediate email task reference |
| `subject` | text | Required |
| `body` | text | Required |
| `scheduled_at` | timestamptz | Nullable; when the cron job planned to send this |
| `sent_at` | timestamptz | Nullable; when the cron job actually sent it |
| `created_at` | timestamptz | Row creation timestamp |

Relationships:

- Immediate emails may reference one `tasks.id`.
- Summary emails may reference many tasks through `notification_actions`.

### sms_messages

Simulated received SMS messages.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner |
| `kind` | enum | `fibonacci_summary` |
| `body` | text | Required |
| `fibonacci_index` | integer | Index used for this send |
| `scheduled_at` | timestamptz | Nullable; when the cron job planned to send this |
| `sent_at` | timestamptz | Nullable; when the cron job actually sent it |
| `created_at` | timestamptz | Row creation timestamp |

### notification_actions

One-time action tokens embedded in simulated emails.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner |
| `email_id` | uuid | Email containing the action |
| `task_id` | uuid | Task to complete |
| `action_type` | enum | `complete_task` |
| `token_hash` | text | SHA-256 hash of random token |
| `expires_at` | timestamptz | Recommended: 7 days |
| `used_at` | timestamptz | Nullable |
| `created_at` | timestamptz | Default now |

Invariants:

- Raw tokens are never stored.
- Token is one-time use.
- Token can complete only a task owned by the same user.

### scheduler_state

One row per user to track recurring notification state.

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid | Primary key |
| `email_summary_last_sent_at` | timestamptz | Nullable |
| `sms_fibonacci_index` | integer | Default 0 |
| `sms_last_sent_at` | timestamptz | Nullable |
| `created_at` | timestamptz | Default now |
| `updated_at` | timestamptz | Updated by trigger |

### notification_runs

Idempotency ledger for scheduled notification execution.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `user_id` | uuid | Owner |
| `kind` | enum | `email_summary` or `sms_fibonacci` |
| `schedule_bucket` | timestamptz | Rounded scheduled time bucket |
| `created_at` | timestamptz | Default now |

Unique index:

- `(user_id, kind, schedule_bucket)`.

## Domain types

```ts
export type TaskStatus = 'pending' | 'completed';
export type EmailKind = 'immediate_task' | 'summary';
export type SmsKind = 'fibonacci_summary';
export type NotificationActionType = 'complete_task';
export type NotificationRunKind = 'email_summary' | 'sms_fibonacci';
// Preset label → seconds mapping (UI convenience; raw seconds stored in DB)
export const EMAIL_SUMMARY_INTERVAL_PRESETS = {
  '1_minute':   60,
  '15_minutes': 900,
  '1_hour':     3600,
  'daily':      86400,
  'weekly':     604800,
} as const;
```

## Sorting rules

- Pending tasks: newest `created_at` first.
- Completed tasks: newest `completed_at` first.
- Emails: newest `created_at` first.
- SMS: newest `created_at` first.

## Data retention

No automatic retention is required for this assignment. Keep all tasks, emails, SMS messages, scheduler state, and actions unless the test cleanup routine deletes them.
