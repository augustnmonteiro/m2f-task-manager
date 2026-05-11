# CLAUDE.md — Claude Code Guide

## Mission

Implement the Task Notifier SPA exactly as specified in `docs/` and `testing/`.

## Commands

```bash
npm run dev          # start dev server
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm run lint         # next lint
npm run test:e2e     # playwright test
npm run test:e2e:ui  # playwright test --ui
```

## Environment variables

Required in `.env.local`:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=  # modern replacement for legacy ANON_KEY
SUPABASE_SECRET_KEY=
ACTION_TOKEN_SECRET=         # min 32 chars
NEXT_PUBLIC_NOTIFICATION_TIME_SCALE=1   # use 60 for E2E
E2E_TEST_MODE=false          # set true for E2E runs
```

## Working style

- Start by creating a concise implementation plan from `docs/10-implementation-plan.md`.
- Work milestone by milestone.
- After each milestone, run the relevant checks.
- Prefer editing existing files over large rewrites once implementation begins.
- Keep code readable and boring.

## Key product constraints

- One-page dashboard only.
- Three visible panels: Tasks, Emails, SMS.
- Simulated notifications only (no real Email/SMS provider).
- Recurring notifications are cron-driven, not client-driven.
- Supabase for auth and server persistence.
- Realtime UI updates required.
- Zod at every boundary.
- Playwright POM full lifecycle tests required.

## Files to keep synchronized

If implementation choices differ from the spec, update the corresponding docs:

- database changes → `docs/03-data-model.md` and `database/schema.sql`
- route/action changes → `docs/04-api-contracts.md`
- UI selector changes → `docs/05-ui-design.md` and `testing/playwright-pom-spec.md`
- scheduler changes → `docs/06-notification-scheduling-design.md`

## Preferred order

1. Tooling and env validation.
2. Supabase schema and clients.
3. Auth flow.
4. Task CRUD subset.
5. Immediate email and complete-from-email action.
6. Recurring summary email and Fibonacci SMS.
7. Realtime subscriptions.
8. Playwright POM tests.
9. Hardening.
