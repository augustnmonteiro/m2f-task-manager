'use client';

import { useTransition } from 'react';
import { updateEmailSummaryInterval } from '@/server-actions/profile';

const PRESETS = [
  { label: 'Every minute', value: 60 },
  { label: 'Every 15 min', value: 900 },
  { label: 'Every hour', value: 3600 },
  { label: 'Daily', value: 86400 },
  { label: 'Weekly', value: 604800 },
];

interface Props {
  currentIntervalSeconds: number;
}

export function EmailSummaryIntervalSelector({ currentIntervalSeconds }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const intervalSeconds = parseInt(e.target.value, 10);
    startTransition(async () => {
      await updateEmailSummaryInterval({ intervalSeconds });
    });
  }

  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 text-slate-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="hidden sm:inline">Summary</span>
      <select
        data-testid="email-summary-interval-select"
        defaultValue={currentIntervalSeconds}
        onChange={handleChange}
        disabled={isPending}
        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:opacity-50"
      >
        {PRESETS.map(p => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>
    </label>
  );
}
