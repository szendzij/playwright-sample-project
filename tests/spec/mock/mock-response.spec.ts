import { test, expect } from '../../fixtures/mock/mock-test.ts';

test.describe('Mock API — Basic Responses (route.fulfill)', () => {
  test('renders catalog with custom mocked products, special characters, and badges', async ({
    homePage,
    mockHelper,
  }) => {
    // 1. Setup mock route before navigation
    await mockHelper.mockProducts();

    // 2. Open homepage
    await homePage.open();

    // 3. Verify exactly 4 mocked products are rendered
    const count = await homePage.getProductCount();
    expect(count).toBe(4);

    const cards = await homePage.getProductCards();

    // 4. Verify Polish diacritics and special characters in product name
    await expect(cards[0].title).toHaveText('Super Wiertarka Udarowa 2500W (Zestaw XXL)');
    await expect(cards[0].price).toContainText('199.99');

    // 5. Verify out-of-stock badge rendering
    await expect(cards[1].outOfStockBadge).toBeVisible();

    // 6. Verify extreme price rendering ($99,999.99)
    await expect(cards[3].title).toContainText('Przemysłowy Robot Spawalniczy');
    await expect(cards[3].price).toContainText('99999.99');
  });

  test('displays empty state when catalog API returns 0 items', async ({ homePage, mockHelper }) => {
    // 1. Mock empty product response
    await mockHelper.mockEmptyProducts();

    // 2. Open homepage without waiting for cards (katalog ma 0 produktów)
    await homePage.open({ waitForProducts: false });

    // 3. Verify that no product cards are rendered
    const count = await homePage.getProductCount();
    expect(count).toBe(0);

    // 4. Verify catalog container or empty state representation in DOM
    await expect(homePage.cardItems).toHaveCount(0);
  });
});
