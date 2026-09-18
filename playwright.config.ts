import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  // Navigation includes Cloudflare challenge waits + retries, so keep generous headroom.
  timeout: 120000,
  expect: {
    // expect() defaults to 5s, which is too tight for this Cloudflare-protected SPA.
    timeout: 10000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // IMPORTANT: keep this at 1. shop.globe.com.ph sits behind Cloudflare bot
  // protection; running several browser sessions concurrently triggers 403s on
  // /assets/* and /api/*, which leaves the plan list only partially rendered.
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  use: {
    baseURL: 'https://shop.globe.com.ph/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use the full Chromium build ("new" headless) instead of the default
        // headless shell. It is far less detectable and eliminates the Cloudflare
        // 403s on /assets/* and /api/* that the headless shell triggers.
        // Requires: npx playwright install chromium
        channel: 'chromium',
        // Cloudflare bypass settings
        launchOptions: {
          args: [
            '--disable-blink-features=AutomationControlled',
            '--no-sandbox',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
          ],
        },
        contextOptions: {
          // userAgent is intentionally NOT overridden here: devices['Desktop Chrome']
          // already sends a UA matching the installed browser version. A stale UA
          // (e.g. Chrome/120 against Chrome/149) triggers Cloudflare 403s.
          viewport: { width: 1920, height: 1080 },
          locale: 'en-PH',
          timezoneId: 'Asia/Manila',
          extraHTTPHeaders: {
            'Accept-Language': 'en-PH,en;q=0.9',
          },
        },
      },
    },
  ],
  outputDir: './test-results',
});
