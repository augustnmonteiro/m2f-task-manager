# 04 — API Contracts and Zod Boundaries

## Contract principles

1. Every external value is parsed with Zod before domain logic.
2. Every database row that crosses into UI state is parsed with a row schema.
3. All route handlers return a consistent JSON envelope.
4. Server Actions return a typed `ActionResult<T>` envelope.
5. Errors are safe for display and do not leak secrets.

## Shared result envelope

```ts
export type AppErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'EXPIRED_TOKEN'
  | 'TOKEN_ALREADY_USED'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

export type AppError = {
  code: AppErrorCode;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AppError };
```

## Environment schema

Validate at startup in `lib/env.ts`.

```ts
import { z } from 'zod';

export const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1), // modern replacement for the legacy ANON_KEY
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),
  ACTION_TOKEN_SECRET: z.string().min(32),
  NEXT_PUBLIC_NOTIFICATION_TIME_SCALE: z.coerce.number().positive().default(1),
  E2E_TEST_MODE: z.enum(['true', 'false']).default('false'),
});
```

`NEXT_PUBLIC_NOTIFICATION_TIME_SCALE` controls how long a simulated minute lasts. In production-like development use `1`; in E2E use `60`, making 1 simulated minute equal 1 real second.

## Domain schemas

### Profile schemas

```ts
export const UpdateEmailSummaryIntervalInputSchema = z.object({
  intervalSeconds: z.number().int().positive(),
});

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  email: z.string().nullable(),
  displayName: z.string().nullable(),
  emailSummaryIntervalSeconds: z.number().int().positive(),
});
```

### Task schemas

```ts
import { z } from 'zod';

export const TaskIdSchema = z.string().uuid();

export const TaskStatusSchema = z.enum(['pending', 'completed']);

export const CreateTaskInputSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required').max(160),
});

export const CompleteTaskInputSchema = z.object({
  taskId: TaskIdSchema,
});

export const TaskSchema = z.object({
  id: TaskIdSchema,
  userId: z.string().uuid(),
  title: z.string().min(1).max(160),
  status: TaskStatusSchema,
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime(),
});
```

### Email schemas

```ts
export const EmailKindSchema = z.enum(['immediate_task', 'summary']);

export const EmailActionSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  label: z.string().min(1),
  href: z.string().min(1),
  usedAt: z.string().datetime().nullable(),
  expiresAt: z.string().datetime(),
});

export const EmailSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  kind: EmailKindSchema,
  taskId: z.string().uuid().nullable(),
  subject: z.string().min(1),
  body: z.string().min(1),
  createdAt: z.string().datetime(),
  actions: z.array(EmailActionSchema).default([]),
});

export const CompleteTaskEmailActionQuerySchema = z.object({
  token: z.string().min(32).max(512),
});

export const PaginatedEmailQuerySchema = z.object({
  // cursor is the createdAt of the oldest item currently loaded
  cursor: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export const PaginatedEmailResultSchema = z.object({
  emails: z.array(EmailSchema),
  hasMore: z.boolean(),
});
```

### SMS schemas

```ts
export const SmsSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  kind: z.literal('fibonacci_summary'),
  body: z.string().min(1),
  fibonacciIndex: z.number().int().min(0),
  createdAt: z.string().datetime(),
});

export const PaginatedSmsQuerySchema = z.object({
  cursor: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

export const PaginatedSmsResultSchema = z.object({
  smsMessages: z.array(SmsSchema),
  hasMore: z.boolean(),
});
```

### Scheduler schemas

```ts
export const RunScheduledNotificationInputSchema = z.object({
  clientRequestId: z.string().uuid().optional(),
});

export const SchedulerStateSchema = z.object({
  userId: z.string().uuid(),
  emailSummaryLastSentAt: z.string().datetime().nullable(),
  smsFibonacciIndex: z.number().int().min(0),
  smsLastSentAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime(),
});
```

## Server Actions

### `updateEmailSummaryInterval(input)`

File: `server-actions/profile.ts`

Input:

```ts
UpdateEmailSummaryIntervalInputSchema
```

Output:

```ts
ActionResult<{ profile: Profile }>;
```

Behavior:

1. Parse input with `UpdateEmailSummaryIntervalInputSchema`.
2. Require authenticated user.
3. Upsert `profiles.email_summary_interval` for current user.
4. Return updated profile DTO.

### `createTask(input)`

File: `server-actions/tasks.ts`

Input:

```ts
CreateTaskInputSchema
```

Output:

```ts
ActionResult<{
  task: Task;
  email: Email;
}>;
```

Behavior:

1. Parse input with `CreateTaskInputSchema`.
2. Require authenticated user.
3. Insert pending task.
4. Generate email action token.
5. Insert immediate email with `scheduled_at = now()`, `sent_at = NULL`.
6. Insert notification action with token hash.
7. If no pending scheduled summary email exists for the user, insert one with `scheduled_at = now() + email_summary_interval_seconds`.
8. If no pending scheduled SMS exists for the user, insert one with `scheduled_at = now() + fibonacci(current_index) seconds`.
9. Return canonical task and email DTOs.

Validation errors:

- Empty title: `VALIDATION_ERROR` with `fieldErrors.title`.
- Title too long: `VALIDATION_ERROR` with `fieldErrors.title`.

### `completeTask(input)`

Input:

```ts
CompleteTaskInputSchema
```

Output:

```ts
ActionResult<{ task: Task }>;
```

Behavior:

1. Parse input.
2. Require authenticated user.
3. Update the user's task to completed if pending.
4. Return completed task.
5. If already completed, return the existing completed task as success.

## Route Handlers

### `GET /api/notifications/emails?cursor=&limit=`

Purpose: Load a page of emails for the authenticated user, newest first.

Boundary schemas:

- Query: `PaginatedEmailQuerySchema`.

Behavior:

1. Parse query.
2. Require authenticated user.
3. Query: `SELECT ... WHERE user_id = $uid AND sent_at IS NOT NULL AND (cursor IS NULL OR created_at < $cursor) ORDER BY created_at DESC LIMIT limit + 1`.
4. If `limit + 1` rows returned, set `hasMore = true` and trim the result to `limit` rows.
5. Return `PaginatedEmailResultSchema`.

### `GET /api/notifications/sms?cursor=&limit=`

Purpose: Load a page of SMS messages for the authenticated user, newest first.

Boundary schemas:

- Query: `PaginatedSmsQuerySchema`.

Behavior: same pattern as email endpoint, querying `sms_messages` with `sent_at IS NOT NULL`.

### `GET /api/email-actions/complete-task?token=...`

Purpose: Complete a task using an action link embedded in a simulated email.

Boundary schemas:

- Query: `CompleteTaskEmailActionQuerySchema`.

Behavior:

1. Parse query.
2. Require authenticated user.
3. Hash incoming token.
4. Find matching action by hash and current user.
5. Reject expired token.
6. If unused, complete task and set `used_at`.
7. If already used but task is completed, redirect with success state.
8. Redirect to `/?emailAction=completed` on success.
9. Redirect to `/?emailAction=invalid` on safe validation failure.

Responses:

- Success: `303` redirect to `/`.
- Invalid/expired: `303` redirect to `/` with query status.
- Unauthenticated: redirect to auth screen with return URL.

### `POST /api/notifications/email-summary/run`

Purpose: Process all unsent due email summaries and schedule the next one per user.

Boundary schemas:

- Body: `RunScheduledNotificationInputSchema`.

Output:

```ts
ActionResult<{
  processed: number;
}>;
```

Behavior:

1. Parse body.
2. Require cron auth (service-role key or shared secret header).
3. `SELECT id, user_id FROM emails WHERE scheduled_at <= now() AND sent_at IS NULL FOR UPDATE SKIP LOCKED`.
4. For each row, within a single transaction:
   a. Fetch current pending tasks for the user.
   b. Build email body and generate action tokens for pending tasks.
   c. `UPDATE emails SET sent_at = now() WHERE id = $id`.
   d. Insert next scheduled email row: `scheduled_at = now() + profiles.email_summary_interval_seconds`.
5. Return count of processed rows.

### `POST /api/notifications/sms-fibonacci/run`

Purpose: Process all unsent due Fibonacci SMS messages and schedule the next one per user.

Boundary schemas:

- Body: `RunScheduledNotificationInputSchema`.

Output:

```ts
ActionResult<{
  processed: number;
}>;
```

Behavior:

1. Parse body.
2. Require cron auth.
3. `SELECT id, user_id FROM sms_messages WHERE scheduled_at <= now() AND sent_at IS NULL FOR UPDATE SKIP LOCKED`.
4. For each row, within a single transaction:
   a. Fetch current pending tasks for the user.
   b. Build SMS body.
   c. `UPDATE sms_messages SET sent_at = now() WHERE id = $id`.
   d. Increment `scheduler_state.sms_fibonacci_index`.
   e. Insert next scheduled SMS row: `scheduled_at = now() + fibonacciIntervalSeconds(new_index)`.
5. Return count of processed rows.

## DTO mapping rules

Do not expose raw database rows directly to Client Components. Map snake_case DB rows to camelCase DTOs and parse with Zod:

```ts
function toTaskDto(row: unknown): Task {
  const parsed = DbTaskRowSchema.parse(row);
  return TaskSchema.parse({
    id: parsed.id,
    userId: parsed.user_id,
    title: parsed.title,
    status: parsed.status,
    createdAt: parsed.created_at,
    completedAt: parsed.completed_at,
    updatedAt: parsed.updated_at,
  });
}
```

## HTTP status recommendations

| Condition | Status |
|---|---:|
| Success | 200 |
| Created | 201 |
| Validation error | 400 |
| Unauthenticated | 401 |
| Forbidden | 403 |
| Not found | 404 |
| Conflict/idempotency duplicate | 200 with `created:false` or 409 if true error |
| Unexpected error | 500 |
