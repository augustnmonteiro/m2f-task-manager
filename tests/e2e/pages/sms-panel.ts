import { type Page, expect } from '@playwright/test';

export class SmsPanel {
  constructor(private readonly page: Page) {}

  async expectSmsContaining(text: string) {
    await this.page.reload();
    await expect(
      this.page.getByTestId('sms-list').getByText(text, { exact: false }),
    ).toBeVisible({ timeout: 10_000 });
  }

  async expectSmsCountAtLeast(count: number) {
    await this.page.reload();
    await expect(
      this.page.getByTestId('sms-list').locator('[data-testid^="sms-card"]'),
    ).toHaveCount(count, { timeout: 10_000 });
  }
}
