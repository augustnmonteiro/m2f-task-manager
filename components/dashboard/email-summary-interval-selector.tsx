'use client';

import { useTransition } from 'react';
import { updateEmailSummaryInterval } from '@/server-actions/profile';

const PRESETS = [
  { label: 'Every minute', value: 60 },
  { label: 'Every 15 minutes', value: 900 },
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
    <label className="flex items-center gap-2 text-sm">
      Email summary
      <select
        data-testid="email-summary-interval-select"
        defaultValue={currentIntervalSeconds}
        onChange={handleChange}
        disabled={isPending}
        className="border rounded px-2 py-1 text-sm"
      >
        {PRESETS.map(p => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
      </select>
    </label>
  );
}
