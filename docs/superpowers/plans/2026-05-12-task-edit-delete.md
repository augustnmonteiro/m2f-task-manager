# Task Edit & Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to edit the title of a pending task inline and delete a pending task via a small confirmation dialog.

**Architecture:** Add two domain functions (`updateTaskTitle`, `deleteTask`) and two server actions (`updateTask`, `deleteTask`) following the existing pattern. Extend `task-panel.tsx` with `editingId`, `editTitle`, and `deleteConfirmId` state to drive inline edit mode and a per-row confirmation dialog.

**Tech Stack:** Next.js 15 server actions, Supabase (postgres), Zod, React 19, Tailwind CSS

---

### Task 1: Add Zod schemas for update and delete

**Files:**
- Modify: `lib/schemas/task.ts`

- [ ] **Step 1: Add the two new schemas**

Open `lib/schemas/task.ts` and add after the existing `CompleteTaskInputSchema`:

```ts
export const UpdateTaskInputSchema = z.object({
  taskId: UuidSchema,
  title: z.string().trim().min(1, 'Task title is required').max(160),
});

export const DeleteTaskInputSchema = z.object({
  taskId: UuidSchema,
});
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run typecheck
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add lib/schemas/task.ts
git commit -m "feat: add UpdateTaskInputSchema and DeleteTaskInputSchema"
```

---

### Task 2: Add domain functions for update and delete

**Files:**
- Modify: `lib/domain/tasks.ts`

- [ ] **Step 1: Add `updateTaskTitle`**

Open `lib/domain/tasks.ts` and add after the existing `completeTask` function:

```ts
export async function updateTaskTitle(
  client: Client,
  userId: string,
  taskId: string,
  title: string,
): Promise<Task> {
  const { data, error } = await client
    .from('tasks')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', taskId)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .select('*')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Task not found or not editable');
  return toTaskDto(data);
}
```

- [ ] **Step 2: Add `deleteTask`**

Immediately after `updateTaskTitle`:

```ts
export async function deleteTask(
  client: Client,
  userId: string,
  taskId: string,
): Promise<void> {
  const { error } = await client
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', userId)
    .eq('status', 'pending');
  if (error) throw error;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run typecheck
```
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add lib/domain/tasks.ts
git commit -m "feat: add updateTaskTitle and deleteTask domain functions"
```

---

### Task 3: Add server actions for update and delete

**Files:**
- Modify: `server-actions/tasks.ts`

- [ ] **Step 1: Import new schemas and domain functions**

At the top of `server-actions/tasks.ts`, extend the existing imports:

```ts
import {
  CreateTaskInputSchema,
  CompleteTaskInputSchema,
  UpdateTaskInputSchema,
  DeleteTaskInputSchema,
  type Task,
} from '@/lib/schemas/task';
import {
  insertTask,
  completeTask as completeTaskDomain,
  updateTaskTitle,
  deleteTask as deleteTaskDomain,
} from '@/lib/domain/tasks';
```

- [ ] **Step 2: Add `updateTask` server action**

Append to the bottom of `server-actions/tasks.ts`:

```ts
export async function updateTask(
  input: unknown,
): Promise<ActionResult<{ task: Task }>> {
  const parsed = UpdateTaskInputSchema.safeParse(input);
  if (!parsed.success) {
    return err({
      code: 'VALIDATION_ERROR',
      message: 'Invalid input.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err({ code: 'UNAUTHENTICATED', message: 'Not signed in.' });

  try {
    const task = await updateTaskTitle(supabase, user.id, parsed.data.taskId, parsed.data.title);
    return ok({ task });
  } catch {
    return err({ code: 'INTERNAL_ERROR', message: 'Failed to update task.' });
  }
}
```

- [ ] **Step 3: Add `deleteTask` server action**

Append immediately after `updateTask`:

```ts
export async function deleteTask(
  input: unknown,
): Promise<ActionResult<Record<string, never>>> {
  const parsed = DeleteTaskInputSchema.safeParse(input);
  if (!parsed.success) {
    return err({ code: 'VALIDATION_ERROR', message: 'Invalid task ID.' });
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return err({ code: 'UNAUTHENTICATED', message: 'Not signed in.' });

  try {
    await deleteTaskDomain(supabase, user.id, parsed.data.taskId);
    await cancelPendingTaskSms(supabase, parsed.data.taskId);
    return ok({});
  } catch {
    return err({ code: 'INTERNAL_ERROR', message: 'Failed to delete task.' });
  }
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npm run typecheck
```
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add server-actions/tasks.ts
git commit -m "feat: add updateTask and deleteTask server actions"
```

---

### Task 4: Wire edit and delete into task-panel.tsx

**Files:**
- Modify: `components/dashboard/task-panel.tsx`

- [ ] **Step 1: Import the new server actions**

Find the existing import at the top of `task-panel.tsx`:

```ts
import { createTask, completeTask } from '@/server-actions/tasks';
```

Replace with:

```ts
import { createTask, completeTask, updateTask, deleteTask } from '@/server-actions/tasks';
```

- [ ] **Step 2: Add the three new state variables**

After the existing `const [tab, setTab] = useState<'pending' | 'completed'>('pending');` line, add:

```ts
const [editingId, setEditingId] = useState<string | null>(null);
const [editTitle, setEditTitle] = useState('');
const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
const [editError, setEditError] = useState<string | null>(null);
```

- [ ] **Step 3: Add handleSaveEdit handler**

After the existing `handleComplete` function, add:

```ts
function handleStartEdit(task: Task) {
  setDeleteConfirmId(null);
  setEditError(null);
  setEditingId(task.id);
  setEditTitle(task.title);
}

function handleCancelEdit() {
  setEditingId(null);
  setEditTitle('');
  setEditError(null);
}

function handleSaveEdit(taskId: string) {
  startTransition(async () => {
    const result = await updateTask({ taskId, title: editTitle });
    if (!result.ok) {
      setEditError(result.error.fieldErrors?.title?.[0] ?? result.error.message);
      return;
    }
    setPending(prev => prev.map(t => t.id === taskId ? result.data.task : t));
    setEditingId(null);
    setEditTitle('');
    setEditError(null);
  });
}

function handleDeleteConfirm(taskId: string) {
  setEditingId(null);
  setEditTitle('');
  setDeleteConfirmId(taskId);
}

function handleCancelDelete() {
  setDeleteConfirmId(null);
}

function handleDelete(taskId: string) {
  startTransition(async () => {
    const result = await deleteTask({ taskId });
    if (!result.ok) return;
    setPending(prev => prev.filter(t => t.id !== taskId));
    setPendingCount(c => Math.max(0, c - 1));
    setDeleteConfirmId(null);
  });
}
```

- [ ] **Step 4: Replace the pending task row JSX**

Find this block inside the `pending.map(task => ...)` section (starting at `<div key={task.id} data-testid={...}`):

```tsx
<div
  key={task.id}
  data-testid={`pending-task-row-${task.id}`}
  className="group flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300"
>
  <button
    onClick={() => handleComplete(task.id)}
    disabled={isPending}
    data-testid={`complete-task-button-${task.id}`}
    aria-label={`Complete task ${task.title}`}
    className="mt-0.5 flex-shrink-0 h-4 w-4 rounded-full border-2 border-slate-300 transition hover:border-emerald-500 hover:bg-emerald-50 disabled:opacity-50"
  />
  <div className="min-w-0 flex-1">
    <p data-testid={`pending-task-title-${task.id}`} className="text-sm font-medium text-slate-800 break-words">{task.title}</p>
    <p data-testid={`pending-task-age-${task.id}`} className="mt-0.5 text-xs text-slate-400">{relativeAge(task.createdAt)}</p>
  </div>
</div>
```

Replace with:

```tsx
<div
  key={task.id}
  data-testid={`pending-task-row-${task.id}`}
  className="group flex flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300"
>
  <div className="flex items-start gap-3">
    <button
      onClick={() => handleComplete(task.id)}
      disabled={isPending}
      data-testid={`complete-task-button-${task.id}`}
      aria-label={`Complete task ${task.title}`}
      className="mt-0.5 flex-shrink-0 h-4 w-4 rounded-full border-2 border-slate-300 transition hover:border-emerald-500 hover:bg-emerald-50 disabled:opacity-50"
    />
    <div className="min-w-0 flex-1">
      {editingId === task.id ? (
        <div className="flex flex-col gap-1">
          <input
            data-testid={`edit-task-input-${task.id}`}
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            maxLength={160}
            autoFocus
            className="w-full rounded border border-slate-300 px-2 py-1 text-sm text-slate-800 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
          />
          {editError && (
            <p role="alert" className="text-xs text-red-600">{editError}</p>
          )}
          <div className="flex gap-1 mt-1">
            <button
              type="button"
              onClick={() => handleSaveEdit(task.id)}
              disabled={isPending || editTitle.trim().length === 0}
              data-testid={`save-edit-button-${task.id}`}
              className="rounded bg-slate-900 px-2 py-1 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              data-testid={`cancel-edit-button-${task.id}`}
              className="rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p data-testid={`pending-task-title-${task.id}`} className="text-sm font-medium text-slate-800 break-words">{task.title}</p>
          <p data-testid={`pending-task-age-${task.id}`} className="mt-0.5 text-xs text-slate-400">{relativeAge(task.createdAt)}</p>
        </>
      )}
    </div>
    {editingId !== task.id && (
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={() => handleStartEdit(task)}
          disabled={isPending}
          data-testid={`edit-task-button-${task.id}`}
          aria-label={`Edit task ${task.title}`}
          className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          type="button"
          onClick={() => handleDeleteConfirm(task.id)}
          disabled={isPending}
          data-testid={`delete-task-button-${task.id}`}
          aria-label={`Delete task ${task.title}`}
          className="rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 3H10M4.5 3V2H7.5V3M5 5.5V9M7 5.5V9M3 3L3.5 10H8.5L9 3H3Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    )}
  </div>
  {deleteConfirmId === task.id && (
    <div
      data-testid={`delete-confirm-${task.id}`}
      className="mt-2 flex items-center justify-between rounded-lg border border-red-100 bg-red-50 px-3 py-2"
    >
      <span className="text-xs text-red-700">Delete this task?</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleDelete(task.id)}
          disabled={isPending}
          data-testid={`confirm-delete-button-${task.id}`}
          className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          Yes, delete
        </button>
        <button
          type="button"
          onClick={handleCancelDelete}
          data-testid={`cancel-delete-button-${task.id}`}
          className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-100"
        >
          Cancel
        </button>
      </div>
    </div>
  )}
</div>
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npm run typecheck
```
Expected: no errors

- [ ] **Step 6: Run dev server and manually verify**

```bash
npm run dev
```

Open the app, add a task, then:
1. Hover a pending task — pencil and trash icons appear.
2. Click pencil — title becomes an input, Save/Cancel buttons appear.
3. Edit the title and click Save — title updates in place.
4. Click pencil again, then Cancel — title reverts.
5. Click trash — red confirmation bar appears.
6. Click "Yes, delete" — task disappears, pending count decrements.
7. Click trash on another task, click Cancel — confirmation disappears, task remains.

- [ ] **Step 7: Commit**

```bash
git add components/dashboard/task-panel.tsx
git commit -m "feat: inline edit and delete for pending tasks"
```
