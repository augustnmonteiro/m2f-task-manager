# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: realtime-two-tab.spec.ts >> two tabs stay synchronized through realtime
- Location: tests/e2e/specs/realtime-two-tab.spec.ts:6:5

# Error details

```
Test timeout of 30000ms exceeded.
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
          - text: e2e+1778550270830-1t3sf0v6x35@example.test
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