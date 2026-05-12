import { defineConfig, devices } from '@playwright/test';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

export default defineConfig({
  testDir: './tests/e2e/specs',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  timeout: 60_000,
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'E2E_TEST_MODE=true npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    env: { E2E_TEST_MODE: 'true' },
  },
});
