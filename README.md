# Task Notifier SPA

A real-time, authenticated task dashboard that records tasks and simulates automated Email and SMS notifications in visible inbox-style panels.

Built with Next.js, Supabase, and Playwright.

## Features

- **Task management** — add, edit, delete, and complete tasks; pending and completed lists
- **Immediate email** — a simulated email fires as soon as a task is added, with a one-click "Done" action link
- **Recurring email digest** — a summary of all pending tasks sent on a configurable interval (default: every 60 seconds), driven by a cron endpoint
- **Fibonacci SMS** — recurring SMS reminders at Fibonacci-spaced intervals (1, 1, 2, 3, 5, 8 … minutes), driven by a cron endpoint
- **Realtime UI** — all panels update live via Supabase Realtime without a page refresh
- **User-scoped data** — Supabase Auth; each user owns their tasks, emails, and SMS messages

Notifications are simulated — no third-party email or SMS provider is used. Everything is visible in the on-screen Email and SMS panels.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database / Auth | Supabase (Postgres + Auth + Realtime) |
| Validation | Zod |
| Styling | Tailwind CSS |
| Tests | Playwright (POM) |

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env.local`:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
ACTION_TOKEN_SECRET=          # min 32 chars, used to sign task-completion JWTs
CRON_SECRET=                  # shared secret for cron endpoints
NEXT_PUBLIC_NOTIFICATION_TIME_SCALE=1   # set to 60 for E2E tests
E2E_TEST_MODE=false           # set true for E2E runs
```

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
npm run dev          # start dev server
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm run lint         # next lint
npm run test:e2e     # playwright test
npm run test:e2e:ui  # playwright test --ui
```

## Notification Scheduling

The two cron endpoints must be called on a regular cadence (e.g. every minute):

| Endpoint | Purpose |
|---|---|
| `POST /api/notifications/email-summary/run` | Send pending digest emails whose `scheduled_at` has elapsed |
| `POST /api/notifications/sms-fibonacci/run` | Send pending SMS messages whose `scheduled_at` has elapsed |

Both require `Authorization: Bearer <CRON_SECRET>`.

During development you can trigger both at once via:

```bash
curl -X POST http://localhost:3000/api/test/trigger-notifications
```

The email digest interval is configurable per user from the dashboard. Changing it immediately cancels the queued digest and schedules a fresh one at `now + new_interval`.
