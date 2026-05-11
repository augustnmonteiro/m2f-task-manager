'use client';

import { useState, useCallback, useRef } from 'react';
import { RealtimeProvider } from './realtime-provider';
import { TaskPanel } from './task-panel';
import { EmailPanel } from './email-panel';
import { SmsPanel } from './sms-panel';
import { signOut } from '@/server-actions/auth';
import type { Task } from '@/lib/schemas/task';
import type { Email } from '@/lib/schemas/email';
import type { Sms } from '@/lib/schemas/sms';

interface Props {
  userId: string;
  userEmail: string;
  initialPending: Task[];
  initialCompleted: Task[];
  initialEmails: Email[];
  initialSms: Sms[];
  hasMoreEmails: boolean;
  hasMoreSms: boolean;
  initialIntervalSeconds: number;
}

export function DashboardClient({
  userId,
  userEmail,
  initialPending,
  initialCompleted,
  initialEmails,
  initialSms,
  hasMoreEmails,
  hasMoreSms,
  initialIntervalSeconds,
}: Props) {
  const [pending, setPending] = useState(initialPending);
  const [completed, setCompleted] = useState(initialCompleted);
  const [emails, setEmails] = useState(initialEmails);
  const [smsMessages, setSmsMessages] = useState(initialSms);
  const [emailHasMore, setEmailHasMore] = useState(hasMoreEmails);
  const [smsHasMore, setSmsHasMore] = useState(hasMoreSms);

  const emailIdSet = useRef(new Set(initialEmails.map(e => e.id)));
  const smsIdSet = useRef(new Set(initialSms.map(s => s.id)));

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
  }, []);

  const handleSmsUpdate = useCallback((row: Record<string, unknown>) => {
    if (!row.sent_at) return;
    const id = row.id as string;
    if (smsIdSet.current.has(id)) return;
    const mapped: Sms = {
      id,
      userId: row.user_id as string,
      kind: 'fibonacci_summary',
      body: (row.body as string | null) ?? null,
      fibonacciIndex: row.fibonacci_index as number,
      scheduledAt: (row.scheduled_at as string | null) ?? null,
      sentAt: row.sent_at as string,
      createdAt: row.created_at as string,
    };
    smsIdSet.current.add(id);
    setSmsMessages(prev => [mapped, ...prev]);
  }, []);

  const handleEmailLoadMore = useCallback(async (cursor: string) => {
    const res = await fetch(`/api/notifications/emails?cursor=${encodeURIComponent(cursor)}&limit=20`);
    const data = await res.json();
    const fresh = (data.emails as Email[]).filter(e => !emailIdSet.current.has(e.id));
    fresh.forEach(e => emailIdSet.current.add(e.id));
    setEmails(prev => [...prev, ...fresh]);
    setEmailHasMore(data.hasMore);
  }, []);

  const handleSmsLoadMore = useCallback(async (cursor: string) => {
    const res = await fetch(`/api/notifications/sms?cursor=${encodeURIComponent(cursor)}&limit=20`);
    const data = await res.json();
    const fresh = (data.smsMessages as Sms[]).filter(s => !smsIdSet.current.has(s.id));
    fresh.forEach(s => smsIdSet.current.add(s.id));
    setSmsMessages(prev => [...prev, ...fresh]);
    setSmsHasMore(data.hasMore);
  }, []);

  return (
    <div data-testid="dashboard">
      <RealtimeProvider
        userId={userId}
        onTaskChange={handleTaskChange}
        onEmailUpdate={handleEmailUpdate}
        onSmsUpdate={handleSmsUpdate}
      />

      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="font-bold">Task Notifier</h1>
        <div className="flex items-center gap-4">
          <span data-testid="signed-in-user" className="text-sm">{userEmail}</span>
          <form action={signOut}>
            <button type="submit" data-testid="logout-button" className="text-sm underline">
              Log out
            </button>
          </form>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 p-4 xl:grid-cols-3">
        <TaskPanel
          initialPending={pending}
          initialCompleted={completed}
          onPendingChange={setPending}
          onCompletedChange={setCompleted}
        />
        <EmailPanel
          emails={emails}
          hasMore={emailHasMore}
          onLoadMore={handleEmailLoadMore}
        />
        <SmsPanel
          smsMessages={smsMessages}
          hasMore={smsHasMore}
          onLoadMore={handleSmsLoadMore}
        />
      </div>
    </div>
  );
}
