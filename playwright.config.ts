import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Service Center E2E Tests
 *
 * Test Structure:
 * - tests/e2e/ - End-to-end user workflow tests
 * - tests/integration/ - Integration tests
 * - tests/smoke/ - Quick smoke tests
 */

export default defineConfig({
  testDir: './tests',

  // Maximum time one test can run for
  timeout: 30 * 1000,

  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  // Shared settings for all projects
  use: {
    // Base URL for the application
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3025',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on first retry
    video: 'retain-on-failure',

    // Locale for Vietnamese support
    locale: 'vi-VN',

    // Timezone
    timezoneId: 'Asia/Ho_Chi_Minh',
  },

  // Configure projects for major browsers
  projects: [
    // Setup project - runs authentication before all tests
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Main browser project - uses authenticated state
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Note: Tests can override this with test.use({ storageState: 'path/to/specific/role.json' })
        storageState: 'playwright/.auth/admin.json', // Default to admin auth
      },
      dependencies: ['setup'], // Run setup project first
    },

    // Uncomment to test on other browsers
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //     storageState: 'playwright/.auth/admin.json',
    //   },
    //   dependencies: ['setup'],
    // },
    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari'],
    //     storageState: 'playwright/.auth/admin.json',
    //   },
    //   dependencies: ['setup'],
    // },

    // Mobile viewports
    // {
    //   name: 'Mobile Chrome',
    //   use: {
    //     ...devices['Pixel 5'],
    //     storageState: 'playwright/.auth/admin.json',
    //   },
    //   dependencies: ['setup'],
    // },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3025',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
