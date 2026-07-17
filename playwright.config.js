// playwright.config.js — screen tests.
//
// Your .mjs suites check the MATH. This checks the SCREEN. Every bug that shipped on
// 17 Jul 2026 — the plokOpenSlot white screen, the literal "/* Dev panel */" text on the
// league page, the locked-slip trap — compiled clean and passed esbuild + eslint + tdz.
// Nothing in the pipeline ever looked at the rendered page. This does.
//
// SAFETY: every test here is READ-ONLY. It never creates a league, never locks a pick,
// never writes. It is safe to point at production, and by default it does.
//
// Run:  npx playwright test
//       npx playwright test --headed      (watch it)
//       npx playwright show-report        (after a failure — screenshots + video)
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: 1,                    // the odds feed is flaky; one retry kills false alarms
  workers: 2,                    // be gentle — this hits the real Odds API through your app
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.PICKLOCK_URL || 'https://lined-up-murex.vercel.app',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'mobile', use: { ...devices['iPhone 14'] } },   // PWA — this is the real target
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
});
