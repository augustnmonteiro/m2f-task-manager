'use client';

import { useRef, useCallback, useState } from 'react';
import { formatTimestamp } from '@/lib/time/format';
import type { Sms } from '@/lib/schemas/sms';

interface Props {
  smsMessages: Sms[];
  totalCount: number;
  hasMore: boolean;
  onLoadMore: (cursor: string) => Promise<void>;
}

export function SmsPanel({ smsMessages, totalCount, hasMore, onLoadMore }: Props) {
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
      await onLoadMore(oldest.sentAt!);
      setLoading(false);
    });
    observer.current.observe(node);
  }, [smsMessages, hasMore, loading, onLoadMore]);

  async function handleLoadMore() {
    const oldest = smsMessages[smsMessages.length - 1];
    if (!oldest || loading) return;
    setLoading(true);
    await onLoadMore(oldest.sentAt!);
    setLoading(false);
  }

  return (
    <section aria-labelledby="sms-heading" data-testid="sms-panel" className="flex flex-1 flex-col gap-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <h2 id="sms-heading" className="text-base font-semibold text-slate-900">SMS</h2>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          {totalCount}
        </span>
      </div>

      <div data-testid="sms-list" className="flex max-h-80 flex-col gap-2 overflow-y-auto xl:max-h-none xl:min-h-0 xl:flex-1">
        {smsMessages.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center">
            <svg className="mx-auto mb-2 text-slate-300" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18h3" />
            </svg>
            <p className="text-sm text-slate-400">No SMS yet. First one arrives after the Fibonacci interval.</p>
          </div>
        )}
        {smsMessages.map(sms => (
          <div
            key={sms.id}
            data-testid={`sms-card-${sms.id}`}
            className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col gap-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Fibonacci #{sms.fibonacciIndex}
              </span>
              <p data-testid={`sms-timestamp-${sms.id}`} className="text-xs text-slate-400" suppressHydrationWarning>
                {formatTimestamp(sms.createdAt)}
              </p>
            </div>
            {sms.body && (
              <p data-testid={`sms-body-${sms.id}`} className="text-sm text-slate-700 border-t border-slate-100 pt-1.5 whitespace-pre-wrap">
                {sms.body}
              </p>
            )}
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
        {!hasMore && smsMessages.length > 0 && (
          <p className="text-xs text-slate-300 text-center py-2">All messages loaded</p>
        )}
      </div>
    </section>
  );
}
