import { test, expect } from '@pages/base';
import { getUserByRole } from '@data/users';

test.describe('E2E — Authentication: Login', () => {
  test('customer logs in successfully with test credentials', async ({ page, loginPage, header, accountPage }) => {
    const customer = getUserByRole('customer');

    await loginPage.open();
    await loginPage.login(customer.email, customer.password);

    await expect(page).toHaveURL(/.*\/account/, { timeout: 5_000 });
    await expect(header.userMenu).toBeVisible({ timeout: 5_000 });
    await expect(accountPage.pageTitle).toBeVisible({ timeout: 5_000 });
  });

  test('login with invalid credentials displays error message', async ({ loginPage }) => {
    // Celowo NIEISTNIEJĄCE konto: 3 nieudane próby na wspólnym koncie klienta
    // blokują je (HTTP 423) i wysypują pozostałe testy korzystające z tego konta.
    await loginPage.open();
    await loginPage.login(`nonexistent_${Date.now()}@example.com`, 'wrong_password_999!');

    await expect(loginPage.loginError.first()).toHaveText(/\S/);
  });
});
