# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: email-complete-roundtrip.spec.ts >> complete task from immediate email action
- Location: tests/e2e/specs/email-complete-roundtrip.spec.ts:6:5

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByTestId('email-list').locator('[aria-label*="Email completion 1778558498528"]').first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - img [ref=e8]
  - alert [ref=e11]
  - generic [ref=e12]:
    - banner [ref=e13]:
      - generic [ref=e14]:
        - img [ref=e16]
        - heading "Task Notifier" [level=1] [ref=e18]
      - generic [ref=e19]:
        - generic [ref=e20]:
          - img [ref=e21]
          - generic [ref=e23]: Summary
          - combobox "Summary" [ref=e24]:
            - option "Every minute" [selected]
            - option "Every 15 min"
            - option "Every hour"
            - option "Daily"
            - option "Weekly"
        - button "Run notifications" [ref=e25]
        - generic [ref=e26]: e2e+1778558498267-gcpxblz6ajd@example.test
        - button "Log out" [ref=e28]
    - generic [ref=e29]:
      - region "Tasks" [ref=e31]:
        - generic [ref=e32]:
          - heading "Tasks" [level=2] [ref=e33]
          - generic [ref=e34]: 1 pending
        - generic [ref=e35]:
          - generic [ref=e36]: Task title
          - textbox "Task title" [ref=e37]:
            - /placeholder: Add a new task…
          - button "Add" [ref=e38]
        - generic [ref=e39]:
          - button "Pending" [ref=e40]
          - button "Completed" [ref=e41]
        - generic [ref=e42]:
          - generic [ref=e44]:
            - button "Complete task Email completion 1778558498528" [ref=e45]
            - generic [ref=e46]:
              - paragraph [ref=e47]: Email completion 1778558498528
              - paragraph [ref=e48]: just now
            - generic [ref=e49]:
              - button "Edit task Email completion 1778558498528" [ref=e50]:
                - img [ref=e51]
              - button "Delete task Email completion 1778558498528" [ref=e53]:
                - img [ref=e54]
          - paragraph [ref=e57]: All pending tasks loaded
      - region "Emails" [ref=e59]:
        - generic [ref=e60]:
          - heading "Emails" [level=2] [ref=e61]
          - generic [ref=e62]: "0"
        - generic [ref=e63]:
          - generic [ref=e64]:
            - generic [ref=e65]:
              - paragraph [ref=e66]: "Task added: Email completion 1778558498528"
              - generic [ref=e67]: Task added
            - paragraph [ref=e68]: May 12, 2026, 1:01 AM
            - generic [ref=e70]:
              - generic [ref=e71]: New Task Added
              - generic [ref=e72]:
                - paragraph [ref=e73]: Email completion 1778558498528
                - paragraph [ref=e74]: Created May 12, 2026, 1:01 AM
                - link "Done" [ref=e75] [cursor=pointer]:
                  - /url: /api/email-actions/complete-task-jwt?token=eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiIzZGJhMDlhOC1lNDk2LTQ2YzUtYTFjNi0wMzg1OGQzOTc1Y2UiLCJ0YXNrSWQiOiI4ODdmMWY5Ny1lYmQ4LTQ3YTYtYjAxZi1lZmI4MmI4ZmNiZTIiLCJleHAiOjE3NzkxNjMyOTl9.jj2hDlSiKGyVpUpUQFbNl_hW2kPUf2k5ed110ROEbe0
          - paragraph [ref=e77]: All emails loaded
      - region "SMS" [ref=e79]:
        - generic [ref=e80]:
          - heading "SMS" [level=2] [ref=e81]
          - generic [ref=e82]: "0"
        - generic [ref=e84]:
          - img [ref=e85]
          - paragraph [ref=e87]: No SMS yet. First one arrives after the Fibonacci interval.
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
  16 |     ).toBeVisible({ timeout: 10_000 });
  17 |   }
  18 | 
  19 |   async completeTaskFromEmail(title: string) {
  20 |     const actionLink = this.page
  21 |       .getByTestId('email-list')
  22 |       .locator(`[aria-label*="${title}"]`)
  23 |       .first();
> 24 |     await actionLink.click();
     |                      ^ Error: locator.click: Test timeout of 30000ms exceeded.
  25 |     await this.page.waitForURL(/emailAction=completed/);
  26 |   }
  27 | }
  28 | 
```