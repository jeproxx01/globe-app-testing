import { Page, BrowserContext } from '@playwright/test';

/**
 * Utility helpers for handling Cloudflare-protected sites.
 * Use these in test files to improve reliability against bot detection.
 */

/**
 * Titles Cloudflare serves on its interstitial pages instead of the real site.
 * Matched case-insensitively.
 */
const CHALLENGE_TITLES = [
  'just a moment',
  'checking your browser',
  'attention required',
  'verify you are human',
];

/**
 * DOM markers Cloudflare injects while a challenge is being solved.
 */
const CHALLENGE_SELECTORS = [
  '#challenge-running',
  '#challenge-form',
  '#challenge-stage',
  '.cf-browser-verification',
  '#cf-please-wait',
];

/**
 * True when the page is showing a Cloudflare interstitial rather than the app.
 * The title is checked first because it is reliable even mid-navigation, then
 * Cloudflare's DOM markers as a backstop.
 */
export async function isCloudflareChallenge(page: Page): Promise<boolean> {
  const title = (await page.title().catch(() => '')).toLowerCase();
  if (CHALLENGE_TITLES.some((t) => title.includes(t))) return true;

  return page
    .evaluate(
      (selectors) => selectors.some((s) => document.querySelector(s) !== null),
      CHALLENGE_SELECTORS,
    )
    .catch(() => false);
}

/**
 * Poll until a Cloudflare challenge clears.
 * Returns true if the real site is showing, false if still challenged at timeout.
 */
export async function waitForChallengeToClear(page: Page, timeout = 15000): Promise<boolean> {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    if (!(await isCloudflareChallenge(page))) return true;
    await page.waitForTimeout(1000);
  }

  return !(await isCloudflareChallenge(page));
}

/**
 * Wait for Cloudflare challenge to complete.
 * Kept for backwards compatibility — prefer waitForChallengeToClear().
 */
export async function waitForCloudflare(page: Page, timeout = 30000): Promise<void> {
  await waitForChallengeToClear(page, timeout);
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
 *
 * Managed challenges ("Just a moment...") usually solve themselves in a few
 * seconds once the page has loaded, so the first move is to WAIT for the
 * interstitial to clear rather than immediately hammering the site with another
 * request. Only if it does not clear do we re-navigate, with a jittered backoff.
 *
 * Throws a descriptive error (instead of silently returning) when the challenge
 * never clears, so the failure is obvious in the report rather than surfacing as
 * a confusing "expected title ... received Just a moment" assertion later.
 */
export async function navigateWithCF(page: Page, url: string, maxRetries = 3): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

    if (await waitForChallengeToClear(page, 15000)) {
      return;
    }

    if (attempt < maxRetries) {
      await page.waitForTimeout(2000 + Math.random() * 3000);
    }
  }

  throw new Error(
    `Cloudflare challenge ("Just a moment...") did not clear after ${maxRetries} attempts at ${url}. ` +
      `The site is rate-limiting this machine — wait a minute before re-running, ` +
      `and make sure workers is set to 1 in playwright.config.ts.`,
  );
}
