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
  - waiting for getByRole('button', { name: /sign up/i })

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - img [ref=e6]
      - heading "Task Notifier" [level=1] [ref=e8]
      - paragraph [ref=e9]: Create your account
    - generic [ref=e11]:
      - generic [ref=e12]:
        - generic [ref=e13]: Email
        - textbox "Email" [ref=e14]:
          - /placeholder: you@example.com
          - text: e2e+1778550271173-btw5uramgbe@example.test
      - generic [ref=e15]:
        - generic [ref=e16]: Password
        - textbox "Password" [active] [ref=e17]:
          - /placeholder: ••••••••
          - text: TestPassword123!
      - button "Create account" [ref=e18]
    - paragraph [ref=e19]:
      - text: Already have an account?
      - button "Log in" [ref=e20]
  - button "Open Next.js Dev Tools" [ref=e26] [cursor=pointer]:
    - img [ref=e27]
  - alert [ref=e30]
```

# Test source

```ts
  1  | import { type Page, expect } from '@playwright/test';
  2  | 
  3  | export class AuthPage {
  4  |   constructor(private readonly page: Page) {}
  5  | 
  6  |   async goto() {
  7  |     await this.page.goto('/');
  8  |   }
  9  | 
  10 |   async signUp(email: string, password: string) {
  11 |     await this.page.getByRole('button', { name: /sign up/i }).click();
  12 |     await this.page.getByLabel('Email').fill(email);
  13 |     await this.page.getByLabel('Password').fill(password);
> 14 |     await this.page.getByRole('button', { name: /sign up/i }).click();
     |                                                               ^ Error: locator.click: Test timeout of 30000ms exceeded.
  15 |   }
  16 | 
  17 |   async login(email: string, password: string) {
  18 |     await this.page.getByLabel('Email').fill(email);
  19 |     await this.page.getByLabel('Password').fill(password);
  20 |     await this.page.getByRole('button', { name: /log in/i }).click();
  21 |   }
  22 | 
  23 |   async expectAuthFormVisible() {
  24 |     await expect(this.page.getByRole('heading', { name: /task notifier/i })).toBeVisible();
  25 |   }
  26 | }
  27 | 
```