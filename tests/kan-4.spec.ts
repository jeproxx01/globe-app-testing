import { test, expect } from '../fixtures/fixtures';

test.describe('KAN-4: Apply for a new Globe plan (Plan Only)', () => {
  test('should navigate to Globe shop, select Plan Only, and apply for a new plan', async ({ shopPage }) => {
    await test.step('Navigate to Globe Online Shop', async () => {
      await shopPage.navigateToShop();
      await shopPage.expectTitleToMatch(/SIM-Only Plans/i);
      await shopPage.expectUrlToMatch(/shop\.globe\.com\.ph/);
    });

    await test.step('Accept cookies if prompted', async () => {
      await shopPage.dismissCookiesIfPresent();
    });

    await test.step('Click "Apply for a NEW Plan"', async () => {
      await shopPage.clickApplyNewPlan();
    });

    await test.step('Verify "Plan Only" is selected by default', async () => {
      await shopPage.verifyPlanOnlySelected();
    });

    await test.step('Verify plan cards are displayed', async () => {
      await shopPage.verifyPlanCardsDisplayed();
    });

    await test.step('Select the 599 plan', async () => {
      await shopPage.selectFirstPlan();
    });

    await test.step('Verify plan is selected', async () => {
      await shopPage.verifyPlanSelected();
    });

    await test.step('Verify localStorage state contains plan and customer type', async () => {
      const state = await shopPage.getLocalStorageState();

      expect(state).not.toBeNull();
      expect(state.plan).toBeDefined();
      expect(state.plan.name).toContain('599');
      expect(state.plan.amount).toBe(599);
      expect(state.customerType).toBeDefined();
      expect(state.customerType.customerType).toBe('FTA');
    });
  });
});
