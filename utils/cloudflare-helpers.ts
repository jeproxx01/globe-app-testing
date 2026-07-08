import { Page, BrowserContext } from '@playwright/test';

/**
 * Utility helpers for handling Cloudflare-protected sites.
 * Use these in test files to improve reliability against bot detection.
 */

/**
 * Wait for Cloudflare challenge to complete.
 * Cloudflare may show a "Checking your browser" interstitial.
 */
export async function waitForCloudflare(page: Page, timeout = 30000): Promise<void> {
  try {
    // Wait for potential Cloudflare challenge to resolve
    await page.waitForFunction(() => {
      const challenge = document.querySelector('#challenge-running, #challenge-form, .cf-browser-verification');
      return !challenge;
    }, { timeout });
  } catch {
    // Challenge might not appear, continue
  }
}

/**
 * Patch navigator properties to reduce bot detection.
 * Call this after page creation or in a fixture.
 */
export async function stealthPatch(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Override webdriver detection
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });

    // Override plugins to look like a real browser
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });

    // Override languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-PH', 'en-US', 'en'],
    });

    // Override permissions API
    const originalQuery = window.navigator.permissions.query;
    (window.navigator.permissions as any).query = (parameters: any) =>
      parameters.name === 'notifications'
        ? Promise.resolve({ state: Notification.permission } as PermissionStatus)
        : originalQuery(parameters);

    // Override chrome runtime
    (window as any).chrome = {
      runtime: {},
      loadTimes: function () { return {}; },
      csi: function () { return {}; },
      app: { isInstalled: false, InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' }, RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' } },
    };

    // Override iframe detection
    Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
      get: function () { return window; },
    });
  });
}

/**
 * Create a context with anti-detection settings.
 */
export async function createStealthContext(browser: any): Promise<BrowserContext> {
  return browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-PH',
    timezoneId: 'Asia/Manila',
    extraHTTPHeaders: {
      'Accept-Language': 'en-PH,en;q=0.9',
    },
  });
}

/**
 * Navigate with Cloudflare awareness.
 * Retries navigation if a challenge is detected.
 */
export async function navigateWithCF(page: Page, url: string, maxRetries = 3): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await waitForCloudflare(page);

    // Check if we're past Cloudflare
    const title = await page.title();
    if (!title.includes('Just a moment') && !title.includes('Checking')) {
      return;
    }

    // Wait a bit before retry
    if (attempt < maxRetries) {
      await page.waitForTimeout(2000 + Math.random() * 3000);
    }
  }
}
