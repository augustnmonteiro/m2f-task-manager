# 00 — Product Brief

## Product name

Task Notifier SPA

## One-sentence description

A real-time, authenticated task dashboard that records tasks and simulates automated Email and SMS notifications in visible inbox-style panels.

## Objective

Create a small but production-quality Next.js app that demonstrates:

- authenticated, user-scoped task management;
- real-time updates;
- simulated notification generation;
- deterministic recurring scheduling;
- complete end-to-end tests across UI, notification state, and task completion from an email action.

## Primary user

A signed-in user who wants to add tasks, see task notifications, receive periodic reminders, and complete tasks either directly from the task list or from a notification email action.

## Scope

### In scope

- One authenticated SPA dashboard.
- Supabase signup, login, logout, and user-scoped data.
- Pending and completed task lists.
- Immediate simulated email when a task is added.
- Recurring simulated email summary every 1 minute, triggered by cron.
- Recurring simulated SMS summary using Fibonacci minute intervals, triggered by cron.
- Email action link/button that completes the corresponding task.
- Realtime UI updates through Supabase Realtime.
- Zod validation on all route handlers, server actions, query strings, and server-to-client domain adapters.
- Playwright E2E tests using Page Object Model.

### Out of scope

- Actual third-party Email or SMS integration.
- Push notifications.
- Multi-user collaboration on shared tasks.
- Complex task metadata such as due dates, priority, tags, file attachments, comments, or subtasks.
- Native mobile app.
- External Email or SMS provider.

## Product assumptions

1. Each authenticated user owns their own tasks, emails, SMS messages, and scheduler state.
2. Notification timestamps are generated server-side when rows are inserted.
3. The dashboard scheduler is active only while the user has the app open.
4. To avoid duplicate notifications across tabs, server endpoints use idempotency keys and persisted scheduler state.
5. The app may include minimal auth UI, but once authenticated, the product experience is one page with Tasks, Emails, and SMS visible together.
6. The first Fibonacci SMS fires after 1 minute, the second after 1 minute, then after 2, 3, 5, 8 minutes, and so on.
7. Recurring summaries should still fire when there are no pending tasks, using an empty-state body such as `No pending tasks.`

## Success criteria

- A developer can implement the app from this spec without asking for product clarification.
- A coding agent can decompose the work into safe, testable commits.
- Playwright proves the full lifecycle: add task, see immediate email, advance schedule, see SMS, complete task from email, and verify task state changes.
