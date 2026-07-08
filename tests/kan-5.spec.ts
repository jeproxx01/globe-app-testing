import { test, expect } from '../fixtures/fixtures';
import { plans, PlanData } from '../fixtures/plan-data';

test.describe('KAN-5: Validate Plan Details and Pricing', () => {
  for (const plan of plans) {
    test(`should display correct details for ${plan.price} plan`, async ({ shopPage }) => {
      await test.step('Navigate to Globe Online Shop', async () => {
        await shopPage.navigateToShop();
        await shopPage.expectTitleToMatch(/SIM-Only Plans/i);
      });

      await test.step('Accept cookies if prompted', async () => {
        await shopPage.dismissCookiesIfPresent();
      });

      await test.step('Click "Apply for a NEW Plan"', async () => {
        await shopPage.clickApplyNewPlan();
      });

      await test.step(`Open plan details for ${plan.price} plan`, async () => {
        const planIndex = plans.indexOf(plan);
        await shopPage.clickViewDetails(planIndex);
      });

      await test.step('Verify plan name is displayed', async () => {
        await shopPage.verifyPlanNameInModal(plan.name);
      });

      await test.step('Verify monthly price is displayed', async () => {
        await shopPage.verifyPlanPriceInModal(plan.price);
      });

      await test.step('Verify data allocation is displayed', async () => {
        await shopPage.verifyPlanDataInModal(plan.data);
      });

      await test.step('Verify data description is displayed', async () => {
        await shopPage.verifyPlanDataInModal(plan.dataDescription);
      });

      await test.step('Verify plan inclusions are listed', async () => {
        await shopPage.verifyInclusionsInModal(plan.inclusions);
      });

      await test.step('Verify promo badge is shown', async () => {
        if (plan.promoBadge) {
          await shopPage.verifyPromoBadgeInModal(plan.promoBadge);
        }
      });

      await test.step('Take screenshot for visual validation', async () => {
        await shopPage.takeScreenshot(`plan-details-${plan.price}`);
      });

      await test.step('Close plan details modal', async () => {
        await shopPage.closeModal();
      });
    });
  }
});
