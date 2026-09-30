import { test, expect } from '@pages/base';

test.describe('E2E — Panel Administratora', () => {
  test.use({ userRole: 'admin' });

  test('administrator loguje się i zarządza produktami w panelu admina', async ({
    adminDashboardPage,
  }) => {
    await adminDashboardPage.open();

    // Navigate to Products management view
    await adminDashboardPage.openProducts();

    // Verify products table and admin product controls
    await expect(adminDashboardPage.addProductButton).toBeVisible();
    await expect(adminDashboardPage.productsTableRows.first()).toBeVisible({ timeout: 15000 });
    const count = await adminDashboardPage.getProductsCount();
    expect(count).toBeGreaterThan(0);
  });
});
