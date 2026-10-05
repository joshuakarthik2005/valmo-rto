import { defineConfig, devices } from '@playwright/test'

// Locally: the installed Chrome (channel 'chrome'), so no browser download is needed.
// In CI: Playwright's bundled Chromium, 2 workers and 1 retry, so parallel-load stalls on a shared runner don't make CI flaky.
// Set BASE_URL to test a deployed preview, e.g. BASE_URL=https://<preview>.vercel.app npx playwright test
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4173'
const CI = !!process.env.CI
const channel = CI ? undefined : 'chrome'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  workers: CI ? 2 : undefined,
  retries: CI ? 1 : 0,
  reporter: CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: { baseURL: BASE_URL, channel, trace: CI ? 'retain-on-failure' : 'off' },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'], channel, viewport: { width: 360, height: 780 }, deviceScaleFactor: 1.5 } },
    { name: 'tablet', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: process.env.BASE_URL ? undefined : {
    // scripts/serve.mjs applies vercel.json's headers (CSP included), so tests see production behaviour
    command: CI ? 'node scripts/serve.mjs --port 4173' : 'npm run build && node scripts/serve.mjs --port 4173',
    port: 4173, timeout: 180_000, reuseExistingServer: !CI,
  },
})
