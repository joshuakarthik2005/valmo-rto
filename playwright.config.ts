import { defineConfig, devices } from '@playwright/test'

// Uses the locally installed Chrome (channel: 'chrome') so no browser download is needed.
// Set BASE_URL to test a deployed preview, e.g. BASE_URL=https://<preview>.vercel.app npx playwright test
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:4173'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  reporter: [['list']],
  use: { baseURL: BASE_URL, channel: 'chrome', trace: 'off' },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: 'chrome', viewport: { width: 360, height: 780 } } },
    { name: 'tablet', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: process.env.BASE_URL ? undefined : { command: 'npm run build && npx vite preview --port 4173 --strictPort', port: 4173, timeout: 180_000, reuseExistingServer: true },
})
