# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: task-notification-lifecycle.spec.ts >> add task → immediate email appears → SMS appears after trigger
- Location: tests/e2e/specs/task-notification-lifecycle.spec.ts:6:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('sms-list').getByText('Lifecycle 1778558499346')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByTestId('sms-list').getByText('Lifecycle 1778558499346')

```

```yaml
- alert
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
  - text: e2e+1778558498267-2etah5pfkog@example.test
  - button "Log out"
- region "Tasks":
  - heading "Tasks" [level=2]
  - text: 1 pending Task title
  - textbox "Task title":
    - /placeholder: Add a new task…
  - button "Add"
  - button "Pending"
  - button "Completed"
  - button "Complete task Lifecycle 1778558499346"
  - paragraph: Lifecycle 1778558499346
  - paragraph: just now
  - button "Edit task Lifecycle 1778558499346":
    - img
  - button "Delete task Lifecycle 1778558499346":
    - img
  - paragraph: All pending tasks loaded
- region "Emails":
  - heading "Emails" [level=2]
  - text: "0"
  - paragraph: "Task added: Lifecycle 1778558499346"
  - text: Task added
  - paragraph: May 12, 2026, 1:01 AM
  - text: New Task Added
  - paragraph: Lifecycle 1778558499346
  - paragraph: Created May 12, 2026, 1:01 AM
  - link "Done":
    - /url: /api/email-actions/complete-task-jwt?token=eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIwMzYxYTA3YS02YzM1LTQ1OWQtYmMwMS02NTQzNmI0NmM4YzEiLCJ0YXNrSWQiOiI5MDU1OTFlNi1iNDE4LTRhNjktYmU2Ni0zYWE3ZjgyOTY0ZjkiLCJleHAiOjE3NzkxNjMyOTl9.I95niK78xn4pCJltjDlXbLvbu_W3o7jVAO2LEslBu7o
  - paragraph: All emails loaded
- region "SMS":
  - heading "SMS" [level=2]
  - text: "0"
  - img
  - paragraph: No SMS yet. First one arrives after the Fibonacci interval.
```

# Test source

```ts
  1  | import { type Page, expect } from '@playwright/test';
  2  | 
  3  | export class SmsPanel {
  4  |   constructor(private readonly page: Page) {}
  5  | 
  6  |   async expectSmsContaining(text: string) {
  7  |     await expect(
  8  |       this.page.getByTestId('sms-list').getByText(text, { exact: false }),
> 9  |     ).toBeVisible({ timeout: 10_000 });
     |       ^ Error: expect(locator).toBeVisible() failed
  10 |   }
  11 | 
  12 |   async expectSmsCountAtLeast(count: number) {
  13 |     await expect(
  14 |       this.page.getByTestId('sms-list').locator('[data-testid^="sms-card"]'),
  15 |     ).toHaveCount(count, { timeout: 10_000 });
  16 |   }
  17 | }
  18 | 
```