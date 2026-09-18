import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ShopPage extends BasePage {
  private readonly applyNewPlanBtn = this.page.getByRole('button', { name: /get a new mobile number/i });
  private readonly planOnlyCard = this.page.locator('.card-content.selected-card');
  private readonly planCards = this.page.locator('button.brd-card-btn');
  private readonly selectedBtn = this.page.locator('button.brd-selected-btn');
  private readonly acceptCookiesBtn = this.page.getByRole('button', { name: /accept/i });
  private readonly viewDetailsBtns = this.page.locator('button:has-text("View Details")');
  private readonly planTiles = this.page.locator('.brd-card-details');

  async navigateToShop(): Promise<void> {
    await this.goto('https://shop.globe.com.ph/');
  }

  async dismissCookiesIfPresent(): Promise<void> {
    if (await this.acceptCookiesBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.acceptCookiesBtn.click();
      await this.page.waitForTimeout(1000);
    }
  }

  async clickApplyNewPlan(): Promise<void> {
    await expect(this.applyNewPlanBtn).toBeVisible();
    await this.applyNewPlanBtn.click();
    await this.page.waitForTimeout(2000);
  }

  async verifyPlanOnlySelected(): Promise<void> {
    await expect(this.planOnlyCard).toBeVisible();
    await expect(this.planOnlyCard).toContainText('Plan Only');
  }

  async verifyPlanCardsDisplayed(): Promise<void> {
    await expect(this.planCards.first()).toBeVisible({ timeout: 10000 });
    const count = await this.planCards.count();
    expect(count).toBeGreaterThan(0);
  }

  async selectFirstPlan(): Promise<void> {
    const btn = this.planCards.first();
    await btn.scrollIntoViewIfNeeded();
    await expect(btn).toBeVisible();
    await btn.click();
    await this.page.waitForTimeout(3000);
  }

  async verifyPlanSelected(): Promise<void> {
    await expect(this.selectedBtn).toBeVisible({ timeout: 5000 });
    await expect(this.selectedBtn).toContainText('Selected');
  }

  /**
   * Locate a plan tile by its monthly price.
   *
   * The shop renders plans in DESCENDING price order (2499 → 599), so
   * index-based lookups are not stable. Prices are matched on word boundaries
   * so "599" cannot accidentally match "1599" or "2499".
   */
  private planTileByPrice(price: string) {
    return this.planTiles.filter({ hasText: new RegExp(`\\b${price}\\b`) }).first();
  }

  async selectPlanByPrice(price: string): Promise<void> {
    const tile = this.planTileByPrice(price);
    await tile.scrollIntoViewIfNeeded();
    await expect(tile).toBeVisible();
    await tile.locator('button.brd-card-btn').click();
    await this.page.waitForTimeout(3000);
  }

  async verifyPlanSelectedByPrice(price: string): Promise<void> {
    const tile = this.planTileByPrice(price);
    const selectedBtn = tile.locator('button.brd-selected-btn');
    await expect(selectedBtn).toBeVisible({ timeout: 10000 });
    await expect(selectedBtn).toContainText('Selected');
  }

  async clickViewDetailsByPrice(price: string): Promise<void> {
    const tile = this.planTileByPrice(price);
    await tile.scrollIntoViewIfNeeded();
    const btn = tile.locator('button:has-text("View Details")');
    await expect(btn).toBeVisible();
    await btn.click();
    await this.page.waitForTimeout(3000);
  }

  async getLocalStorageState(): Promise<any> {
    return this.getLocalStorage('state');
  }

  async clickViewDetails(planIndex = 0): Promise<void> {
    const btn = this.viewDetailsBtns.nth(planIndex);
    await btn.scrollIntoViewIfNeeded();
    await expect(btn).toBeVisible();
    await btn.click();
    await this.page.waitForTimeout(3000);
  }

  async getModalText(): Promise<string> {
    return this.page.evaluate(() => {
      const modals = document.querySelectorAll('.modal');
      for (const modal of modals) {
        if (window.getComputedStyle(modal).display !== 'none') {
          const content = modal.querySelector('.modal-content');
          if (content) return content.textContent?.trim() || '';
        }
      }
      return '';
    });
  }

  async verifyPlanNameInModal(name: string): Promise<void> {
    const text = await this.getModalText();
    expect(text).toContain(name);
  }

  async verifyPlanPriceInModal(price: string): Promise<void> {
    const text = await this.getModalText();
    expect(text).toContain(price);
  }

  async verifyPlanDataInModal(data: string): Promise<void> {
    const text = await this.getModalText();
    expect(text).toContain(data);
  }

  async verifyInclusionsInModal(inclusions: string[]): Promise<void> {
    const text = await this.getModalText();
    for (const inclusion of inclusions) {
      expect(text).toContain(inclusion);
    }
  }

  async verifyPromoBadgeInModal(badge: string): Promise<void> {
    const text = await this.getModalText();
    expect(text).toContain(badge);
  }

  async closeModal(): Promise<void> {
    await this.page.evaluate(() => {
      const modals = document.querySelectorAll('.modal');
      for (const modal of modals) {
        if (window.getComputedStyle(modal).display !== 'none') {
          const closeBtn = modal.querySelector('.btn-secondary') as HTMLButtonElement;
          if (closeBtn) closeBtn.click();
          break;
        }
      }
    });
    await this.page.waitForTimeout(1000);
  }

  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/${name}.png`, fullPage: false });
  }
}
