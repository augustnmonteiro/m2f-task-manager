import { describe, it, expect } from 'vitest';
import { buildEmailHtml } from '@/lib/email/template';

describe('buildEmailHtml', () => {
  describe('task email', () => {
    it('contains the task title', () => {
      const html = buildEmailHtml({
        type: 'task',
        title: 'Buy groceries',
        createdAt: 'Jan 1, 2026, 12:00 PM',
      });
      expect(html).toContain('Buy groceries');
    });

    it('contains the createdAt string', () => {
      const html = buildEmailHtml({
        type: 'task',
        title: 'Buy groceries',
        createdAt: 'Jan 1, 2026, 12:00 PM',
      });
      expect(html).toContain('Jan 1, 2026, 12:00 PM');
    });

    it('contains the emerald header colour', () => {
      const html = buildEmailHtml({
        type: 'task',
        title: 'Buy groceries',
        createdAt: 'Jan 1, 2026, 12:00 PM',
      });
      expect(html).toContain('#059669');
    });

    it('does not contain Tailwind class names', () => {
      const html = buildEmailHtml({
        type: 'task',
        title: 'Buy groceries',
        createdAt: 'Jan 1, 2026, 12:00 PM',
      });
      expect(html).not.toContain('class=');
    });
  });

  describe('digest email — with tasks', () => {
    it('contains all task titles', () => {
      const html = buildEmailHtml({
        type: 'digest',
        tasks: [
          { title: 'Task Alpha', createdAt: 'Jan 1, 2026, 9:00 AM' },
          { title: 'Task Beta', createdAt: 'Jan 2, 2026, 10:00 AM' },
        ],
      });
      expect(html).toContain('Task Alpha');
      expect(html).toContain('Task Beta');
    });

    it('contains createdAt for each task', () => {
      const html = buildEmailHtml({
        type: 'digest',
        tasks: [
          { title: 'Task Alpha', createdAt: 'Jan 1, 2026, 9:00 AM' },
          { title: 'Task Beta', createdAt: 'Jan 2, 2026, 10:00 AM' },
        ],
      });
      expect(html).toContain('Jan 1, 2026, 9:00 AM');
      expect(html).toContain('Jan 2, 2026, 10:00 AM');
    });

    it('renders one list item per task', () => {
      const html = buildEmailHtml({
        type: 'digest',
        tasks: [
          { title: 'Task Alpha', createdAt: 'Jan 1, 2026, 9:00 AM' },
          { title: 'Task Beta', createdAt: 'Jan 2, 2026, 10:00 AM' },
        ],
      });
      expect(html.match(/<li/g)?.length).toBe(2);
    });

    it('does not contain Tailwind class names', () => {
      const html = buildEmailHtml({
        type: 'digest',
        tasks: [{ title: 'Task Alpha', createdAt: 'Jan 1, 2026, 9:00 AM' }],
      });
      expect(html).not.toContain('class=');
    });
  });

  describe('digest email — empty', () => {
    it('shows no-pending-tasks message when tasks array is empty', () => {
      const html = buildEmailHtml({ type: 'digest', tasks: [] });
      expect(html).toContain('No pending tasks');
    });

    it('does not contain a list element when tasks array is empty', () => {
      const html = buildEmailHtml({ type: 'digest', tasks: [] });
      expect(html).not.toContain('<li');
    });
  });
});
