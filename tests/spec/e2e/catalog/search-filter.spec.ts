import { test, expect } from '@pages/base';
import { PRODUCT_BRANDS } from '@data/products';

test.describe('E2E — Katalog: Wyszukiwanie i Filtrowanie', () => {
  test('wyszukiwanie produktów po słowie kluczowym', async ({ page, homePage, header }) => {
    await homePage.open();

    const initialCount = await homePage.getProductCount();
    expect(initialCount).toBeGreaterThan(0);

    const keyword = 'Pliers';
    await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/products/search') && res.status() === 200
      ),
      header.search(keyword),
    ]);

    await expect(homePage.cardItems.first()).toContainText(keyword);
    const count = await homePage.getProductCount();
    expect(count).toBeGreaterThan(0);

    const cards = await homePage.getProductCards();
    for (const card of cards) {
      const name = await card.getName();
      expect(name.toLowerCase()).toContain(keyword.toLowerCase());
    }
  });

  test('filtrowanie produktów po marce', async ({ page, homePage, filterSidebar }) => {
    await homePage.open();

    const brandToSelect = PRODUCT_BRANDS[0]; // 'ForgeFlex Tools'
    const brandCheckbox = filterSidebar.getBrandCheckbox(brandToSelect);

    await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/products') && res.status() === 200
      ),
      filterSidebar.filterByBrand(brandToSelect),
    ]);

    // Verify checkbox is checked
    await expect(brandCheckbox).toBeChecked();

    // Verify products are displayed
    await expect(homePage.cardItems.first()).toBeVisible();
    const productCount = await homePage.getProductCount();
    expect(productCount).toBeGreaterThan(0);
  });
});
