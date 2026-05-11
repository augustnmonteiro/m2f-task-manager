# 05 — UI Design

## UX goal

The user should understand the entire system at a glance: tasks on the left, simulated emails in the middle, simulated SMS on the right. Adding a task should immediately create visible domain state and notification state.

## Layout

### Desktop

Use a three-column responsive grid:

```text
┌──────────────────────┬──────────────────────┬──────────────────────┐
│ Tasks                │ Emails               │ SMS                  │
│ Add task form        │ Email inbox          │ SMS inbox            │
│ Pending tasks        │ Newest first         │ Newest first         │
│ Completed tasks      │                      │                      │
└──────────────────────┴──────────────────────┴──────────────────────┘
```

Suggested Tailwind:

```text
grid grid-cols-1 gap-4 xl:grid-cols-3
```

On small screens the sections stack vertically in the same route/page.

## Visual hierarchy

- App header: product name, signed-in user email, email summary interval selector, logout button.
- Three panels with equal visual weight.
- Each panel has a heading, count badge, and scrollable content area.
- Empty states are explicit.

## Component tree

```text
DashboardClient
  ├─ Header
  │   └─ EmailSummaryIntervalSelector
  ├─ ToastRegion
  └─ DashboardGrid
      ├─ TaskPanel
      │   ├─ AddTaskForm
      │   ├─ PendingTaskList
      │   │   └─ PendingTaskRow
      │   └─ CompletedTaskList
      │       └─ CompletedTaskRow
      ├─ EmailPanel
      │   └─ EmailCard
      │       └─ EmailActionButtonLink
      └─ SmsPanel
          └─ SmsCard
```

## Header design

The header contains the product name, signed-in user email, the email summary interval selector, and the logout button.

### Email summary interval selector

A `<select>` element labeled `Email summary` with options:

| Label | Value |
|---|---|
| Every minute | `60` |
| Every 15 minutes | `900` |
| Every hour | `3600` |
| Daily | `86400` |
| Weekly | `604800` |

Default: `Every minute` (60 seconds). The option values are seconds, matching `profiles.email_summary_interval_seconds`. Changing the value calls `updateEmailSummaryInterval` and persists immediately.

## Tasks panel design

### Add task form

Fields:

- text input labeled `Task title`;
- button labeled `Add Task`.

States:

- default;
- invalid with inline message;
- submitting with disabled button and spinner text `Adding…`.

### Pending task row

Content:

- title;
- relative age;
- Complete button.

Suggested row layout:

```text
[Task title]
[just now]                         [Complete]
```

### Completed task row

Content:

- title;
- completed timestamp.

## Emails panel design

### Email card

Content:

- subject as strong heading;
- timestamp;
- body text;
- one or more action links/buttons.

Immediate email example:

```text
Task added: Buy milk
Today, 14:05
A new task was added: Buy milk.
[Complete task]
```

Summary email example:

```text
Pending tasks summary
Today, 14:06
Pending tasks:
1. Buy milk
2. Send invoice
[Complete Buy milk] [Complete Send invoice]
```

## SMS panel design

### SMS card

Content:

- timestamp;
- body text.

Example:

```text
Today, 14:06
Pending tasks: Buy milk, Send invoice
```

## Accessibility requirements

- Use `<main>`, `<section>`, `<h1>`, `<h2>`, `<form>`, `<label>`, `<button>` semantically.
- Task input has visible label or screen-reader label.
- Panels use `aria-labelledby` pointing to section heading.
- Toast/status updates use `aria-live="polite"`.
- Buttons have clear accessible names, e.g. `Complete task Buy milk`.
- Email action links have clear accessible names, e.g. `Complete task from email Buy milk`.
- Avoid color-only status indicators.

## Required test IDs

Stable selectors are mandatory for Playwright.

### Global

| Element | `data-testid` |
|---|---|
| dashboard root | `dashboard` |
| signed-in user label | `signed-in-user` |
| email summary interval selector | `email-summary-interval-select` |
| logout button | `logout-button` |
| toast/status region | `status-region` |

### Tasks

| Element | `data-testid` |
|---|---|
| task panel | `tasks-panel` |
| task title input | `task-title-input` |
| add task button | `add-task-button` |
| pending list | `pending-task-list` |
| pending task row | `pending-task-row-{taskId}` |
| pending task title | `pending-task-title-{taskId}` |
| pending task age | `pending-task-age-{taskId}` |
| complete task button | `complete-task-button-{taskId}` |
| completed list | `completed-task-list` |
| completed task row | `completed-task-row-{taskId}` |

### Emails

| Element | `data-testid` |
|---|---|
| email panel | `emails-panel` |
| email list | `email-list` |
| email card | `email-card-{emailId}` |
| email subject | `email-subject-{emailId}` |
| email body | `email-body-{emailId}` |
| email timestamp | `email-timestamp-{emailId}` |
| email complete action | `email-complete-action-{taskId}` |

### SMS

| Element | `data-testid` |
|---|---|
| sms panel | `sms-panel` |
| sms list | `sms-list` |
| sms card | `sms-card-{smsId}` |
| sms body | `sms-body-{smsId}` |
| sms timestamp | `sms-timestamp-{smsId}` |

## Loading and empty states

- Tasks pending empty: `No pending tasks.`
- Tasks completed empty: `No completed tasks yet.`
- Emails empty: `No emails yet. Add a task to receive one.`
- Emails exhausted (all pages loaded): `No more emails.`
- SMS empty: `No SMS messages yet. The first SMS arrives after the first Fibonacci interval.`
- SMS exhausted: `No more messages.`

## Infinite scroll

The Emails and SMS panels each have a scrollable content area. When the user scrolls to within ~200 px of the bottom:

- Show a loading spinner while fetching the next page.
- Append the new items below the existing ones.
- Hide the spinner once the page loads or `hasMore` is false.
- Use an `IntersectionObserver` on a sentinel element at the bottom of each panel's list.

## Formatting

- Use `Intl.DateTimeFormat` for timestamps.
- Use a small local utility for relative age.
- Avoid adding large date libraries unless necessary.
