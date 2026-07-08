import { expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ShopPage extends BasePage {
  private readonly applyNewPlanBtn = this.page.getByRole('button', { name: /apply for a new plan/i });
  private readonly planOnlyCard = this.page.locator('.card-content.selected-card');
  private readonly planCards = this.page.locator('button.brd-card-btn');
  private readonly selectedBtn = this.page.locator('button.brd-selected-btn');
  private readonly acceptCookiesBtn = this.page.getByRole('button', { name: /accept/i });

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

  async getLocalStorageState(): Promise<any> {
    return this.getLocalStorage('state');
  }
}
