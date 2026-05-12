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

export function RealtimeProvider({ userId, onTaskChange, onEmailUpdate, onSmsUpdate }: Props) {
  const supabase = createClient();
  const handlersRef = useRef({ onTaskChange, onEmailUpdate, onSmsUpdate });
  handlersRef.current = { onTaskChange, onEmailUpdate, onSmsUpdate };

  useEffect(() => {
    const channel = supabase
      .channel(`dashboard:${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
        (payload) => {
          console.log('[Realtime] tasks event:', payload);
          const { eventType, new: newRow, old: oldRow } = payload as {
            eventType: 'INSERT' | 'UPDATE' | 'DELETE';
            new: Record<string, unknown>;
            old: Record<string, unknown>;
          };
          const row = eventType === 'DELETE' ? oldRow : newRow;
          const task: Task = {
            id: row.id as string,
            userId: row.user_id as string,
            title: row.title as string,
            status: row.status as 'pending' | 'completed',
            createdAt: row.created_at as string,
            completedAt: (row.completed_at as string | null) ?? null,
            updatedAt: row.updated_at as string,
          };
          handlersRef.current.onTaskChange(task, eventType);
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'emails', filter: `user_id=eq.${userId}` },
        (payload) => {
          console.log('[Realtime] emails event:', payload);
          handlersRef.current.onEmailUpdate(payload.new as Record<string, unknown>);
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sms_messages', filter: `user_id=eq.${userId}` },
        (payload) => {
          console.log('[Realtime] sms_messages event:', payload);
          handlersRef.current.onSmsUpdate(payload.new as Record<string, unknown>);
        },
      )
      .subscribe((status, err) => {
        console.log('[Realtime] status:', status, err ?? '');
      });

    return () => { supabase.removeChannel(channel); };
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
