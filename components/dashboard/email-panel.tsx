'use client';

import { useRef, useCallback, useState } from 'react';
import { formatTimestamp } from '@/lib/time/format';
import type { Email } from '@/lib/schemas/email';

interface Props {
  emails: Email[];
  hasMore: boolean;
  onLoadMore: (cursor: string) => Promise<void>;
}

function KindBadge({ kind }: { kind: Email['kind'] }) {
  if (kind === 'immediate_task') {
    return (
      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
        Task added
      </span>
    );
  }
  return (
    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
      Summary
    </span>
  );
}

export function EmailPanel({ emails, hasMore, onLoadMore }: Props) {
  const [loading, setLoading] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect();
    if (!node || !hasMore) return;
    observer.current = new IntersectionObserver(async entries => {
      if (!entries[0].isIntersecting || loading) return;
      const oldest = emails[emails.length - 1];
      if (!oldest) return;
      setLoading(true);
      await onLoadMore(oldest.sentAt!);
      setLoading(false);
    });
    observer.current.observe(node);
  }, [emails, hasMore, loading, onLoadMore]);

  async function handleLoadMore() {
    const oldest = emails[emails.length - 1];
    if (!oldest || loading) return;
    setLoading(true);
    await onLoadMore(oldest.sentAt!);
    setLoading(false);
  }

  return (
    <section aria-labelledby="emails-heading" data-testid="emails-panel" className="flex flex-1 flex-col gap-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <h2 id="emails-heading" className="text-base font-semibold text-slate-900">Emails</h2>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          {emails.length}
        </span>
      </div>

      <div data-testid="email-list" className="flex max-h-80 flex-col gap-2 overflow-y-auto xl:max-h-none xl:min-h-0 xl:flex-1">
        {emails.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center">
            <svg className="mx-auto mb-2 text-slate-300" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            <p className="text-sm text-slate-400">No emails yet. Add a task to receive one.</p>
          </div>
        )}
        {emails.map(email => (
          <div
            key={email.id}
            data-testid={`email-card-${email.id}`}
            className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col gap-2"
          >
            <div className="flex items-start justify-between gap-2">
              <p
                data-testid={`email-subject-${email.id}`}
                className="text-sm font-semibold text-slate-800 leading-snug min-w-0 break-words"
              >
                {email.subject}
              </p>
              <div className="shrink-0"><KindBadge kind={email.kind} /></div>
            </div>
            <p
              data-testid={`email-timestamp-${email.id}`}
              className="text-xs text-slate-400"
            >
              {formatTimestamp(email.createdAt)}
            </p>
            {email.body && (
              <p
                data-testid={`email-body-${email.id}`}
                className="text-xs text-slate-600 whitespace-pre-line border-t border-slate-100 pt-2"
              >
                {email.body}
              </p>
            )}
            {email.actions.filter(a => !a.usedAt).map(action => (
              <a
                key={action.id}
                href={action.href}
                data-testid={`email-complete-action-${action.taskId}`}
                aria-label={`Complete task from email ${email.subject}`}
                className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4 7L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {action.label}
              </a>
            ))}
          </div>
        ))}
        <div ref={sentinelRef} className="hidden xl:block h-1" />
        {hasMore && (
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loading}
            className="xl:hidden w-full rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Load more'}
          </button>
        )}
        {loading && (
          <p className="hidden xl:block text-xs text-slate-400 text-center py-2">Loading…</p>
        )}
        {!hasMore && emails.length > 0 && (
          <p className="text-xs text-slate-300 text-center py-2">All emails loaded</p>
        )}
      </div>
    </section>
  );
}
