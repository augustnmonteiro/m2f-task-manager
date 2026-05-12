import { type Page, expect } from '@playwright/test';

export class TaskPanel {
  constructor(private readonly page: Page) { }

  async addTask(title: string) {
    await this.page.getByTestId('task-title-input').fill(title);
    await this.page.getByTestId('add-task-button').click();
    await expect(this.page.getByTestId('add-task-button')).not.toBeDisabled();
  }

  async expectPendingTask(title: string) {
    await expect(
      this.page.getByTestId('pending-task-list').getByText(title),
    ).toBeVisible({ timeout: 15_000 });
  }

  async expectNoPendingTask(title: string) {
    await expect(
      this.page.getByTestId('pending-task-list').getByText(title),
    ).not.toBeVisible();
  }

  async expectCompletedTask(title: string) {
    await expect(
      this.page.getByTestId('completed-task-list').getByText(title),
    ).toBeVisible({ timeout: 15_000 });
  }

  async showCompleted() {
    await this.page.locator('button:text("Completed")').click();
  }

  async completeTaskByTitle(title: string) {
    const row = this.page
      .getByTestId('pending-task-list')
      .locator('[data-testid^="pending-task-row"]')
      .filter({ hasText: title });
    await row.getByRole('button', { name: /complete/i }).click();
  }
}
