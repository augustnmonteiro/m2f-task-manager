# 07 — Realtime Design

## Goal

Keep the one-page dashboard synchronized with Supabase database changes without manual refresh.

## Subscribed tables

Subscribe to user-scoped changes on:

- `tasks` — all events (`*`)
- `emails` — `UPDATE` only; item is added to the UI when `sent_at` transitions from `NULL` to a value
- `sms_messages` — `UPDATE` only; same rule
- `scheduler_state` — all events (`*`)

## Recommended subscription pattern

Use the Supabase browser client in a Client Component.

```ts
const channel = supabase
  .channel(`dashboard:${userId}`)
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
    handleTaskChange,
  )
  .on(
    'postgres_changes',
    // UPDATE only — item enters the UI when sent_at is set by the cron job
    { event: 'UPDATE', schema: 'public', table: 'emails', filter: `user_id=eq.${userId}` },
    handleEmailUpdate,
  )
  .on(
    'postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'sms_messages', filter: `user_id=eq.${userId}` },
    handleSmsUpdate,
  )
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'scheduler_state', filter: `user_id=eq.${userId}` },
    handleSchedulerStateChange,
  )
  .subscribe();
```

## Local state update rules

### Task events

- `INSERT`: upsert task into local tasks map.
- `UPDATE`: upsert task; recompute pending/completed derived lists.
- `DELETE`: remove task.

### Email events

- `UPDATE`: inspect the incoming row. If `sent_at` just became non-null (previous value was null) and the ID is not already in the local ID set, hydrate the email with its actions (via server action/route) and prepend it to the list. If the email is already in the list (e.g. loaded via pagination), update it in place.

### SMS events

- `UPDATE`: if `sent_at` just became non-null and the ID is not in the local ID set, prepend the SMS to the list.

### Scheduler state events

- `INSERT`/`UPDATE`: update scheduler state in local state so the next Fibonacci timeout is recalculated.

## Pagination and realtime merge strategy

Emails and SMS use cursor-based pagination (20 items per page, ordered by `created_at DESC`). Realtime inserts arrive independently and must not cause duplicates or corrupt the cursor.

Rules:

1. **Local ID set**: maintain a `Set<string>` of all IDs currently in the list (from both initial load and realtime). Before adding any item — from realtime or load-more — check the set first.
2. **Realtime items go to the top**: prepend to the list, do not insert at the cursor position.
3. **Cursor is immutable to realtime**: the load-more cursor is always `oldest_paginated_item.createdAt`. Realtime inserts never update it.
4. **Load-more deduplication**: when a load-more response returns an item already in the local ID set (possible if a realtime insert arrived between page fetches), skip it and continue rendering — `hasMore` logic is still driven by the `limit + 1` server response.

```ts
// Example merge on realtime UPDATE
function handleEmailUpdate(updated: Email) {
  if (!updated.sentAt) return;               // not yet sent, ignore
  if (emailIdSet.has(updated.id)) {
    // already in list — update in place (e.g. action used_at changed)
    setEmails(prev => prev.map(e => e.id === updated.id ? updated : e));
    return;
  }
  // newly sent — hydrate and prepend
  hydrateEmailWithActions(updated.id).then(full => {
    emailIdSet.add(full.id);
    setEmails(prev => [full, ...prev]);      // prepend; cursor unchanged
  });
}

// Example merge on load-more
function handleLoadMore(page: Email[]) {
  const fresh = page.filter(e => !emailIdSet.has(e.id));
  fresh.forEach(e => emailIdSet.add(e.id));
  setEmails(prev => [...prev, ...fresh]);
}
```

## Why email inserts may need hydration

The `emails` row does not contain a nested `actions` array. The UI needs action links, so either:

1. after each email insert, call a server action/route to fetch the email with actions; or
2. subscribe to `notification_actions` as well and join client-side.

Preferred approach: hydrate email via server function to keep token URL generation server-controlled.

## Reconnect fallback

Realtime can disconnect. On channel status events indicating reconnect, timeout, or error:

1. show a subtle reconnecting state if needed;
2. refetch dashboard data once subscribed again;
3. merge server state into local state.

## Security

Realtime events must still respect Supabase authorization. All relevant tables have RLS policies where `user_id = auth.uid()`.

## Multi-tab expectations

Two tabs for the same authenticated user should converge to the same state.

Test case:

1. Open tab A and tab B as same user.
2. Add task in tab A.
3. Confirm task and immediate email appear in tab B.
4. Complete task in tab B.
5. Confirm task moves to completed in tab A.
