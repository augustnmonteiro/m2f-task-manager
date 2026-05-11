# Codex Prompt

Implement this repository according to the included specification pack.

First read:

1. `AGENTS.md`
2. `docs/01-requirements.md`
3. `docs/02-architecture.md`
4. `docs/04-api-contracts.md`
5. `docs/05-ui-design.md`
6. `docs/06-notification-scheduling-design.md`
7. `testing/playwright-pom-spec.md`
8. `database/schema.sql`

Task:

Build a Next.js 15 + React 19 + TypeScript strict + Tailwind app using Supabase Auth/Postgres/Realtime. The dashboard must be a single page with Tasks, Emails, and SMS visible at the same time. Implement simulated notifications only: immediate task email, recurring one-minute summary email, and Fibonacci-interval SMS. Use Zod at all API boundaries. Add Playwright E2E tests with Page Object Model for the full lifecycle and complete-from-email roundtrip.

Implementation rules:

- Never expose server secrets to client code.
- Never trust client-provided user IDs.
- All user data must be scoped by Supabase auth and RLS.
- Use stable test IDs from `docs/05-ui-design.md`.
- Make timer tests deterministic with `NEXT_PUBLIC_NOTIFICATION_TIME_SCALE` and/or Playwright clock.
- Run typecheck, lint, build, and E2E tests before declaring done.
