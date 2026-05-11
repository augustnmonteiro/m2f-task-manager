# 08 — Testing Strategy

## Test layers

### Unit tests

Use Vitest or the test runner preferred by the implementation team.

Target pure functions:

- Fibonacci interval generation.
- Notification body formatting.
- Relative age formatting.
- Zod schemas and invalid inputs.
- DTO mappers.
- Token hashing utility.

### Integration tests

Target domain services with Supabase local or a dedicated test project:

- create task creates immediate email and action.
- complete task is idempotent.
- email action token completes task and marks action used.
- email summary generation creates one email per bucket.
- SMS generation increments Fibonacci index.
- RLS prevents cross-user access.

### E2E tests

Use Playwright with Page Object Model.

Required E2E scenarios:

1. Full lifecycle: add task → confirm immediate email appears → confirm SMS fires on schedule.
2. Complete task from email: click email action → task appears completed.
3. Recurring summary email: after schedule interval → summary email appears with pending tasks.
4. Realtime two-tab sync: add/complete in one tab → other tab updates.

## E2E environment

Recommended environment variables:

```text
E2E_TEST_MODE=true
NEXT_PUBLIC_NOTIFICATION_TIME_SCALE=60
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
ACTION_TOKEN_SECRET=local-test-secret-with-at-least-32-chars
```

## Test data strategy

Each test should use a unique email address:

```text
e2e+{timestamp}-{random}@example.test
```

Before each test:

1. Create/login user through UI or test helper.
2. Ensure user's domain tables are empty.
3. Navigate to dashboard with clock installed if using Playwright clock.

After each test:

1. Delete user-owned domain rows.
2. Optionally delete test auth user with service key.

## Playwright configuration expectations

- Use web server command to run Next.js in test mode.
- Set retries in CI if desired, but tests should be deterministic.
- Use trace on first retry.
- Prefer locators by role and stable `data-testid`.

## Required assertions

### Full lifecycle

- Task appears in pending list.
- Immediate email appears with subject containing task title.
- First SMS appears after the first Fibonacci interval.
- SMS body includes task title.

### Complete from email

- Immediate email action is visible.
- Clicking action redirects back to dashboard or updates dashboard state.
- Task is no longer in pending list.
- Task is visible in completed list.

### Summary email

- After one scheduled minute, a summary email appears.
- Summary body includes pending tasks.
- Summary includes completion actions for pending tasks.

### Realtime

- A task created in one page context appears in the second context.
- Completion in one context is reflected in the other.

## Avoiding flaky timer tests

Preferred:

- Install Playwright clock before page navigation.
- Use `NEXT_PUBLIC_NOTIFICATION_TIME_SCALE=60`.
- Advance/run timers deterministically.
- Assert with Playwright's auto-waiting expectations.

Fallback:

- Wait up to a short timeout for the scaled one-second interval.
- Do not wait real minutes.
