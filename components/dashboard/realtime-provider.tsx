'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Task } from '@/lib/schemas/task';

interface Handlers {
  onTaskChange: (task: Task, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void;
  onEmailUpdate: (email: Record<string, unknown>) => void;
  onSmsUpdate: (sms: Record<string, unknown>) => void;
}

interface Props extends Handlers {
  userId: string;
}

type BroadcastMsg = {
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: {
    record: Record<string, unknown>;
    old_record: Record<string, unknown> | null;
    table: string;
  };
};

export function RealtimeProvider({ userId, onTaskChange, onEmailUpdate, onSmsUpdate }: Props) {
  const supabase = createClient();
  const handlersRef = useRef({ onTaskChange, onEmailUpdate, onSmsUpdate });
  handlersRef.current = { onTaskChange, onEmailUpdate, onSmsUpdate };

  useEffect(() => {
    function handleBroadcast(msg: BroadcastMsg) {
      console.log('[Realtime] broadcast event:', msg);
      const { event, payload } = msg;
      const row = event === 'DELETE' ? (payload.old_record ?? {}) : (payload.record ?? {});

      switch (payload.table) {
        case 'tasks': {
          const task: Task = {
            id: row.id as string,
            userId: row.user_id as string,
            title: row.title as string,
            status: row.status as 'pending' | 'completed',
            createdAt: row.created_at as string,
            completedAt: (row.completed_at as string | null) ?? null,
            updatedAt: row.updated_at as string,
          };
          handlersRef.current.onTaskChange(task, event);
          break;
        }
        case 'emails':
          handlersRef.current.onEmailUpdate(row);
          break;
        case 'sms_messages':
          handlersRef.current.onSmsUpdate(row);
          break;
      }
    }

    const channel = supabase
      .channel(`dashboard:${userId}`, { config: { private: true } })
      .on('broadcast', { event: 'INSERT' }, (msg) => handleBroadcast(msg as unknown as BroadcastMsg))
      .on('broadcast', { event: 'UPDATE' }, (msg) => handleBroadcast(msg as unknown as BroadcastMsg))
      .on('broadcast', { event: 'DELETE' }, (msg) => handleBroadcast(msg as unknown as BroadcastMsg))
      .subscribe((status, err) => {
        console.log('[Realtime] status:', status, err ?? '');
      });

    return () => { supabase.removeChannel(channel); };
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
