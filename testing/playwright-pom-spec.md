# Playwright Page Object Model Specification

## Folder structure

```text
tests/e2e/
  pages/
    auth-page.ts
    dashboard-page.ts
    task-panel.ts
    email-panel.ts
    sms-panel.ts
  specs/
    task-notification-lifecycle.spec.ts
    email-complete-roundtrip.spec.ts
    summary-email.spec.ts
    realtime-two-tab.spec.ts
  fixtures/
    test-users.ts
    cleanup.ts
```

## Page objects

### `AuthPage`

Responsibilities:

- navigate to app;
- sign up or log in;
- assert auth errors;
- assert dashboard is visible after auth.

Suggested API:

```ts
export class AuthPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void>;
  async signUp(email: string, password: string): Promise<void>;
  async login(email: string, password: string): Promise<void>;
  async expectAuthFormVisible(): Promise<void>;
}
```

### `DashboardPage`

Responsibilities:

- high-level composition of panels;
- navigation to dashboard;
- clock setup guidance;
- logout;
- assertions that all three sections are visible.

Suggested API:

```ts
export class DashboardPage {
  readonly tasks: TaskPanel;
  readonly emails: EmailPanel;
  readonly sms: SmsPanel;

  constructor(private readonly page: Page) {
    this.tasks = new TaskPanel(page);
    this.emails = new EmailPanel(page);
    this.sms = new SmsPanel(page);
  }

  async goto(): Promise<void>;
  async expectVisible(): Promise<void>;
  async logout(): Promise<void>;
}
```

### `TaskPanel`

Suggested API:

```ts
export class TaskPanel {
  constructor(private readonly page: Page) {}

  async addTask(title: string): Promise<void>;
  async completeTaskByTitle(title: string): Promise<void>;
  async expectPendingTask(title: string): Promise<void>;
  async expectNoPendingTask(title: string): Promise<void>;
  async expectCompletedTask(title: string): Promise<void>;
}
```

Implementation notes:

- Prefer `getByRole` for buttons and inputs.
- Use `data-testid` for row-level assertions when needed.
- For title-based row lookup, scope locators to `pending-task-list` and `completed-task-list`.

### `EmailPanel`

Suggested API:

```ts
export class EmailPanel {
  constructor(private readonly page: Page) {}

  async expectImmediateTaskEmail(title: string): Promise<void>;
  async expectSummaryEmailContaining(title: string): Promise<void>;
  async completeTaskFromEmail(title: string): Promise<void>;
}
```

Implementation notes:

- Immediate email subject must contain `Task added: {title}`.
- Complete action accessible name should include title.

### `SmsPanel`

Suggested API:

```ts
export class SmsPanel {
  constructor(private readonly page: Page) {}

  async expectSmsContaining(text: string): Promise<void>;
  async expectSmsCountAtLeast(count: number): Promise<void>;
}
```

## Required spec: full lifecycle

File: `tests/e2e/specs/task-notification-lifecycle.spec.ts`

Test intent:

```text
add task → confirm email appears → confirm SMS fires on schedule
```

Pseudo-test:

```ts
test('full lifecycle: add task, receive email, receive scheduled SMS', async ({ page }) => {
  await page.clock.install();

  const auth = new AuthPage(page);
  await auth.goto();
  await auth.signUp(uniqueEmail(), testPassword);

  const dashboard = new DashboardPage(page);
  await dashboard.expectVisible();

  const title = `Lifecycle task ${Date.now()}`;
  await dashboard.tasks.addTask(title);

  await dashboard.tasks.expectPendingTask(title);
  await dashboard.emails.expectImmediateTaskEmail(title);

  await page.clock.runFor('01:00');
  await dashboard.sms.expectSmsContaining(title);
});
```

## Required spec: complete task from email

File: `tests/e2e/specs/email-complete-roundtrip.spec.ts`

Test intent:

```text
notification email action marks corresponding task complete
```

Pseudo-test:

```ts
test('complete task from immediate email action', async ({ page }) => {
  await page.clock.install();

  const auth = new AuthPage(page);
  await auth.goto();
  await auth.signUp(uniqueEmail(), testPassword);

  const dashboard = new DashboardPage(page);
  const title = `Email completion ${Date.now()}`;

  await dashboard.tasks.addTask(title);
  await dashboard.emails.expectImmediateTaskEmail(title);

  await dashboard.emails.completeTaskFromEmail(title);

  await dashboard.tasks.expectNoPendingTask(title);
  await dashboard.tasks.expectCompletedTask(title);
});
```

## Required spec: summary email

File: `tests/e2e/specs/summary-email.spec.ts`

Pseudo-test:

```ts
test('recurring email summary includes pending task and action', async ({ page }) => {
  await page.clock.install();

  const auth = new AuthPage(page);
  await auth.goto();
  await auth.signUp(uniqueEmail(), testPassword);

  const dashboard = new DashboardPage(page);
  const title = `Summary task ${Date.now()}`;

  await dashboard.tasks.addTask(title);
  await page.clock.runFor('01:00');

  await dashboard.emails.expectSummaryEmailContaining(title);
  await dashboard.emails.completeTaskFromEmail(title);
  await dashboard.tasks.expectCompletedTask(title);
});
```

## Required spec: realtime two-tab

File: `tests/e2e/specs/realtime-two-tab.spec.ts`

Pseudo-test:

```ts
test('two tabs stay synchronized through realtime', async ({ browser }) => {
  const context = await browser.newContext();
  const pageA = await context.newPage();
  const pageB = await context.newPage();

  const authA = new AuthPage(pageA);
  await authA.goto();
  await authA.signUp(uniqueEmail(), testPassword);

  const dashboardA = new DashboardPage(pageA);
  await dashboardA.expectVisible();

  await pageB.goto('/');
  const dashboardB = new DashboardPage(pageB);
  await dashboardB.expectVisible();

  const title = `Realtime task ${Date.now()}`;
  await dashboardA.tasks.addTask(title);
  await dashboardB.tasks.expectPendingTask(title);

  await dashboardB.tasks.completeTaskByTitle(title);
  await dashboardA.tasks.expectCompletedTask(title);
});
```

## Locator requirements

The implementation must satisfy the test IDs defined in `docs/05-ui-design.md`.

## Cleanup expectations

The test suite should provide cleanup utilities that delete rows in this order:

1. `notification_actions`
2. `notification_runs`
3. `emails`
4. `sms_messages`
5. `scheduler_state`
6. `tasks`
7. `profiles`
8. auth user, if using service-role/admin cleanup
