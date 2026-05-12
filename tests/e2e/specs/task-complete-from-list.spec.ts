import { test } from '../fixtures';
import { AuthPage } from '../pages/auth-page';
import { DashboardPage } from '../pages/dashboard-page';
import { testPassword } from '../fixtures/test-users';

test('complete task from task list shows in completed', async ({ page, email }) => {
  const auth = new AuthPage(page);
  await auth.goto();
  await auth.login(email, testPassword);

  const dashboard = new DashboardPage(page);
  const title = `List completion ${Date.now()}`;

  await dashboard.tasks.addTask(title);
  await dashboard.tasks.expectPendingTask(title);

  await dashboard.tasks.completeTaskByTitle(title);
  await dashboard.tasks.expectNoPendingTask(title);

  await dashboard.tasks.showCompleted();
  await dashboard.tasks.expectCompletedTask(title);
});
