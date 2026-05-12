import { test } from '../fixtures';
import { AuthPage } from '../pages/auth-page';
import { DashboardPage } from '../pages/dashboard-page';
import { testPassword } from '../fixtures/test-users';

test('complete task from immediate email action', async ({ page, email }) => {
  const auth = new AuthPage(page);
  await auth.goto();
  await auth.signUp(email, testPassword);

  const dashboard = new DashboardPage(page);
  const title = `Email completion ${Date.now()}`;

  await dashboard.tasks.addTask(title);
  await dashboard.triggerNotifications();
  await dashboard.emails.expectImmediateTaskEmail(title);

  await dashboard.emails.completeTaskFromEmail(title);

  await dashboard.tasks.expectNoPendingTask(title);
  await dashboard.tasks.expectCompletedTask(title);
});
