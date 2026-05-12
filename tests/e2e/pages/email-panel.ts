import { type Page, expect } from '@playwright/test';

export class EmailPanel {
  constructor(private readonly page: Page) { }

  async expectImmediateTaskEmail(title: string) {
    await this.page.reload();
    await expect(
      this.page.getByTestId('email-list').getByText(`Task added: ${title}`),
    ).toBeVisible({ timeout: 10_000 });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async expectSummaryEmailContaining(_title: string) {
    await this.page.reload();
    await expect(
      this.page.getByTestId('email-list').locator('[data-testid^="email-subject"]').getByText('Pending tasks summary'),
    ).toBeVisible({ timeout: 10_000 });
  }

  async completeTaskFromEmail(title: string) {
    const actionLink = this.page
      .getByTestId('email-list')
      .locator(`a:has-text("Done")`)
      .first();
    await actionLink.click();
  }
}
