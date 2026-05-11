# 01 — Requirements

## Required stack

- Next.js 15 using the App Router.
- React 19.
- TypeScript with `strict: true`.
- Tailwind CSS.
- Zod for runtime validation on all API boundaries.
- Supabase Auth for user management.
- Supabase Postgres for persistence.
- Supabase Realtime for real-time UI updates.
- Playwright for full integration/E2E tests.
- Playwright tests must use Page Object Model.

## Page-level requirement

The authenticated application is a single page divided into three simultaneously visible sections:

1. Tasks
2. Emails
3. SMS

There must be no product navigation between these three sections. On desktop, prefer a three-column layout. On smaller screens, panels may stack vertically, but all remain on the same page.

## Authentication requirements

### AUTH-1 — Sign up

Users can create an account using email and password.

Acceptance criteria:

- Signup input is validated.
- On success, a `profiles` row is created or upserted for the user.
- The user lands on the dashboard after authentication, unless Supabase email confirmation is enabled in the environment. In confirmation-enabled environments, show clear confirmation instructions.

### AUTH-2 — Login

Users can log in with email and password.

Acceptance criteria:

- Invalid credentials show an inline error.
- Authenticated users can access the dashboard.
- Unauthenticated users cannot access user data.

### AUTH-3 — Logout

Users can log out.

Acceptance criteria:

- Session cookies are cleared.
- The user is returned to the auth screen.

## Task requirements

### TASK-1 — Add task

A text input and Add Task button append a new task to the pending list.

Acceptance criteria:

- Empty or whitespace-only titles are rejected.
- Titles are trimmed.
- Maximum title length: 160 characters.
- On success, a new pending task appears without full page reload.
- The task row shows title, age, and Complete button.
- Adding a task creates an immediate email notification.

### TASK-2 — Pending task list

Pending tasks are shown in newest-first order.

Each row shows:

- task title;
- relative age, such as `just now`, `1 min ago`, `2 hours ago`;
- Complete button.

Acceptance criteria:

- The list updates in real time if the same user has the app open in another tab.
- The relative age refreshes at least once per minute.
- The Complete button is disabled while the completion request is in flight.

### TASK-3 — Complete task from task list

Clicking Complete moves a task from pending to completed and records a completion timestamp.

Acceptance criteria:

- Completed task disappears from pending list.
- Completed task appears in completed list.
- Completion timestamp is visible and formatted.
- Completion is idempotent: completing an already completed task should not create duplicate completed records or errors in the UI.

### TASK-4 — Completed task list

Completed tasks are shown in newest-completed-first order.

Each row shows:

- task title;
- completion timestamp.

Acceptance criteria:

- Completed list updates in real time.
- Completion timestamp uses the user's locale.

## Email requirements

### EMAIL-1 — Email inbox panel

The Emails section lists simulated received emails newest first.

Each email shows:

- subject;
- body;
- formatted timestamp;
- action button/link when the email references completable pending tasks.

Acceptance criteria:

- Emails are persisted in Supabase.
- Emails are user-scoped.
- Initial load fetches the latest 20 emails.
- Scrolling to the bottom of the panel loads the next 20 (cursor-based, not offset).
- A "no more emails" state is shown when all pages are exhausted.
- New emails arriving via Realtime are prepended to the list without duplicating items already loaded.
- New emails do not shift the pagination cursor for older items.

### EMAIL-2 — Immediate task email

An immediate notification email is triggered when a task is added.

Acceptance criteria:

- Subject format: `Task added: {task title}`.
- Body includes the task title and created timestamp.
- Email includes an action button/link to complete the task.
- Clicking the email action completes the corresponding task.

### EMAIL-3 — Recurring summary email

A recurring summary email fires on the interval configured by the user. The default is every 1 minute; the user can change it to 15 minutes, 1 hour, daily, or weekly.

Acceptance criteria:

- Subject format: `Pending tasks summary`.
- Body includes a list of current pending tasks or `No pending tasks.`.
- For every pending task in the summary, the email includes a completion action link.
- Duplicate summary emails must not be created for the same user and schedule bucket.

### EMAIL-4 — Complete task from email

Each notification email that references a task contains an action button/link that marks the corresponding task complete.

Acceptance criteria:

- Clicking the action validates the action token.
- If token is valid and task belongs to the current user, task is completed.
- The email action is one-time use.
- After completion, the dashboard shows the task under Completed.
- If the task is already completed, the action returns a success state without duplicating side effects.

## Settings requirements

### SETTINGS-1 — Email summary interval

Users can configure how often they receive recurring summary emails.

Acceptance criteria:

- A selector in the dashboard header shows the current interval.
- Options: Every minute (default), Every 15 minutes, Every hour, Daily, Weekly.
- Changing the value persists immediately via `updateEmailSummaryInterval`.
- The cron job respects the saved interval when deciding whether a summary is due.
- The setting is user-scoped and stored in `profiles.email_summary_interval`.

## SMS requirements

### SMS-1 — SMS inbox panel

The SMS section lists simulated received SMS messages newest first.

Each SMS shows:

- body;
- formatted timestamp.

Acceptance criteria:

- SMS messages are persisted in Supabase.
- SMS messages are user-scoped.
- Initial load fetches the latest 20 SMS messages.
- Scrolling to the bottom of the panel loads the next 20 (cursor-based).
- A "no more messages" state is shown when all pages are exhausted.
- New SMS messages arriving via Realtime are prepended without duplicating existing items.

### SMS-2 — Fibonacci recurring SMS

A recurring SMS is sent with the current list of pending tasks. The interval between messages follows the Fibonacci sequence in minutes.

Acceptance criteria:

- Interval sequence: 1, 1, 2, 3, 5, 8, 13, ... minutes.
- First SMS is scheduled 1 minute after scheduler activation.
- The SMS body includes current pending tasks or `No pending tasks.`.
- Each successful SMS increments the user's Fibonacci scheduler index.
- Duplicate SMS messages must not be created for the same user and schedule bucket.

## Realtime requirements

### REALTIME-1 — Live data updates

The app must reflect task, email, and SMS changes without page reload.

Acceptance criteria:

- A user opening two tabs sees changes from one tab appear in the other.
- Subscriptions are cleaned up on unmount.
- Realtime events are still backed by a fetch/revalidation fallback on reconnect.

## Validation requirements

### VALIDATION-1 — Zod boundaries

All external input and output crossing application boundaries must be validated.

Boundaries include:

- form submissions before server mutation;
- Server Action arguments;
- route handler JSON bodies;
- route handler query strings;
- route handler params;
- database row-to-domain mapping before rendering;
- environment variables at startup;
- E2E-only test control endpoints, if implemented.

Acceptance criteria:

- Invalid inputs return structured errors.
- UI shows useful validation messages.
- Domain logic never receives unvalidated arbitrary JSON.

## Non-functional requirements

### NFR-1 — Type safety

- No `any` except where unavoidable and documented.
- TypeScript strict mode enabled.
- Prefer generated Supabase database types.

### NFR-2 — Accessibility

- All form controls have accessible names.
- Buttons and links are keyboard accessible.
- Use semantic section headings.
- Important status changes use polite live regions.

### NFR-3 — Performance

- Initial dashboard fetch should use Server Components.
- Client Components should be limited to interactive panels and realtime/scheduler behavior.
- Avoid polling for primary data; use Realtime plus targeted fallback refresh.

### NFR-4 — Testability

- Stable `data-testid` attributes are required for critical controls and rows.
- Scheduler intervals must be test-controllable via a time-scale environment variable and/or Playwright clock.
- E2E tests must not depend on waiting real minutes.

### NFR-5 — Security

- RLS enabled on all public user-owned tables.
- Users can access only their own rows.
- Email action tokens are hashed at rest and expire.
- Server code must use `getClaims()` or equivalent trusted Supabase server validation for protected routes.
