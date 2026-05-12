# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: summary-email.spec.ts >> summary email contains pending task and completion action
- Location: tests/e2e/specs/summary-email.spec.ts:6:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('email-list').getByText('Pending tasks summary')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByTestId('email-list').getByText('Pending tasks summary')

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
  - text: e2e+1778558498267-c3y90xp88d@example.test
  - button "Log out"
- region "Tasks":
  - heading "Tasks" [level=2]
  - text: 1 pending Task title
  - textbox "Task title":
    - /placeholder: Add a new task…
  - button "Add"
  - button "Pending"
  - button "Completed"
  - button "Complete task Summary task 1778558498528"
  - paragraph: Summary task 1778558498528
  - paragraph: just now
  - button "Edit task Summary task 1778558498528":
    - img
  - button "Delete task Summary task 1778558498528":
    - img
  - paragraph: All pending tasks loaded
- region "Emails":
  - heading "Emails" [level=2]
  - text: "0"
  - paragraph: "Task added: Summary task 1778558498528"
  - text: Task added
  - paragraph: May 12, 2026, 1:01 AM
  - text: New Task Added
  - paragraph: Summary task 1778558498528
  - paragraph: Created May 12, 2026, 1:01 AM
  - link "Done":
    - /url: /api/email-actions/complete-task-jwt?token=eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJkMWRkMWE1Ni02NzU4LTQ4OTUtODc4NS0yYzQyYmFhOTdhMDAiLCJ0YXNrSWQiOiI3ODZhMmYwMy04YWQ3LTQ5MmItYTI1Yy0zNjQyMGVlMDMyNWMiLCJleHAiOjE3NzkxNjMyOTl9.1tfDoubyekyk7nOTK9Wb9yf8wURZUDGNBrh_O788ggM
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
  3  | export class EmailPanel {
  4  |   constructor(private readonly page: Page) {}
  5  | 
  6  |   async expectImmediateTaskEmail(title: string) {
  7  |     await expect(
  8  |       this.page.getByTestId('email-list').getByText(`Task added: ${title}`),
  9  |     ).toBeVisible({ timeout: 10_000 });
  10 |   }
  11 | 
  12 |   // eslint-disable-next-line @typescript-eslint/no-unused-vars
  13 |   async expectSummaryEmailContaining(_title: string) {
  14 |     await expect(
  15 |       this.page.getByTestId('email-list').getByText('Pending tasks summary'),
> 16 |     ).toBeVisible({ timeout: 10_000 });
     |       ^ Error: expect(locator).toBeVisible() failed
  17 |   }
  18 | 
  19 |   async completeTaskFromEmail(title: string) {
  20 |     const actionLink = this.page
  21 |       .getByTestId('email-list')
  22 |       .locator(`[aria-label*="${title}"]`)
  23 |       .first();
  24 |     await actionLink.click();
  25 |     await this.page.waitForURL(/emailAction=completed/);
  26 |   }
  27 | }
  28 | 
```