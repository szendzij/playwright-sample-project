import { test, expect } from '@pages/base';
import { getUserByRole } from '@data/users';

test.describe('E2E — Authentication: Login', () => {
  test('customer logs in successfully with test credentials', async ({ page, loginPage, header, accountPage }) => {
    const customer = getUserByRole('customer');

    await loginPage.open();
    await loginPage.login(customer.email, customer.password);

    await page.waitForURL(/.*\/account/, { timeout: 15_000 });
    console.log('ACCOUNT PAGE HTML NAVBAR:', await page.locator('nav.navbar').innerHTML());
    console.log('NAV MENU COUNT:', await page.getByTestId('nav-menu').count());
    if (await page.getByTestId('nav-menu').count() > 0) {
      console.log('NAV MENU HTML:', await page.getByTestId('nav-menu').evaluate(el => el.outerHTML));
    }

    await expect(header.userMenu).toBeVisible({ timeout: 15_000 });
    console.log('NAV MENU AFTER VISIBLE:', await header.userMenu.evaluate(el => el.outerHTML));
    console.log('PARENT HTML:', await header.userMenu.locator('..').evaluate(el => el.outerHTML));
    await expect(accountPage.pageTitle).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/.*\/account/, { timeout: 15_000 });
  });

  test('login with invalid password displays error message', async ({ loginPage }) => {
    const customer = getUserByRole('customer');

    await loginPage.open();
    await loginPage.login(customer.email, 'wrong_password_999!');

    await expect(loginPage.loginError).toBeVisible();
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage.length).toBeGreaterThan(0);
  });
});
