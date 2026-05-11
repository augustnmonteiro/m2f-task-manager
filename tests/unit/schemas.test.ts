import { describe, it, expect } from 'vitest';
import { CreateTaskInputSchema } from '@/lib/schemas/task';

describe('CreateTaskInputSchema', () => {
  it('trims whitespace', () => {
    const result = CreateTaskInputSchema.parse({ title: '  Buy milk  ' });
    expect(result.title).toBe('Buy milk');
  });
  it('rejects empty title', () => {
    expect(() => CreateTaskInputSchema.parse({ title: '' })).toThrow();
  });
  it('rejects whitespace-only title', () => {
    expect(() => CreateTaskInputSchema.parse({ title: '   ' })).toThrow();
  });
  it('rejects title over 160 chars', () => {
    expect(() => CreateTaskInputSchema.parse({ title: 'a'.repeat(161) })).toThrow();
  });
});
