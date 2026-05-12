# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: realtime-two-tab.spec.ts >> two tabs stay synchronized through realtime
- Location: tests/e2e/specs/realtime-two-tab.spec.ts:6:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('pending-task-list').getByText('Realtime 1778558499988')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByTestId('pending-task-list').getByText('Realtime 1778558499988')

```

```yaml
- banner:
  - img
  - heading "Task Notifier" [level=1]
  - img
  - text: Summary
  - combobox "Summary":
    - option "Every minute" [selected]
    - option "Every 15 min"
    - option "Every hour"
    - option "Daily"
    - option "Weekly"
  - button "Run notifications"
  - text: e2e+1778558497909-qsrwlpgefc@example.test
  - button "Log out"
- region "Tasks":
  - heading "Tasks" [level=2]
  - text: 0 pending Task title
  - textbox "Task title":
    - /placeholder: Add a new task…
  - button "Add"
  - button "Pending"
  - button "Completed"
  - paragraph: No pending tasks. Add one above.
- region "Emails":
  - heading "Emails" [level=2]
  - text: "0"
  - img
  - paragraph: No emails yet. Add a task to receive one.
- region "SMS":
  - heading "SMS" [level=2]
  - text: "0"
  - img
  - paragraph: No SMS yet. First one arrives after the Fibonacci interval.
- alert
```

# Test source

```ts
  1  | import { type Page, expect } from '@playwright/test';
  2  | 
  3  | export class TaskPanel {
  4  |   constructor(private readonly page: Page) {}
  5  | 
  6  |   async addTask(title: string) {
  7  |     await this.page.getByTestId('task-title-input').fill(title);
  8  |     await this.page.getByTestId('add-task-button').click();
  9  |     await expect(this.page.getByTestId('add-task-button')).not.toBeDisabled();
  10 |   }
  11 | 
  12 |   async expectPendingTask(title: string) {
  13 |     await expect(
  14 |       this.page.getByTestId('pending-task-list').getByText(title),
> 15 |     ).toBeVisible();
     |       ^ Error: expect(locator).toBeVisible() failed
  16 |   }
  17 | 
  18 |   async expectNoPendingTask(title: string) {
  19 |     await expect(
  20 |       this.page.getByTestId('pending-task-list').getByText(title),
  21 |     ).not.toBeVisible();
  22 |   }
  23 | 
  24 |   async expectCompletedTask(title: string) {
  25 |     await expect(
  26 |       this.page.getByTestId('completed-task-list').getByText(title),
  27 |     ).toBeVisible();
  28 |   }
  29 | 
  30 |   async completeTaskByTitle(title: string) {
  31 |     const row = this.page
  32 |       .getByTestId('pending-task-list')
  33 |       .locator('[data-testid^="pending-task-row"]')
  34 |       .filter({ hasText: title });
  35 |     await row.getByRole('button', { name: /complete/i }).click();
  36 |   }
  37 | }
  38 | 
```