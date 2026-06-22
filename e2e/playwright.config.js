// Playwright config — ELVIA E2E contra staging.
// Lee variables de e2e/.env (BASE_URL, SUPABASE_*). Ver e2e/.env.example.
const { defineConfig, devices } = require('@playwright/test');
require('dotenv').config({ path: __dirname + '/.env' });

const BASE_URL = process.env.E2E_BASE_URL || 'https://elvialat.netlify.app';

module.exports = defineConfig({
  testDir: './tests',
  // Setup global crea usuarios/datos de prueba antes de toda la suite.
  globalSetup: require.resolve('./setup/global-setup.js'),
  globalTeardown: require.resolve('./setup/global-teardown.js'),
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,        // los tests comparten datos sembrados
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
