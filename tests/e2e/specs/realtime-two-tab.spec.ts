import { test } from '../fixtures';
import { AuthPage } from '../pages/auth-page';
import { DashboardPage } from '../pages/dashboard-page';
import { testPassword } from '../fixtures/test-users';

test('two tabs stay synchronized through realtime', async ({ browser, email }) => {
  const context = await browser.newContext();
  const pageA = await context.newPage();
  const pageB = await context.newPage();

  const auth = new AuthPage(pageA);
  await auth.goto();
  await auth.login(email, testPassword);

  const dashboardA = new DashboardPage(pageA);
  await dashboardA.expectVisible();

  await pageB.goto('/');
  const dashboardB = new DashboardPage(pageB);
  await dashboardB.expectVisible();

  const title = `Realtime ${Date.now()}`;
  await dashboardA.tasks.addTask(title);
  await dashboardB.tasks.expectPendingTask(title);

  await dashboardB.tasks.completeTaskByTitle(title);
  await dashboardA.tasks.expectCompletedTask(title);

  await context.close();
});
