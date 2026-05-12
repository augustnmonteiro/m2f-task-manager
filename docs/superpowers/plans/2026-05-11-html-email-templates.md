# HTML Email Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace inline Tailwind-classed email HTML strings with a shared `buildEmailHtml()` utility that produces self-contained inline-CSS styled cards for both immediate task emails and summary digest emails.

**Architecture:** Create `lib/email/template.ts` exporting a single `buildEmailHtml(input: EmailInput): string` function. The body HTML contains only content (title, timestamp, task list) — action buttons are rendered separately by the `EmailPanel` UI component from `email.actions`, so no action URLs belong in the body. Both `server-actions/tasks.ts` and `app/api/notifications/email-summary/run/route.ts` swap their inline HTML strings for calls to `buildEmailHtml`.

**Tech Stack:** TypeScript, Vitest (unit tests at `tests/unit/**/*.test.ts`, run with `npx vitest run`)

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `lib/email/template.ts` | `buildEmailHtml()` — single source of truth for email HTML |
| Create | `tests/unit/email-template.test.ts` | Unit tests for `buildEmailHtml()` |
| Modify | `server-actions/tasks.ts` | Use `buildEmailHtml()` for immediate task email body |
| Modify | `app/api/notifications/email-summary/run/route.ts` | Use `buildEmailHtml()` for digest email body |

---

### Task 1: Create `lib/email/template.ts` with type definitions and stub

**Files:**
- Create: `lib/email/template.ts`

- [ ] **Step 1: Create the file with types and a stub implementation**

```typescript
export type TaskEmailInput = {
  type: 'task';
  title: string;
  createdAt: string;
};

export type DigestEmailInput = {
  type: 'digest';
  tasks: Array<{ title: string }>;
};

export type EmailInput = TaskEmailInput | DigestEmailInput;

export function buildEmailHtml(input: EmailInput): string {
  throw new Error('not implemented');
}
```

---

### Task 2: Write failing unit tests for `buildEmailHtml()`

**Files:**
- Create: `tests/unit/email-template.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
import { describe, it, expect } from 'vitest';
import { buildEmailHtml } from '@/lib/email/template';

describe('buildEmailHtml', () => {
  describe('task email', () => {
    it('contains the task title', () => {
      const html = buildEmailHtml({
        type: 'task',
        title: 'Buy groceries',
        createdAt: 'Jan 1, 2026, 12:00 PM',
      });
      expect(html).toContain('Buy groceries');
    });

    it('contains the createdAt string', () => {
      const html = buildEmailHtml({
        type: 'task',
        title: 'Buy groceries',
        createdAt: 'Jan 1, 2026, 12:00 PM',
      });
      expect(html).toContain('Jan 1, 2026, 12:00 PM');
    });

    it('contains the emerald header colour', () => {
      const html = buildEmailHtml({
        type: 'task',
        title: 'Buy groceries',
        createdAt: 'Jan 1, 2026, 12:00 PM',
      });
      expect(html).toContain('#059669');
    });

    it('does not contain Tailwind class names', () => {
      const html = buildEmailHtml({
        type: 'task',
        title: 'Buy groceries',
        createdAt: 'Jan 1, 2026, 12:00 PM',
      });
      expect(html).not.toContain('class=');
    });
  });

  describe('digest email — with tasks', () => {
    it('contains all task titles', () => {
      const html = buildEmailHtml({
        type: 'digest',
        tasks: [{ title: 'Task Alpha' }, { title: 'Task Beta' }],
      });
      expect(html).toContain('Task Alpha');
      expect(html).toContain('Task Beta');
    });

    it('renders one list item per task', () => {
      const html = buildEmailHtml({
        type: 'digest',
        tasks: [{ title: 'Task Alpha' }, { title: 'Task Beta' }],
      });
      expect(html.match(/<li/g)?.length).toBe(2);
    });

    it('does not contain Tailwind class names', () => {
      const html = buildEmailHtml({
        type: 'digest',
        tasks: [{ title: 'Task Alpha' }],
      });
      expect(html).not.toContain('class=');
    });
  });

  describe('digest email — empty', () => {
    it('shows no-pending-tasks message when tasks array is empty', () => {
      const html = buildEmailHtml({ type: 'digest', tasks: [] });
      expect(html).toContain('No pending tasks');
    });

    it('does not contain a list element when tasks array is empty', () => {
      const html = buildEmailHtml({ type: 'digest', tasks: [] });
      expect(html).not.toContain('<li');
    });
  });
});
```

- [ ] **Step 2: Run the tests — verify they fail**

```bash
npx vitest run tests/unit/email-template.test.ts
```

Expected: all tests fail with `Error: not implemented`

---

### Task 3: Implement `buildEmailHtml()`

**Files:**
- Modify: `lib/email/template.ts`

- [ ] **Step 1: Replace the stub with the full implementation**

```typescript
export type TaskEmailInput = {
  type: 'task';
  title: string;
  createdAt: string;
};

export type DigestEmailInput = {
  type: 'digest';
  tasks: Array<{ title: string }>;
};

export type EmailInput = TaskEmailInput | DigestEmailInput;

const CARD = 'font-family:sans-serif;max-width:480px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;';
const HEADER = 'background:#059669;padding:12px 20px;';
const HEADER_LABEL = 'color:white;font-size:14px;font-weight:600;';
const BODY = 'padding:20px;';
const TITLE = 'margin:0 0 4px;font-size:18px;font-weight:700;color:#1e293b;';
const META = 'margin:0;font-size:12px;color:#94a3b8;';
const LIST = 'margin:0;padding:0;list-style:none;';
const LIST_ITEM = 'padding:12px 20px;border-top:1px solid #f1f5f9;';
const ITEM_TITLE = 'margin:0;font-weight:600;color:#1e293b;font-size:14px;';
const EMPTY = 'margin:0;color:#94a3b8;font-size:14px;';

function card(label: string, body: string): string {
  return (
    `<div style="${CARD}">` +
      `<div style="${HEADER}"><span style="${HEADER_LABEL}">${label}</span></div>` +
      body +
    `</div>`
  );
}

export function buildEmailHtml(input: EmailInput): string {
  if (input.type === 'task') {
    return card(
      'New Task Added',
      `<div style="${BODY}">` +
        `<p style="${TITLE}">${input.title}</p>` +
        `<p style="${META}">Created ${input.createdAt}</p>` +
      `</div>`,
    );
  }

  if (input.tasks.length === 0) {
    return card(
      'Pending Tasks Summary',
      `<div style="${BODY}"><p style="${EMPTY}">No pending tasks.</p></div>`,
    );
  }

  const items = input.tasks
    .map(t => `<li style="${LIST_ITEM}"><p style="${ITEM_TITLE}">${t.title}</p></li>`)
    .join('');

  return card('Pending Tasks Summary', `<ul style="${LIST}">${items}</ul>`);
}
```

- [ ] **Step 2: Run the tests — verify they all pass**

```bash
npx vitest run tests/unit/email-template.test.ts
```

Expected: all 9 tests pass

- [ ] **Step 3: Commit**

```bash
git add lib/email/template.ts tests/unit/email-template.test.ts
git commit -m "feat: add buildEmailHtml utility with inline-CSS styled card templates"
```

---

### Task 4: Use `buildEmailHtml()` in `server-actions/tasks.ts`

**Files:**
- Modify: `server-actions/tasks.ts`

- [ ] **Step 1: Add the import after the last existing import (line 16)**

```typescript
import { buildEmailHtml } from '@/lib/email/template';
```

- [ ] **Step 2: Replace the inline `body` string on line 42**

Replace this line inside the `insertImmediateEmail` call:
```typescript
      body: `<div class="space-y-1"><p>A new task was added: <strong class="font-semibold text-slate-800">${task.title}</strong>.</p><p class="text-xs text-slate-500">Created at: ${formatTimestamp(task.createdAt)}.</p></div>`,
```

With:
```typescript
      body: buildEmailHtml({ type: 'task', title: task.title, createdAt: formatTimestamp(task.createdAt) }),
```

- [ ] **Step 3: Run typecheck**

```bash
npm run typecheck
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add server-actions/tasks.ts
git commit -m "feat: use buildEmailHtml for immediate task email body"
```

---

### Task 5: Use `buildEmailHtml()` in the email-summary route

**Files:**
- Modify: `app/api/notifications/email-summary/run/route.ts`

- [ ] **Step 1: Add the import after the last existing import (line 7)**

```typescript
import { buildEmailHtml } from '@/lib/email/template';
```

- [ ] **Step 2: Replace the inline `body` construction on lines 34–36**

Replace:
```typescript
    const body = pendingTasks.length === 0
      ? '<div><p>No pending tasks.</p></div>'
      : `<div class="space-y-1"><p class="font-medium text-slate-800">Pending tasks:</p><ul class="list-disc pl-5 space-y-1">${pendingTasks.map(t => `<li>${t.title}</li>`).join('')}</ul></div>`;
```

With:
```typescript
    const body = buildEmailHtml({
      type: 'digest',
      tasks: pendingTasks.map(t => ({ title: t.title })),
    });
```

- [ ] **Step 3: Run typecheck**

```bash
npm run typecheck
```

Expected: no errors

- [ ] **Step 4: Run all unit tests**

```bash
npx vitest run
```

Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add app/api/notifications/email-summary/run/route.ts
git commit -m "feat: use buildEmailHtml for summary digest email body"
```

---

### Task 6: Verify end-to-end in the app

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Create a task and verify the Emails panel**

Sign in, create a new task. In the Emails panel, the new entry should show:
- A white card with an emerald green header bar labelled "New Task Added"
- The task title in bold large text
- The created-at timestamp in small muted text below

Action buttons ("Mark complete") will appear below the body card as separate emerald-styled links — that is correct behaviour (they are rendered by the UI panel from `email.actions`, not embedded in the body HTML).

- [ ] **Step 3: Trigger the summary email and verify the digest**

```bash
curl -X POST http://localhost:3000/api/notifications/email-summary/run \
  -H "Authorization: Bearer $(grep CRON_SECRET .env.local | cut -d= -f2)"
```

In the Emails panel, a new entry should appear showing:
- Emerald header "Pending Tasks Summary"
- A list of task titles, each in its own row with a hairline separator
- Or "No pending tasks." if no pending tasks exist

- [ ] **Step 4: Run typecheck one final time**

```bash
npm run typecheck
```

Expected: no errors

---

## Verification Summary

| Check | Command | Expected |
|-------|---------|----------|
| Unit tests | `npx vitest run` | All pass |
| Typecheck | `npm run typecheck` | No errors |
| Immediate email | Create task → Emails panel | Styled card with emerald header and task title |
| Digest email | Trigger cron → Emails panel | Styled list or "No pending tasks." |
