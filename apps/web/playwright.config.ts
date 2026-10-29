import { defineConfig, devices } from '@playwright/test';

const CI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run start:dev -w apps/gateway',
      cwd: '../..',
      url: 'http://localhost:3000/api/health',
      reuseExistingServer: !CI,
      timeout: 90_000,
    },
    {
      command: 'npm run dev -w apps/web -- --port 5173 --strictPort',
      cwd: '../..',
      url: 'http://localhost:5173',
      reuseExistingServer: !CI,
      timeout: 90_000,
    },
  ],
});
