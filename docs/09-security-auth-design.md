# 09 — Security and Auth Design

## Auth model

Use Supabase Auth with email/password.

- Browser client handles signup/login/logout UI calls.
- Server Components, Server Actions, and Route Handlers use the Supabase SSR server client.
- Store sessions in cookies for SSR compatibility.

## Authorization model

Every user-owned table includes `user_id` and RLS policies enforcing:

```sql
user_id = auth.uid()
```

The `profiles.id` field uses `auth.uid()` directly.

## Protected routes and server logic

All server-side domain mutations must:

1. validate input with Zod;
2. validate authenticated user;
3. scope all database reads/writes by authenticated user id;
4. rely on RLS as a second line of defense.

## Session trust

Do not trust unsigned client-provided user IDs. The server derives `userId` from Supabase auth claims/session. Client requests must never include authoritative `userId` values for mutations.

## Email action token design

### Token generation

When creating an email action:

1. Generate a cryptographically random raw token.
2. Hash token with SHA-256 plus `ACTION_TOKEN_SECRET` or HMAC-SHA256.
3. Store only the hash in `notification_actions.token_hash`.
4. Return raw token only to the email rendering path.

### Token validation

On action click:

1. Parse `token` query with Zod.
2. Hash incoming token using the same method.
3. Find matching action for current user.
4. Verify not expired.
5. Complete task idempotently.
6. Mark action as used.

### Expiration

Recommended expiration: 7 days.

### Reuse behavior

If token is reused:

- If the task is already completed, redirect with success/neutral state.
- Do not perform duplicate writes beyond safe idempotent updates.

## RLS requirements

RLS must be enabled for:

- `profiles`
- `tasks`
- `emails`
- `sms_messages`
- `notification_actions`
- `scheduler_state`
- `notification_runs`

## Service role key usage

The app should not need a service role key for normal runtime operations. Use it only in:

- test setup/cleanup;
- migrations;
- optional admin scripts.

Never expose service or secret keys to the browser.

## CSRF considerations

Server Actions and same-site cookies provide a basic protection layer, but route handlers that mutate state should still:

- require authenticated user;
- accept only expected methods;
- avoid accepting arbitrary user id;
- validate tokens and input.

The email action route is a GET because it acts like an email link. It must be token-protected and scoped to the authenticated user.

## Validation and error privacy

- Return safe messages to users.
- Log internal errors server-side.
- Do not expose SQL errors, token hashes, auth claims, or environment values.
