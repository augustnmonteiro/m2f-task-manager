import { test } from '../fixtures';
import { AuthPage } from '../pages/auth-page';
import { DashboardPage } from '../pages/dashboard-page';
import { testPassword } from '../fixtures/test-users';

test('summary email contains pending task and completion action', async ({ page, email }) => {
  const auth = new AuthPage(page);
  await auth.goto();
  await auth.login(email, testPassword);

  const dashboard = new DashboardPage(page);
  const title = `Summary task ${Date.now()}`;

  await dashboard.tasks.addTask(title);

  // first trigger processes immediate email + schedules summary, second processes summary
  await dashboard.triggerNotifications();
  await page.waitForTimeout(1000);
  await dashboard.triggerNotifications();
  await page.waitForTimeout(1000);

  await dashboard.emails.expectSummaryEmailContaining(title);

  await dashboard.emails.completeTaskFromEmail(title);
  await dashboard.tasks.expectCompletedTask(title);
});
