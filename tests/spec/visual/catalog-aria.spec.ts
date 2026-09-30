import { test, expect } from '@pages/base';

test.describe('Katalog — testy wizualne ARIA', { tag: ['@visual'] }, () => {
  test('weryfikacja ARIA snapshot nagłówka i paska nawigacji', async ({ homePage, header }) => {
    await homePage.open();
    await header.appHeader.waitFor({ state: 'visible' });

    await expect(header.appHeader).toMatchAriaSnapshot();
  });

  test('weryfikacja ARIA snapshot panelu filtrów katalogu', async ({ homePage, filterSidebar }) => {
    await homePage.open();
    await filterSidebar.root.waitFor({ state: 'visible' });

    await expect(filterSidebar.root).toMatchAriaSnapshot();
  });
});
