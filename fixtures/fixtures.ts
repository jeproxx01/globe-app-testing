import { test as base } from '@playwright/test';
import { stealthPatch } from '../utils/cloudflare-helpers';
import { ShopPage } from '../pages/ShopPage';

type Fixtures = {
  shopPage: ShopPage;
};

export const test = base.extend<Fixtures>({
  page: async ({ page }, use) => {
    await stealthPatch(page);
    await use(page);
  },

  shopPage: async ({ page }, use) => {
    await use(new ShopPage(page));
  },
});

export { expect } from '@playwright/test';
