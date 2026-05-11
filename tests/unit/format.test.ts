import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { relativeAge, formatTimestamp } from '@/lib/time/format';

describe('relativeAge', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('returns "just now" for < 60s', () => {
    const now = new Date('2026-01-01T12:00:00Z');
    vi.setSystemTime(now);
    const created = new Date('2026-01-01T11:59:30Z').toISOString();
    expect(relativeAge(created)).toBe('just now');
  });

  it('returns "1 min ago" for 60-119s', () => {
    const now = new Date('2026-01-01T12:01:00Z');
    vi.setSystemTime(now);
    const created = new Date('2026-01-01T12:00:00Z').toISOString();
    expect(relativeAge(created)).toBe('1 min ago');
  });

  it('returns "5 min ago" for 300s', () => {
    const now = new Date('2026-01-01T12:05:00Z');
    vi.setSystemTime(now);
    const created = new Date('2026-01-01T12:00:00Z').toISOString();
    expect(relativeAge(created)).toBe('5 min ago');
  });

  it('returns "2 hours ago" for 2h', () => {
    const now = new Date('2026-01-01T14:00:00Z');
    vi.setSystemTime(now);
    const created = new Date('2026-01-01T12:00:00Z').toISOString();
    expect(relativeAge(created)).toBe('2 hours ago');
  });
});

describe('formatTimestamp', () => {
  it('returns a non-empty string for a valid datetime', () => {
    const result = formatTimestamp('2026-01-01T12:00:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
