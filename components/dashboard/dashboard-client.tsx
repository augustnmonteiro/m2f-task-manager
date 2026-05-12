'use client';

import { useState, useCallback, useRef, useTransition } from 'react';
import { RealtimeProvider } from './realtime-provider';
import { TaskPanel } from './task-panel';
import { EmailPanel } from './email-panel';
import { SmsPanel } from './sms-panel';
import { EmailSummaryIntervalSelector } from './email-summary-interval-selector';
import { signOut } from '@/server-actions/auth';
import type { Task } from '@/lib/schemas/task';
import type { Email } from '@/lib/schemas/email';
import type { Sms } from '@/lib/schemas/sms';

interface Props {
  userId: string;
  userEmail: string;
  initialPending: Task[];
  totalPendingCount: number;
  hasMorePending: boolean;
  initialCompleted: Task[];
  hasMoreCompleted: boolean;
  initialEmails: Email[];
  totalEmailCount: number;
  initialSms: Sms[];
  totalSmsCount: number;
  hasMoreEmails: boolean;
  hasMoreSms: boolean;
  initialIntervalSeconds: number;
}

export function DashboardClient({
  userId,
  userEmail,
  initialPending,
  totalPendingCount,
  hasMorePending,
  initialCompleted,
  hasMoreCompleted,
  initialEmails,
  totalEmailCount,
  initialSms,
  totalSmsCount,
  hasMoreEmails,
  hasMoreSms,
  initialIntervalSeconds,
}: Props) {
  const [pending, setPending] = useState(initialPending);
  const [completed, setCompleted] = useState(initialCompleted);
  const [emails, setEmails] = useState(initialEmails);
  const [emailCount, setEmailCount] = useState(totalEmailCount);
  const [smsMessages, setSmsMessages] = useState(initialSms);
  const [smsCount, setSmsCount] = useState(totalSmsCount);
  const [emailHasMore, setEmailHasMore] = useState(hasMoreEmails);
  const [smsHasMore, setSmsHasMore] = useState(hasMoreSms);

  const emailIdSet = useRef(new Set(initialEmails.map(e => e.id)));
  const smsIdSet = useRef(new Set(initialSms.map(s => s.id)));
  const [isTriggering, startTrigger] = useTransition();

  const handleTaskChange = useCallback((task: Task, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => {
    if (eventType === 'DELETE') {
      setPending(p => p.filter(t => t.id !== task.id));
      setCompleted(c => c.filter(t => t.id !== task.id));
      return;
    }
    if (task.status === 'pending') {
      setPending(p => {
        const exists = p.some(t => t.id === task.id);
        if (exists) return p.map(t => t.id === task.id ? task : t);
        return [task, ...p];
      });
      setCompleted(c => c.filter(t => t.id !== task.id));
    } else {
      setCompleted(c => {
        const exists = c.some(t => t.id === task.id);
        if (exists) return c.map(t => t.id === task.id ? task : t);
        return [task, ...c];
      });
      setPending(p => p.filter(t => t.id !== task.id));
    }
  }, []);

  const handleEmailUpdate = useCallback(async (row: Record<string, unknown>) => {
    if (!row.sent_at) return;
    const id = row.id as string;
    if (emailIdSet.current.has(id)) {
      setEmails(prev => prev.map(e => e.id === id ? {
        ...e,
        sentAt: row.sent_at as string,
        body: (row.body as string | null) ?? e.body,
      } : e));
      return;
    }
    const mapped: Email = {
      id,
      userId: row.user_id as string,
      kind: row.kind as Email['kind'],
      taskId: (row.task_id as string | null) ?? null,
      subject: row.subject as string,
      body: (row.body as string | null) ?? null,
      scheduledAt: (row.scheduled_at as string | null) ?? null,
      sentAt: row.sent_at as string,
      createdAt: row.created_at as string,
      actions: [],
    };
    emailIdSet.current.add(id);
    setEmails(prev => [mapped, ...prev]);
    setEmailCount(c => c + 1);
  }, []);

  const handleSmsUpdate = useCallback((row: Record<string, unknown>) => {
    if (!row.sent_at) return;
    const id = row.id as string;
    if (smsIdSet.current.has(id)) return;
    const mapped: Sms = {
      id,
      userId: row.user_id as string,
      taskId: (row.task_id as string | null) ?? null,
      kind: 'fibonacci_summary',
      body: (row.body as string | null) ?? null,
      fibonacciIndex: row.fibonacci_index as number,
      scheduledAt: (row.scheduled_at as string | null) ?? null,
      sentAt: row.sent_at as string,
      createdAt: row.created_at as string,
    };
    smsIdSet.current.add(id);
    setSmsMessages(prev => [mapped, ...prev]);
    setSmsCount(c => c + 1);
  }, []);

  const handlePendingLoadMore = useCallback(async (cursor: string): Promise<{ tasks: Task[]; hasMore: boolean }> => {
    const res = await fetch(`/api/tasks?status=pending&cursor=${encodeURIComponent(cursor)}&limit=20`);
    if (!res.ok) return { tasks: [], hasMore: true };
    const data = await res.json();
    return { tasks: data.tasks ?? [], hasMore: data.hasMore ?? false };
  }, []);

  const handleCompletedLoadMore = useCallback(async (cursor: string): Promise<{ tasks: Task[]; hasMore: boolean }> => {
    const res = await fetch(`/api/tasks?status=completed&cursor=${encodeURIComponent(cursor)}&limit=20`);
    if (!res.ok) return { tasks: [], hasMore: true };
    const data = await res.json();
    return { tasks: data.tasks ?? [], hasMore: data.hasMore ?? false };
  }, []);

  const handleEmailLoadMore = useCallback(async (cursor: string) => {
    const res = await fetch(`/api/notifications/emails?cursor=${encodeURIComponent(cursor)}&limit=20`);
    const data = await res.json();
    const fresh = (data.emails as Email[]).filter(e => !emailIdSet.current.has(e.id));
    fresh.forEach(e => emailIdSet.current.add(e.id));
    setEmails(prev => [...prev, ...fresh]);
    setEmailHasMore(data.hasMore);
  }, []);

  const handleEmailCreated = useCallback((email: Email) => {
    if (emailIdSet.current.has(email.id)) return;
    emailIdSet.current.add(email.id);
    setEmails(prev => [email, ...prev]);
  }, []);

  function handleTriggerNotifications() {
    startTrigger(async () => {
      await fetch('/api/test/trigger-notifications', { method: 'POST' });
    });
  }

  const handleSmsLoadMore = useCallback(async (cursor: string) => {
    const res = await fetch(`/api/notifications/sms?cursor=${encodeURIComponent(cursor)}&limit=20`);
    const data = await res.json();
    const fresh = (data.smsMessages as Sms[]).filter(s => !smsIdSet.current.has(s.id));
    fresh.forEach(s => smsIdSet.current.add(s.id));
    setSmsMessages(prev => [...prev, ...fresh]);
    setSmsHasMore(data.hasMore);
  }, []);

  return (
    <div data-testid="dashboard" className="flex min-h-screen flex-col bg-slate-50 xl:h-screen xl:overflow-hidden">
      <RealtimeProvider
        userId={userId}
        onTaskChange={handleTaskChange}
        onEmailUpdate={handleEmailUpdate}
        onSmsUpdate={handleSmsUpdate}
      />

      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-3 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900">
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-sm font-semibold text-slate-900">Task Notifier</h1>
        </div>
        <div className="flex items-center gap-4">
          <EmailSummaryIntervalSelector currentIntervalSeconds={initialIntervalSeconds} />
          {/* <button
            type="button"
            onClick={handleTriggerNotifications}
            disabled={isTriggering}
            data-testid="trigger-notifications-button"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
          >
            {isTriggering ? 'Sending…' : 'Run notifications'}
          </button> */}
          <span data-testid="signed-in-user" className="hidden text-xs text-slate-500 sm:block">{userEmail}</span>
          <form action={signOut}>
            <button
              type="submit"
              data-testid="logout-button"
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Log out
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto min-h-0 w-full max-w-7xl flex-1 grid grid-cols-1 gap-4 p-4 sm:p-6 xl:grid-cols-3 xl:grid-rows-[1fr] xl:overflow-hidden">
        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <TaskPanel
            initialPending={pending}
            totalPendingCount={totalPendingCount}
            hasMorePending={hasMorePending}
            onPendingLoadMore={handlePendingLoadMore}
            initialCompleted={completed}
            hasMoreCompleted={hasMoreCompleted}
            onCompletedLoadMore={handleCompletedLoadMore}
            onPendingChange={setPending}
            onCompletedChange={setCompleted}
            onEmailCreated={handleEmailCreated}
          />
        </div>
        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <EmailPanel
            emails={emails}
            totalCount={emailCount}
            hasMore={emailHasMore}
            onLoadMore={handleEmailLoadMore}
          />
        </div>
        <div className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <SmsPanel
            smsMessages={smsMessages}
            totalCount={smsCount}
            hasMore={smsHasMore}
            onLoadMore={handleSmsLoadMore}
          />
        </div>
      </div>
    </div>
  );
}
