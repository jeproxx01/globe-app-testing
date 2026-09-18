import { test, expect } from '@playwright/test';
import { isCloudflareChallenge, waitForChallengeToClear, navigateWithCF } from '../utils/cloudflare-helpers';

/**
 * Regression guard for the Cloudflare handling used by BasePage.goto().
 *
 * These tests are offline and deterministic: the interstitials are simulated
 * with route interception, so they never touch shop.globe.com.ph.
 *
 * Background: an intermittent "Just a moment..." challenge used to blow up
 * kan-4/kan-5 with a confusing `expect(page).toHaveTitle` failure, because
 * navigateWithCF() existed but was never wired into BasePage.goto().
 */

const REAL_URL = 'https://shop.globe.com.ph/';
const REAL_TITLE = 'SIM-Only Plans - Globe Online Shop';

// Mimics a challenge that solves itself: the marker is removed and the real
// title restored after 2s.
const SELF_SOLVING_HTML = `<!DOCTYPE html><html><head><title>Just a moment...</title></head>
<body><div id="challenge-running">Checking your browser before accessing</div>
<script>
  setTimeout(function () {
    var el = document.getElementById('challenge-running');
    if (el) el.remove();
    document.title = '${REAL_TITLE}';
  }, 2000);
</script></body></html>`;

// A challenge that never resolves.
const STUCK_HTML = `<!DOCTYPE html><html><head><title>Just a moment...</title></head>
<body><div id="challenge-running">Checking your browser before accessing</div></body></html>`;

const REAL_HTML = `<!DOCTYPE html><html><head><title>${REAL_TITLE}</title></head><body><h1>Plans</h1></body></html>`;

test.describe('Cloudflare challenge handling', () => {
  test('detects an interstitial from its title', async ({ page }) => {
    await page.setContent(SELF_SOLVING_HTML);
    expect(await isCloudflareChallenge(page)).toBe(true);
  });

  test('detects an interstitial from DOM markers alone', async ({ page }) => {
    await page.setContent(
      '<html><head><title>Some Other Title</title></head><body><div id="challenge-running"></div></body></html>',
    );
    expect(await isCloudflareChallenge(page)).toBe(true);
  });

  test('reports false for a normal page', async ({ page }) => {
    await page.setContent(REAL_HTML);
    expect(await isCloudflareChallenge(page)).toBe(false);
  });

  test('waits out a self-solving challenge instead of failing', async ({ page }) => {
    let requests = 0;
    await page.route(REAL_URL, async (route) => {
      requests += 1;
      if (requests === 1) {
        await route.fulfill({ status: 503, contentType: 'text/html', body: SELF_SOLVING_HTML });
        return;
      }
      await route.fulfill({ status: 200, contentType: 'text/html', body: REAL_HTML });
    });

    await navigateWithCF(page, REAL_URL, 3);

    // Recovered by waiting — no second navigation was needed.
    expect(requests).toBe(1);
    expect(await page.title()).toBe(REAL_TITLE);
    expect(await isCloudflareChallenge(page)).toBe(false);
  });

  test('returns false when a challenge never clears', async ({ page }) => {
    await page.setContent(STUCK_HTML);
    expect(await waitForChallengeToClear(page, 3000)).toBe(false);
  });
});