import { defineConfig } from '@playwright/test';

/**
 * End-to-end tests for the whole app as it is deployed: the NestJS server serving the
 * production build of the Angular client and the API on one port, with a throwaway
 * in-memory MongoDB, so they never touch a dev server or database you are using.
 *
 * To test an app that is already running instead, set E2E_BASE_URL (e.g. http://localhost:4200).
 */
const APP_PORT = 3399;
const externalApp = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // Calls need two browsers at once; one test at a time keeps memory use modest.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: externalApp ?? `http://localhost:${APP_PORT}`,
    // The Chrome you have installed; set E2E_BROWSER_CHANNEL= (empty) to use Playwright's Chromium.
    channel: process.env.E2E_BROWSER_CHANNEL ?? 'chrome',
    viewport: { width: 390, height: 844 },
    permissions: ['microphone'],
    launchOptions: {
      // A fake microphone and no permission prompt, so calls carry real (test-tone) audio.
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--autoplay-policy=no-user-gesture-required',
      ],
    },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: externalApp
    ? undefined
    : {
        command: 'node scripts/start-app.mjs',
        url: `http://localhost:${APP_PORT}/api/health`,
        env: { APP_PORT: String(APP_PORT) },
        timeout: 300_000,
        reuseExistingServer: false,
      },
});
