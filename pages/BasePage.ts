import { Page, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await this.page.waitForTimeout(10000);
  }

  async waitForSelector(selector: string, timeout = 10000): Promise<void> {
    await this.page.locator(selector).first().waitFor({ state: 'visible', timeout });
  }

  async clickButton(name: RegExp | string): Promise<void> {
    await this.page.getByRole('button', { name }).click();
  }

  async expectTitleToMatch(pattern: RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(pattern);
  }

  async expectUrlToMatch(pattern: RegExp): Promise<void> {
    await expect(this.page).toHaveURL(pattern);
  }

  async getLocalStorage(key: string): Promise<any> {
    return this.page.evaluate((k) => {
      const raw = localStorage.getItem(k);
      return raw ? JSON.parse(raw) : null;
    }, key);
  }
}
