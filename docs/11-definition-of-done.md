# 11 — Definition of Done

## Functional checklist

- [ ] Authenticated user can sign up.
- [ ] Authenticated user can log in.
- [ ] Authenticated user can log out.
- [ ] Dashboard is one page with Tasks, Emails, and SMS visible simultaneously.
- [ ] User can add task.
- [ ] Empty task title is rejected.
- [ ] Pending task row shows title, age, and Complete button.
- [ ] User can complete task from task list.
- [ ] Completed task row shows title and completion timestamp.
- [ ] Adding task creates immediate email.
- [ ] Emails are newest first.
- [ ] Immediate email contains complete task action.
- [ ] Completing from email action marks task complete.
- [ ] Recurring email summary fires every simulated minute.
- [ ] Summary email contains pending tasks or empty-state message.
- [ ] Summary email includes task completion action links.
- [ ] Recurring SMS follows Fibonacci minute intervals.
- [ ] SMS contains pending tasks or empty-state message.
- [ ] SMS messages are newest first.
- [ ] Realtime updates work across two tabs for same user.

## Technical checklist

- [ ] Next.js 15 App Router.
- [ ] React 19.
- [ ] TypeScript strict mode.
- [ ] Tailwind styling.
- [ ] Zod validation at all API boundaries.
- [ ] Supabase Auth configured for SSR.
- [ ] Supabase Postgres schema applied.
- [ ] RLS enabled on all user-owned tables.
- [ ] Supabase Realtime configured for required tables.
- [ ] No external Email/SMS provider integration.
- [ ] Notification messages are simulated as database rows.
- [ ] Action tokens are hashed at rest.
- [ ] Scheduled notification endpoints are idempotent.

## Testing checklist

- [ ] Unit tests for Fibonacci intervals.
- [ ] Unit tests for notification body formatting.
- [ ] Unit tests for Zod validation failures.
- [ ] Integration test for create task + immediate email.
- [ ] Integration test for email action completion.
- [ ] Integration test for scheduled email idempotency.
- [ ] Integration test for SMS Fibonacci advancement.
- [ ] Playwright POM classes implemented.
- [ ] E2E: add task → immediate email → scheduled SMS.
- [ ] E2E: complete task from email.
- [ ] E2E: recurring summary email.
- [ ] E2E: realtime two-tab sync.

## Quality checklist

- [ ] `npm run typecheck` passes.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] `npm run test:e2e` passes.
- [ ] No browser console errors during E2E happy paths.
- [ ] Keyboard navigation works for all controls.
- [ ] User-facing errors are clear.
- [ ] Secrets are not logged or exposed to client.
