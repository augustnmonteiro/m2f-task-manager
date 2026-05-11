# 10 — Implementation Plan

## Milestone 0 — Repo setup

- Create Next.js 15 TypeScript app.
- Enable TypeScript strict mode.
- Install Tailwind.
- Install Supabase packages.
- Install Zod.
- Install Playwright.
- Add lint/typecheck/test scripts.
- Add environment validation.

Suggested scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

## Milestone 1 — Supabase foundation

- Apply `database/schema.sql`.
- Generate database types.
- Create Supabase browser client.
- Create Supabase server client.
- Add proxy/session refresh integration.
- Build signup/login/logout UI.
- Protect dashboard.

Acceptance:

- User can sign up/login/logout.
- User sees empty dashboard.

## Milestone 2 — Task domain

- Implement Zod task schemas.
- Implement task DTO mappers.
- Implement `createTask` server action.
- Implement `completeTask` server action.
- Build Tasks panel.

Acceptance:

- Add task.
- Complete task.
- Pending/completed lists render correctly.

## Milestone 3 — Immediate email notification

- Implement token utility.
- Implement email service.
- Extend `createTask` to insert immediate email and action.
- Build Email panel and action rendering.
- Implement complete-task email action route.

Acceptance:

- Adding task creates email.
- Email action completes task.

## Milestone 4 — Recurring scheduler

- Implement Fibonacci utility.
- Implement scheduler state service.
- Implement email summary route handler.
- Implement SMS Fibonacci route handler.
- Build `NotificationScheduler` client component.
- Add idempotency via `notification_runs`.

Acceptance:

- Summary email appears every simulated minute.
- First SMS appears after first Fibonacci interval.
- Duplicate tabs do not create duplicate scheduled messages for the same bucket.

## Milestone 5 — Realtime

- Enable Realtime publication for required tables.
- Implement RealtimeProvider.
- Merge inserts/updates into local state.
- Add reconnect refetch fallback.

Acceptance:

- Two tabs sync task, email, SMS changes.

## Milestone 6 — E2E tests

- Create Page Objects.
- Add full lifecycle test.
- Add email completion roundtrip test.
- Add summary email test.
- Add realtime two-tab test.
- Add cleanup utilities.

Acceptance:

- Playwright suite passes locally and in CI.

## Milestone 7 — Hardening

- Ensure all API boundaries use Zod.
- Ensure all tables have RLS policies.
- Run typecheck and lint.
- Add loading/error states.
- Audit accessibility.
- Verify test IDs.

## Suggested commit sequence

1. `chore: initialize next app with strict types and tooling`
2. `feat: configure supabase auth and protected dashboard`
3. `db: add task notifier schema and rls policies`
4. `feat: add task create and complete flows`
5. `feat: simulate immediate task emails with action tokens`
6. `feat: complete tasks from email action links`
7. `feat: add recurring email and fibonacci sms scheduler`
8. `feat: add realtime dashboard subscriptions`
9. `test: add playwright page objects`
10. `test: cover notification lifecycle and email completion`
11. `test: cover realtime two-tab sync`
12. `chore: final hardening and documentation pass`

## Coding-agent checklist per change

Before every commit:

- Run typecheck.
- Run lint.
- Run targeted tests.
- Confirm no secret appears in client code.
- Confirm new route/action inputs have Zod schemas.
- Confirm UI controls have accessible names.
- Confirm E2E selectors are stable.
