import { defineConfig, devices } from '@playwright/test'

/**
 * E2E fumée (TESTING.md) : chromium seul, retries CI-only, traces au premier retry,
 * rapport au premier échec seulement (rétention 7 j, côté workflow).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Le service e2e sert le build de production : même artéfact que celui publié.
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
