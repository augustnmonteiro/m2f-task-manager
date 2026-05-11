'use client';

import { useState, useTransition } from 'react';
import { createTask, completeTask } from '@/server-actions/tasks';
import { relativeAge, formatTimestamp } from '@/lib/time/format';
import type { Task } from '@/lib/schemas/task';

interface Props {
  initialPending: Task[];
  initialCompleted: Task[];
  onPendingChange?: (tasks: Task[]) => void;
  onCompletedChange?: (tasks: Task[]) => void;
}

export function TaskPanel({ initialPending, initialCompleted, onPendingChange, onCompletedChange }: Props) {
  const [pending, setPendingLocal] = useState<Task[]>(initialPending);
  const [completed, setCompletedLocal] = useState<Task[]>(initialCompleted);
  const [title, setTitle] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function setPending(updater: (prev: Task[]) => Task[]) {
    const next = updater(pending);
    setPendingLocal(next);
    onPendingChange?.(next);
  }

  function setCompleted(updater: (prev: Task[]) => Task[]) {
    const next = updater(completed);
    setCompletedLocal(next);
    onCompletedChange?.(next);
  }

  function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    setFieldError(null);
    startTransition(async () => {
      const result = await createTask({ title });
      if (!result.ok) {
        setFieldError(result.error.fieldErrors?.title?.[0] ?? result.error.message);
        return;
      }
      setTitle('');
      setPending(prev => [result.data.task, ...prev]);
    });
  }

  function handleComplete(taskId: string) {
    startTransition(async () => {
      const result = await completeTask({ taskId });
      if (!result.ok) return;
      const task = result.data.task;
      setPending(prev => prev.filter(t => t.id !== taskId));
      setCompleted(prev => [task, ...prev]);
    });
  }

  return (
    <section aria-labelledby="tasks-heading" data-testid="tasks-panel" className="flex flex-col gap-4">
      <h2 id="tasks-heading" className="text-lg font-semibold">
        Tasks <span className="text-sm font-normal text-gray-500">({pending.length} pending)</span>
      </h2>

      <form onSubmit={handleAddTask} className="flex gap-2">
        <label className="sr-only" htmlFor="task-title-input">Task title</label>
        <input
          id="task-title-input"
          data-testid="task-title-input"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Task title"
          maxLength={160}
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isPending}
          data-testid="add-task-button"
          className="bg-black text-white rounded px-4 py-2 text-sm disabled:opacity-50"
        >
          {isPending ? 'Adding…' : 'Add Task'}
        </button>
      </form>
      {fieldError && <p role="alert" aria-live="polite" className="text-red-600 text-sm">{fieldError}</p>}

      <div data-testid="pending-task-list" className="flex flex-col gap-2">
        {pending.length === 0 && <p className="text-sm text-gray-400">No pending tasks.</p>}
        {pending.map(task => (
          <div
            key={task.id}
            data-testid={`pending-task-row-${task.id}`}
            className="border rounded p-3 flex justify-between items-start gap-2"
          >
            <div>
              <p data-testid={`pending-task-title-${task.id}`} className="text-sm font-medium">{task.title}</p>
              <p data-testid={`pending-task-age-${task.id}`} className="text-xs text-gray-400">{relativeAge(task.createdAt)}</p>
            </div>
            <button
              onClick={() => handleComplete(task.id)}
              disabled={isPending}
              data-testid={`complete-task-button-${task.id}`}
              aria-label={`Complete task ${task.title}`}
              className="text-xs border rounded px-2 py-1 disabled:opacity-50"
            >
              Complete
            </button>
          </div>
        ))}
      </div>

      <div data-testid="completed-task-list" className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-gray-500">Completed</h3>
        {completed.length === 0 && <p className="text-sm text-gray-400">No completed tasks yet.</p>}
        {completed.map(task => (
          <div
            key={task.id}
            data-testid={`completed-task-row-${task.id}`}
            className="border rounded p-3"
          >
            <p className="text-sm font-medium line-through text-gray-400">{task.title}</p>
            <p className="text-xs text-gray-400">{formatTimestamp(task.completedAt!)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
