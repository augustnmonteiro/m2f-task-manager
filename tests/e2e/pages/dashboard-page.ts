import { type Page, expect } from '@playwright/test';
import { TaskPanel } from './task-panel';
import { EmailPanel } from './email-panel';
import { SmsPanel } from './sms-panel';

export class DashboardPage {
  readonly tasks: TaskPanel;
  readonly emails: EmailPanel;
  readonly sms: SmsPanel;

  constructor(private readonly page: Page) {
    this.tasks = new TaskPanel(page);
    this.emails = new EmailPanel(page);
    this.sms = new SmsPanel(page);
  }

  async goto() { await this.page.goto('/'); }

  async expectVisible() {
    await expect(this.page.getByTestId('dashboard')).toBeVisible();
    // Reload after login so Supabase Realtime WebSocket connects cleanly.
    await this.page.reload();
    await expect(this.page.getByTestId('dashboard')).toBeVisible();
    await expect(this.page.getByTestId('tasks-panel')).toBeVisible();
    await expect(this.page.getByTestId('emails-panel')).toBeVisible();
    await expect(this.page.getByTestId('sms-panel')).toBeVisible();
  }

  async triggerNotifications() {
    await this.page.request.post('/api/test/trigger-notifications');
  }

  async logout() {
    await this.page.getByTestId('logout-button').click();
  }
}
