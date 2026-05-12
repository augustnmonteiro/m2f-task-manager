'use client';

import { useState, useTransition, useRef, useCallback, useEffect } from 'react';
import { createTask, completeTask } from '@/server-actions/tasks';
import { relativeAge, formatTimestamp } from '@/lib/time/format';
import type { Task } from '@/lib/schemas/task';
import type { Email } from '@/lib/schemas/email';

interface Props {
  initialPending: Task[];
  totalPendingCount: number;
  hasMorePending: boolean;
  onPendingLoadMore: (cursor: string) => Promise<{ tasks: Task[]; hasMore: boolean }>;
  initialCompleted: Task[];
  hasMoreCompleted: boolean;
  onCompletedLoadMore: (cursor: string) => Promise<{ tasks: Task[]; hasMore: boolean }>;
  onPendingChange?: (tasks: Task[]) => void;
  onCompletedChange?: (tasks: Task[]) => void;
  onEmailCreated?: (email: Email) => void;
}

export function TaskPanel({
  initialPending,
  totalPendingCount,
  hasMorePending,
  onPendingLoadMore,
  initialCompleted,
  hasMoreCompleted,
  onCompletedLoadMore,
  onPendingChange,
  onCompletedChange,
  onEmailCreated,
}: Props) {
  const [pending, setPendingLocal] = useState<Task[]>(initialPending);
  const [pendingHasMore, setPendingHasMore] = useState(hasMorePending);
  const [pendingCount, setPendingCount] = useState(totalPendingCount);
  const [completed, setCompletedLocal] = useState<Task[]>(initialCompleted);
  const [completedHasMore, setCompletedHasMore] = useState(hasMoreCompleted);
  const [title, setTitle] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [loadingPending, setLoadingPending] = useState(false);
  const [loadingCompleted, setLoadingCompleted] = useState(false);
  const [tab, setTab] = useState<'pending' | 'completed'>('pending');

  // Always-fresh state snapshot for observer callbacks — avoids stale closures
  // without recreating observers on every render.
  const stateRef = useRef({ pending, pendingHasMore, loadingPending, completed, completedHasMore, loadingCompleted });
  useEffect(() => {
    stateRef.current = { pending, pendingHasMore, loadingPending, completed, completedHasMore, loadingCompleted };
  });

  const pendingObserver = useRef<IntersectionObserver | null>(null);
  const completedObserver = useRef<IntersectionObserver | null>(null);

  const pendingSentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (pendingObserver.current) pendingObserver.current.disconnect();
    if (!node) return;
    pendingObserver.current = new IntersectionObserver(async entries => {
      if (!entries[0].isIntersecting) return;
      const { pendingHasMore, loadingPending, pending } = stateRef.current;
      if (!pendingHasMore || loadingPending) return;
      const oldest = pending[pending.length - 1];
      if (!oldest) return;
      setLoadingPending(true);
      const result = await onPendingLoadMore(oldest.createdAt);
      setPendingLocal(prev => [...prev, ...result.tasks]);
      setPendingHasMore(result.hasMore);
      setLoadingPending(false);
    }, { root: node.parentElement, rootMargin: '100px' });
    pendingObserver.current.observe(node);
  }, [onPendingLoadMore]);

  const completedSentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (completedObserver.current) completedObserver.current.disconnect();
    if (!node) return;
    completedObserver.current = new IntersectionObserver(async entries => {
      if (!entries[0].isIntersecting) return;
      const { completedHasMore, loadingCompleted, completed } = stateRef.current;
      if (!completedHasMore || loadingCompleted) return;
      const oldest = completed[completed.length - 1];
      if (!oldest || !oldest.completedAt) return;
      setLoadingCompleted(true);
      try {
        const result = await onCompletedLoadMore(oldest.completedAt);
        setCompletedLocal(prev => [...prev, ...result.tasks]);
        setCompletedHasMore(result.hasMore);
      } finally {
        setLoadingCompleted(false);
      }
    }, { root: node.parentElement, rootMargin: '100px' });
    completedObserver.current.observe(node);
  }, [onCompletedLoadMore]);

  async function handleLoadMorePending() {
    const { pendingHasMore, loadingPending, pending } = stateRef.current;
    if (!pendingHasMore || loadingPending) return;
    const oldest = pending[pending.length - 1];
    if (!oldest) return;
    setLoadingPending(true);
    const result = await onPendingLoadMore(oldest.createdAt);
    setPendingLocal(prev => [...prev, ...result.tasks]);
    setPendingHasMore(result.hasMore);
    setLoadingPending(false);
  }

  async function handleLoadMoreCompleted() {
    const { completedHasMore, loadingCompleted, completed } = stateRef.current;
    if (!completedHasMore || loadingCompleted) return;
    const oldest = completed[completed.length - 1];
    if (!oldest || !oldest.completedAt) return;
    setLoadingCompleted(true);
    try {
      const result = await onCompletedLoadMore(oldest.completedAt);
      setCompletedLocal(prev => [...prev, ...result.tasks]);
      setCompletedHasMore(result.hasMore);
    } finally {
      setLoadingCompleted(false);
    }
  }

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
      setPendingCount(c => c + 1);
      onEmailCreated?.(result.data.email);
    });
  }

  function handleComplete(taskId: string) {
    startTransition(async () => {
      const result = await completeTask({ taskId });
      if (!result.ok) return;
      const task = result.data.task;
      setPending(prev => prev.filter(t => t.id !== taskId));
      setPendingCount(c => Math.max(0, c - 1));
      setCompleted(prev => [task, ...prev]);
    });
  }

  return (
    <section aria-labelledby="tasks-heading" data-testid="tasks-panel" className="flex flex-1 flex-col gap-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <h2 id="tasks-heading" className="text-base font-semibold text-slate-900">Tasks</h2>
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
          {pendingCount} pending
        </span>
      </div>

      <form onSubmit={handleAddTask} className="flex gap-2">
        <label className="sr-only" htmlFor="task-title-input">Task title</label>
        <input
          id="task-title-input"
          data-testid="task-title-input"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Add a new task…"
          maxLength={160}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={isPending}
          data-testid="add-task-button"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? '…' : 'Add'}
        </button>
      </form>
      {fieldError && (
        <p role="alert" aria-live="polite" className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {fieldError}
        </p>
      )}

      <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
        <button
          type="button"
          onClick={() => setTab('pending')}
          className={`flex-1 rounded-md py-1.5 transition ${tab === 'pending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Pending
        </button>
        <button
          type="button"
          onClick={() => setTab('completed')}
          className={`flex-1 rounded-md py-1.5 transition ${tab === 'completed' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Completed
        </button>
      </div>

      {tab === 'pending' && (
        <div data-testid="pending-task-list" className="flex max-h-80 flex-col gap-2 overflow-y-auto xl:max-h-none xl:min-h-0 xl:flex-1">
          {pending.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center">
              <p className="text-sm text-slate-400">No pending tasks. Add one above.</p>
            </div>
          )}
          {pending.map(task => (
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
          ))}
          <div ref={pendingSentinelRef} className="hidden xl:block h-1" />
          {pendingHasMore && (
            <button
              type="button"
              onClick={handleLoadMorePending}
              disabled={loadingPending}
              className="xl:hidden w-full rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {loadingPending ? 'Loading…' : 'Load more'}
            </button>
          )}
          {loadingPending && <p className="hidden xl:block text-xs text-slate-400 text-center py-2">Loading…</p>}
          {!pendingHasMore && pending.length > 0 && (
            <p className="text-xs text-slate-300 text-center py-2">All pending tasks loaded</p>
          )}
        </div>
      )}

      {tab === 'completed' && (
        <div data-testid="completed-task-list" className="flex max-h-80 flex-col gap-2 overflow-y-auto xl:max-h-none xl:min-h-0 xl:flex-1">
          {completed.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center">
              <p className="text-sm text-slate-400">No completed tasks yet.</p>
            </div>
          )}
          {completed.map(task => (
            <div
              key={task.id}
              data-testid={`completed-task-row-${task.id}`}
              className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"
            >
              <div className="mt-0.5 flex-shrink-0 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500">
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-400 line-through break-words">{task.title}</p>
                <p className="mt-0.5 text-xs text-slate-400">{formatTimestamp(task.completedAt!)}</p>
              </div>
            </div>
          ))}
          <div ref={completedSentinelRef} className="hidden xl:block h-1" />
          {completedHasMore && (
            <button
              type="button"
              onClick={handleLoadMoreCompleted}
              disabled={loadingCompleted}
              className="xl:hidden w-full rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              {loadingCompleted ? 'Loading…' : 'Load more'}
            </button>
          )}
          {loadingCompleted && <p className="hidden xl:block text-xs text-slate-400 text-center py-2">Loading…</p>}
          {!completedHasMore && completed.length > 0 && (
            <p className="text-xs text-slate-300 text-center py-2">All completed tasks loaded</p>
          )}
        </div>
      )}
    </section>
  );
}
