import { test } from '../fixtures';
import { AuthPage } from '../pages/auth-page';
import { DashboardPage } from '../pages/dashboard-page';
import { testPassword } from '../fixtures/test-users';

test('add task → immediate email appears → SMS appears after trigger', async ({ page, email }) => {
  const auth = new AuthPage(page);
  await auth.goto();
  await auth.signUp(email, testPassword);

  const dashboard = new DashboardPage(page);
  await dashboard.expectVisible();

  const title = `Lifecycle ${Date.now()}`;
  await dashboard.tasks.addTask(title);
  await dashboard.tasks.expectPendingTask(title);

  await dashboard.triggerNotifications();
  await dashboard.emails.expectImmediateTaskEmail(title);

  await dashboard.triggerNotifications();
  await dashboard.sms.expectSmsContaining(title);
});
