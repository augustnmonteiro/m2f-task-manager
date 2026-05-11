import { describe, it, expect } from 'vitest';
import { fibonacciIntervalSeconds } from '@/lib/time/fibonacci';

describe('fibonacciIntervalSeconds', () => {
  it('returns 60 for index 0', () => {
    expect(fibonacciIntervalSeconds(0)).toBe(60);
  });
  it('returns 60 for index 1', () => {
    expect(fibonacciIntervalSeconds(1)).toBe(60);
  });
  it('returns 120 for index 2', () => {
    expect(fibonacciIntervalSeconds(2)).toBe(120);
  });
  it('returns 180 for index 3', () => {
    expect(fibonacciIntervalSeconds(3)).toBe(180);
  });
  it('returns 300 for index 4', () => {
    expect(fibonacciIntervalSeconds(4)).toBe(300);
  });
  it('returns 480 for index 5', () => {
    expect(fibonacciIntervalSeconds(5)).toBe(480);
  });
});
