import { test, expect } from '@pages/base';

test.describe('Szczegóły produktu — testy wizualne ARIA', { tag: ['@visual'] }, () => {
  test('weryfikacja ARIA snapshot widoku szczegółów produktu', async ({
    homePage,
    productDetailsPage,
  }) => {
    await homePage.open();
    const cards = await homePage.getProductCards();
    expect(cards.length).toBeGreaterThan(0);

    await cards[0].openDetails();
    await productDetailsPage.waitForLoaded();

    await expect(productDetailsPage.productContainer).toMatchAriaSnapshot();
  });
});
