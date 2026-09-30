import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const environment = process.env.ENV || 'prod';
dotenv.config({ path: path.resolve(__dirname, `env/.env.${environment}`) });

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  snapshotDir: 'snapshots',
  snapshotPathTemplate: 'snapshots/aria/{testFileName}-snapshots/{arg}{ext}',
  expect: {
    toMatchAriaSnapshot: {
      pathTemplate: 'snapshots/aria/{testFileName}-snapshots/{arg}{ext}',
    },
  },
  use: {
    testIdAttribute: 'data-test',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    launchOptions: {
      args: ['--disable-blink-features=AutomationControlled'],
    },
  },
  projects: [
    {
      name: 'toolshop-e2e',
      testDir: './tests/spec',
      testIgnore: ['**/spec/api/**', '**/api/**', '**/sanity/**'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.BASE_URL || 'https://practicesoftwaretesting.com',
        browserName: 'chromium',
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'toolshop-api',
      testDir: './tests/spec',
      testMatch: ['**/spec/api/**', '**/api/**', '**/sanity/**'],
      use: {
        baseURL: process.env.API_URL || 'https://api.practicesoftwaretesting.com',
      },
    },
  ],
});
