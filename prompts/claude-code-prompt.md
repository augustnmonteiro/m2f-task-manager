# Claude Code Prompt

You are building the Task Notifier SPA. Read the following files before editing code:

- `AGENTS.md`
- `CLAUDE.md`
- `docs/01-requirements.md`
- `docs/02-architecture.md`
- `docs/03-data-model.md`
- `database/schema.sql`
- `docs/04-api-contracts.md`
- `docs/05-ui-design.md`
- `docs/06-notification-scheduling-design.md`
- `docs/07-realtime-design.md`
- `testing/playwright-pom-spec.md`

Then implement the app in milestones. Do not skip tests. Keep a checklist of completed requirements from `docs/11-definition-of-done.md`.

Critical constraints:

- Next.js 15, React 19, TypeScript strict mode.
- Supabase Auth + Supabase Postgres + Supabase Realtime.
- Zod validation on every server action, route handler, query string, body, env var, and DB row adapter.
- The main authenticated app is one page with all three sections visible: Tasks, Emails, SMS.
- Email and SMS are simulated rows, not external integrations.
- The scheduler is client-driven but server-authoritative and idempotent.
- Tests use Playwright Page Object Model.

Start with Milestone 0 and Milestone 1 from `docs/10-implementation-plan.md`.
