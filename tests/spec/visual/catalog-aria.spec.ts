import { test, expect } from '@pages/base';

test.describe('Catalog — ARIA Visual Regression', { tag: ['@visual'] }, () => {
  test('verify ARIA snapshot of header and navigation bar', async ({ homePage, header }) => {
    await homePage.open();
    await header.root.waitFor({ state: 'visible' });

    await expect(header.root).toMatchAriaSnapshot();
  });

  test('verify ARIA snapshot of catalog filter panel', async ({ homePage, filterSidebar }) => {
    await homePage.open();
    await filterSidebar.root.waitFor({ state: 'visible' });

    await expect(filterSidebar.root).toMatchAriaSnapshot();
  });
});
