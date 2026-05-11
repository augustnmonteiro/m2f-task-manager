'use client';

import { useRef, useCallback, useState } from 'react';
import { formatTimestamp } from '@/lib/time/format';
import type { Sms } from '@/lib/schemas/sms';

interface Props {
  smsMessages: Sms[];
  hasMore: boolean;
  onLoadMore: (cursor: string) => Promise<void>;
}

export function SmsPanel({ smsMessages, hasMore, onLoadMore }: Props) {
  const [loading, setLoading] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (observer.current) observer.current.disconnect();
    if (!node || !hasMore) return;
    observer.current = new IntersectionObserver(async entries => {
      if (!entries[0].isIntersecting || loading) return;
      const oldest = smsMessages[smsMessages.length - 1];
      if (!oldest) return;
      setLoading(true);
      await onLoadMore(oldest.createdAt);
      setLoading(false);
    });
    observer.current.observe(node);
  }, [smsMessages, hasMore, loading, onLoadMore]);

  return (
    <section aria-labelledby="sms-heading" data-testid="sms-panel" className="flex flex-col gap-2">
      <h2 id="sms-heading" className="text-lg font-semibold">
        SMS <span className="text-sm font-normal text-gray-500">({smsMessages.length})</span>
      </h2>

      <div data-testid="sms-list" className="flex flex-col gap-2 overflow-y-auto max-h-[60vh]">
        {smsMessages.length === 0 && (
          <p className="text-sm text-gray-400">
            No SMS messages yet. The first SMS arrives after the first Fibonacci interval.
          </p>
        )}
        {smsMessages.map(sms => (
          <div
            key={sms.id}
            data-testid={`sms-card-${sms.id}`}
            className="border rounded p-3 flex flex-col gap-1"
          >
            <p data-testid={`sms-timestamp-${sms.id}`} className="text-xs text-gray-400">
              {formatTimestamp(sms.createdAt)}
            </p>
            {sms.body && (
              <p data-testid={`sms-body-${sms.id}`} className="text-sm">
                {sms.body}
              </p>
            )}
          </div>
        ))}
        <div ref={sentinelRef} className="h-1" />
        {loading && <p className="text-xs text-gray-400 text-center">Loading…</p>}
        {!hasMore && smsMessages.length > 0 && (
          <p className="text-xs text-gray-400 text-center">No more messages.</p>
        )}
      </div>
    </section>
  );
}
