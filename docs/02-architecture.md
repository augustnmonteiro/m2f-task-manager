# 02 — Architecture

## Architectural style

A Next.js App Router application with:

- Server Components for authenticated shell and initial data loading;
- Client Components for forms, realtime subscriptions, optimistic UI, timers, and live panels;
- Server Actions for form-like domain mutations;
- Route Handlers for notification scheduler calls and email action links;
- Supabase Auth, Postgres, and Realtime as the backend platform.

## High-level component diagram

```text
Browser
  └─ app/page.tsx                       Server Component
      ├─ AuthGate                       Server Component
      └─ DashboardShell                 Server Component
          └─ DashboardClient            Client Component
              ├─ TaskPanel              Client Component
              ├─ EmailPanel             Client Component
              ├─ SmsPanel               Client Component
              └─ RealtimeProvider       Client Component

Next.js Server
  ├─ Server Actions
  │   ├─ createTask(input)
  │   └─ completeTask(input)
  ├─ Route Handlers
  │   ├─ POST /api/notifications/email-summary/run   (called by cron)
  │   ├─ POST /api/notifications/sms-fibonacci/run   (called by cron)
  │   └─ GET  /api/email-actions/complete-task
  ├─ Domain Services
  │   ├─ taskService
  │   ├─ emailService
  │   ├─ smsService
  │   └─ schedulerService
  └─ Supabase SSR clients
      ├─ server client
      └─ browser client

Supabase
  ├─ Auth users
  ├─ Postgres tables
  ├─ RLS policies
  └─ Realtime subscriptions
```

## Server/Client Component split

### Server Components

Use Server Components for:

- `app/page.tsx` authenticated entry;
- loading initial dashboard data;
- reading session/user claims;
- redirecting unauthenticated users or rendering auth UI;
- passing serialized initial data into a Client Component.

Server Components should not include browser-only effects, timers, or direct event handlers.

### Client Components

Use Client Components for:

- task input and Complete buttons;
- realtime subscriptions;
- scheduler timers;
- optimistic updates and pending state;
- relative age display;
- action toasts/errors.

Client Components must import only browser-safe Supabase client utilities.

## Suggested folder structure

```text
app/
  layout.tsx
  page.tsx
  auth/
    callback/route.ts
  api/
    email-actions/
      complete-task/route.ts
    notifications/
      email-summary/
        run/route.ts
      sms-fibonacci/
        run/route.ts
components/
  dashboard/
    dashboard-client.tsx
    task-panel.tsx
    email-panel.tsx
    sms-panel.tsx
    realtime-provider.tsx
    empty-state.tsx
  auth/
    auth-form.tsx
lib/
  env.ts
  supabase/
    client.ts
    server.ts
    middleware.ts
  schemas/
    task.ts
    notification.ts
    auth.ts
    shared.ts
  domain/
    tasks.ts
    emails.ts
    sms.ts
    scheduler.ts
    notification-actions.ts
  time/
    fibonacci.ts
    format.ts
    scale.ts
  errors.ts
  result.ts
server-actions/
  tasks.ts
  auth.ts
types/
  database.types.ts
tests/
  e2e/
    pages/
      dashboard-page.ts
      auth-page.ts
      panels.ts
    specs/
      task-notification-lifecycle.spec.ts
      email-complete-roundtrip.spec.ts
      realtime-two-tab.spec.ts
```

## Request/data flow: add task

```text
User types task title
  → TaskPanel client validates basic UI state
  → createTask Server Action called with raw input
  → Zod CreateTaskInputSchema validates input
  → server validates authenticated user
  → insert task row
  → create notification action token
  → insert immediate email row (scheduled_at = now(), sent_at = NULL)
  → insert notification action with token hash
  → if no unsent summary email exists: insert next summary email (scheduled_at = now() + interval)
  → if no unsent SMS exists: insert next SMS (scheduled_at = now() + fibonacci(index) seconds)
  → return typed Task + Email response
  → Realtime broadcasts inserts to all user tabs
  → UI shows pending task and email
```

## Request/data flow: complete from task list

```text
User clicks Complete
  → completeTask Server Action called with task id
  → Zod CompleteTaskInputSchema validates id
  → server validates user
  → update user's task if pending
  → set status='completed', completed_at=now()
  → return typed Task
  → Realtime broadcasts update
  → UI moves row from pending to completed
```

## Request/data flow: complete from email action

```text
User clicks action link in simulated email
  → GET /api/email-actions/complete-task?token=...
  → Zod validates query string
  → server validates authenticated user
  → hash token and look up unused, unexpired action for user
  → complete associated task idempotently
  → set action.used_at=now()
  → redirect to /?emailAction=completed
  → dashboard fetch/realtime shows completed state
```

## Request/data flow: recurring email summary

```text
Task created (or previous summary sent)
  → insert emails row with scheduled_at = now() + email_summary_interval_seconds, sent_at = NULL

Cron job fires
  → POST /api/notifications/email-summary/run
  → server validates cron auth
  → BEGIN transaction
  → SELECT unsent due email rows FOR UPDATE SKIP LOCKED
  → for each row: fetch pending tasks, build body, generate action tokens
  → UPDATE emails SET sent_at = now()
  → insert next scheduled email row
  → COMMIT
  → Realtime broadcasts sent_at update
```

## Request/data flow: Fibonacci SMS

```text
Scheduler activated (or previous SMS sent)
  → insert sms_messages row with scheduled_at = now() + fibonacci(index) seconds, sent_at = NULL

Cron job fires
  → POST /api/notifications/sms-fibonacci/run
  → server validates cron auth
  → BEGIN transaction
  → SELECT unsent due SMS rows FOR UPDATE SKIP LOCKED
  → for each row: fetch pending tasks, build body
  → UPDATE sms_messages SET sent_at = now()
  → increment sms_fibonacci_index in scheduler_state
  → insert next scheduled SMS row with scheduled_at = now() + fibonacciIntervalSeconds(new_index)
  → COMMIT
  → Realtime broadcasts sent_at update and scheduler_state update
```

## Why notification scheduling is server-side (cron)

Recurring notifications are driven by a server-side cron job that calls the notification route handlers. This keeps scheduling authoritative, independent of whether any user has the app open, and resilient to tab closes or disconnects. The route handlers enforce idempotency and RLS regardless of the caller.

## State management

Keep state simple:

- Initial data comes from the server.
- The client owns a local normalized view of `tasks`, `emails`, and `smsMessages`.
- Server mutations return canonical rows.
- Realtime events upsert/delete rows in local state.
- Avoid a global state library unless implementation complexity grows.

## Error handling

Use a standard result envelope for server actions and JSON route handlers:

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string[]> } };
```

Route handlers should return proper HTTP status codes and the same JSON shape.
