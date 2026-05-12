import { describe, it, expect } from 'vitest';
import { signTaskJwt, verifyTaskJwt } from '@/lib/email/jwt';

process.env.EMAIL_JWT_SECRET = 'test-secret-that-is-at-least-32-chars-long!!';

describe('signTaskJwt / verifyTaskJwt', () => {
  it('round-trips userId and taskId', async () => {
    const token = await signTaskJwt('user-123', 'task-456');
    const payload = await verifyTaskJwt(token);
    expect(payload.userId).toBe('user-123');
    expect(payload.taskId).toBe('task-456');
  });

  it('rejects a tampered token', async () => {
    const token = await signTaskJwt('user-123', 'task-456');
    const tampered = token.slice(0, -4) + 'XXXX';
    await expect(verifyTaskJwt(tampered)).rejects.toThrow();
  });

  it('returns a non-empty string', async () => {
    const token = await signTaskJwt('user-1', 'task-1');
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });
});
