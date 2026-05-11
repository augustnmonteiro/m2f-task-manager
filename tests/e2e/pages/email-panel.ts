import { type Page, expect } from '@playwright/test';

export class EmailPanel {
  constructor(private readonly page: Page) {}

  async expectImmediateTaskEmail(title: string) {
    await expect(
      this.page.getByTestId('email-list').getByText(`Task added: ${title}`),
    ).toBeVisible({ timeout: 10_000 });
  }

  async expectSummaryEmailContaining(title: string) {
    await expect(
      this.page.getByTestId('email-list').getByText('Pending tasks summary'),
    ).toBeVisible({ timeout: 10_000 });
  }

  async completeTaskFromEmail(title: string) {
    const actionLink = this.page
      .getByTestId('email-list')
      .locator(`[aria-label*="${title}"]`)
      .first();
    await actionLink.click();
    await this.page.waitForURL(/emailAction=completed/);
  }
}
