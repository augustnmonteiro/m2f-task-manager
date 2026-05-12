import { test } from '../fixtures';
import { AuthPage } from '../pages/auth-page';
import { DashboardPage } from '../pages/dashboard-page';
import { testPassword } from '../fixtures/test-users';

test('add task → immediate email appears → SMS appears after trigger', async ({ page, email }) => {
  const auth = new AuthPage(page);
  await auth.goto();
  await auth.login(email, testPassword);

  const dashboard = new DashboardPage(page);
  await dashboard.expectVisible();

  const title = `Lifecycle ${Date.now()}`;
  await dashboard.tasks.addTask(title);
  await dashboard.tasks.expectPendingTask(title);

  await dashboard.triggerNotifications();
  await page.reload();
  await dashboard.emails.expectImmediateTaskEmail(title);

  // it needs to wait more than 1 minute for the sms to arrive
  await page.waitForTimeout(60_000);
  await dashboard.triggerNotifications();
  await page.reload();
  await dashboard.sms.expectSmsContaining(title);
});
