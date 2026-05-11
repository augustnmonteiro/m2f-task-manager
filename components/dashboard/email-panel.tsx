'use client';

import { useRef, useCallback, useState } from 'react';
import { formatTimestamp } from '@/lib/time/format';
import type { Email } from '@/lib/schemas/email';

interface Props {
  emails: Email[];
  hasMore: boolean;
  onLoadMore: (cursor: string) => Promise<void>;
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
      await onLoadMore(oldest.createdAt);
      setLoading(false);
    });
    observer.current.observe(node);
  }, [emails, hasMore, loading, onLoadMore]);

  return (
    <section aria-labelledby="emails-heading" data-testid="emails-panel" className="flex flex-col gap-2">
      <h2 id="emails-heading" className="text-lg font-semibold">
        Emails <span className="text-sm font-normal text-gray-500">({emails.length})</span>
      </h2>

      <div data-testid="email-list" className="flex flex-col gap-2 overflow-y-auto max-h-[60vh]">
        {emails.length === 0 && (
          <p className="text-sm text-gray-400">No emails yet. Add a task to receive one.</p>
        )}
        {emails.map(email => (
          <div
            key={email.id}
            data-testid={`email-card-${email.id}`}
            className="border rounded p-3 flex flex-col gap-1"
          >
            <p
              data-testid={`email-subject-${email.id}`}
              className="text-sm font-semibold"
            >
              {email.subject}
            </p>
            <p
              data-testid={`email-timestamp-${email.id}`}
              className="text-xs text-gray-400"
            >
              {formatTimestamp(email.createdAt)}
            </p>
            {email.body && (
              <p
                data-testid={`email-body-${email.id}`}
                className="text-sm whitespace-pre-line"
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
                className="text-xs border rounded px-2 py-1 w-fit"
              >
                {action.label}
              </a>
            ))}
          </div>
        ))}
        <div ref={sentinelRef} className="h-1" />
        {loading && <p className="text-xs text-gray-400 text-center">Loading…</p>}
        {!hasMore && emails.length > 0 && (
          <p className="text-xs text-gray-400 text-center">No more emails.</p>
        )}
      </div>
    </section>
  );
}
