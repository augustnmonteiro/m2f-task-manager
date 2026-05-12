# HTML Email Templates Design

**Date:** 2026-05-11  
**Status:** Approved

## Context

Email bodies are currently generated inline in two unrelated files using Tailwind CSS class names. Tailwind classes embedded in HTML strings are unreliable outside the app's Tailwind context, and the duplication makes styling inconsistent. The goal is a single shared template utility that produces self-contained inline-CSS HTML for both email types, styled as a polished branded card.

## Architecture

**New file:** `lib/email/template.ts`  
Exports `buildEmailHtml(input: EmailInput): string` where `EmailInput` is a discriminated union:

```ts
type EmailInput =
  | { type: 'task'; title: string; createdAt: string; actionUrl: string }
  | { type: 'digest'; tasks: Array<{ title: string; actionUrl: string }> }
```

Both callers replace their inline HTML strings with a call to `buildEmailHtml`.

## Visual Design

**Shared card shell** (both types):
- White background, 1px `#e2e8f0` border, 8px border-radius, max-width 480px, sans-serif font
- Emerald header bar (`#059669`) with white label text

**Immediate task email** (`type: 'task'`):
- Header: "New Task Added"
- Body: task title (bold, dark), created-at (small, muted `#94a3b8`)
- Footer: "Mark complete" pill button (emerald `#059669`, white text)

**Summary digest** (`type: 'digest'`):
- Header: "Pending Tasks Summary"
- Body: `<ul>` with one `<li>` per task — bold task title + "Mark complete" link; hairline separator between rows
- Empty state: single muted line "No pending tasks."

## Files Changed

| File | Change |
|------|--------|
| `lib/email/template.ts` | New — single source of truth for email HTML |
| `server-actions/tasks.ts` | Replace inline HTML body with `buildEmailHtml(...)` |
| `app/api/notifications/email-summary/run/route.ts` | Replace inline HTML body with `buildEmailHtml(...)` |

## Verification

1. Create a task → check the Emails panel shows a styled card with the task title and "Mark complete" button
2. Trigger `POST /api/notifications/email-summary/run` → check the Emails panel shows a styled digest list
3. Trigger digest with no pending tasks → check "No pending tasks." empty state renders
4. Run `npm run typecheck` — no errors
