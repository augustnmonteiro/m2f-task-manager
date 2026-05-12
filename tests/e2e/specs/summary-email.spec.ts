import { test } from '../fixtures';
import { AuthPage } from '../pages/auth-page';
import { DashboardPage } from '../pages/dashboard-page';
import { testPassword } from '../fixtures/test-users';

test('summary email contains pending task', async ({ page, email }) => {
  const auth = new AuthPage(page);
  await auth.goto();
  await auth.login(email, testPassword);

  const dashboard = new DashboardPage(page);
  const title = `Summary task ${Date.now()}`;

  await dashboard.tasks.addTask(title);

  await page.waitForTimeout(65_000);
  await dashboard.triggerNotifications();
  await page.reload();

  await dashboard.emails.expectSummaryEmailContaining(title);
});
