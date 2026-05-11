# AGENTS.md — Coding Agent Instructions

You are implementing the Task Notifier SPA from the specification files in this repo.

## Read first

Before coding, read these files fully:

1. `docs/01-requirements.md`
2. `docs/02-architecture.md`
3. `docs/03-data-model.md`
4. `docs/04-api-contracts.md`
5. `docs/05-ui-design.md`
6. `docs/06-notification-scheduling-design.md`
7. `docs/09-security-auth-design.md`
8. `testing/playwright-pom-spec.md`
9. `database/schema.sql`

## Non-negotiable requirements

- Use Next.js 15, React 19, TypeScript strict mode, Tailwind, Zod, Supabase, and Playwright.
- The authenticated dashboard is one page with Tasks, Emails, and SMS visible together.
- No real Email/SMS integration. Simulate by writing rows to database tables.
- Validate all API boundaries with Zod.
- Use Server Components for initial data/auth shell and Client Components for interactivity/realtime/timers.
- Enable and respect Supabase RLS.
- Use Playwright Page Object Model.
- Make recurring notifications testable without waiting real minutes.

## Implementation discipline

- Build in small, verifiable steps.
- Keep domain logic separate from UI components.
- Do not expose Supabase secret/service keys to client code.
- Do not trust client-provided user IDs.
- Add stable test IDs from `docs/05-ui-design.md`.
- Use accessible labels and roles.
- Prefer simple code over clever abstractions.

## Validation policy

For every new server action or route handler:

1. Define or reuse a Zod schema.
2. Parse inputs before any domain logic.
3. Return a typed result envelope.
4. Add tests for invalid input if practical.

## Testing policy

Before finishing:

- run typecheck;
- run lint;
- run build;
- run Playwright E2E tests.

## Do not implement

- external email provider;
- external SMS provider;
- routes that switch between Tasks, Emails, and SMS sections;
- non-user-scoped data access;
- unvalidated JSON handling;
- a client-side notification scheduler (cron is used server-side instead).
