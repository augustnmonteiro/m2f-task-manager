# Task Edit & Delete Design

**Date:** 2026-05-12  
**Scope:** Pending tasks only. Completed tasks are immutable.

## Summary

Users can edit the title of a pending task inline, or delete a pending task via a small confirmation dialog. Both actions are scoped to the authenticated user and to tasks with `status = 'pending'`.

## Backend

### Domain functions — `lib/domain/tasks.ts`

**`updateTaskTitle(client, userId, taskId, title): Promise<Task>`**
- Updates `title` and `updated_at` on the matching row.
- Query must include `.eq('user_id', userId).eq('status', 'pending')` to prevent editing completed tasks or another user's tasks.
- Throws if no row matched.

**`deleteTask(client, userId, taskId): Promise<void>`**
- Hard-deletes the row with `.eq('user_id', userId).eq('status', 'pending')`.
- No return value needed.

### Schemas — `lib/schemas/task.ts`

```ts
UpdateTaskInputSchema = z.object({ taskId: UuidSchema, title: z.string().trim().min(1).max(160) })
DeleteTaskInputSchema = z.object({ taskId: UuidSchema })
```

### Server actions — `server-actions/tasks.ts`

**`updateTask(input): Promise<ActionResult<{ task: Task }>>`**
1. Validate with `UpdateTaskInputSchema`.
2. Auth check.
3. Call `updateTaskTitle`.
4. Return `ok({ task })`.

**`deleteTask(input): Promise<ActionResult<{}>>`**
1. Validate with `DeleteTaskInputSchema`.
2. Auth check.
3. Call `deleteTask` domain function.
4. Call `cancelPendingTaskSms(supabase, taskId)` (mirrors how `completeTask` handles SMS cleanup).
5. Return `ok({})`.

No new API routes — all mutations go through server actions.

## UI — `task-panel.tsx`

### New state

```ts
const [editingId, setEditingId] = useState<string | null>(null);
const [editTitle, setEditTitle] = useState('');
const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
```

### Pending task row changes

Each row gets two icon buttons in the top-right corner, visible on `group-hover`:
- **Pencil (edit)** — sets `editingId = task.id` and `editTitle = task.title`
- **Trash (delete)** — sets `deleteConfirmId = task.id`

**Edit mode** (`editingId === task.id`):
- Title `<p>` is replaced by a text `<input>` pre-filled with `editTitle`.
- Save and Cancel buttons appear inline.
- Save: calls `updateTask({ taskId, title: editTitle })`, on success updates the task in the `pending` list and clears `editingId`.
- Cancel: clears `editingId` with no side effects.
- If the server action fails, show the error inline (same `fieldError` pattern already in the panel).

**Delete confirmation** (`deleteConfirmId === task.id`):
- A small inline box appears below the row content: "Delete this task?" with "Yes, delete" (destructive style) and "Cancel" buttons.
- Yes: calls `deleteTask({ taskId })`, on success removes task from `pending` list and decrements `pendingCount`.
- Cancel: clears `deleteConfirmId`.

### Constraints
- Only one row can be in edit mode at a time (setting `editingId` implicitly cancels any previous edit).
- Opening a delete confirm clears `editingId` and vice versa.
- Buttons are disabled while `isPending` (existing transition guard).

## Out of scope
- Editing completed tasks.
- Deleting completed tasks.
- Undo after delete.
- Bulk delete.
