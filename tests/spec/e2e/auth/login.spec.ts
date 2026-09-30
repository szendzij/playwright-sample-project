import { test, expect } from '@pages/base';
import { getUserByRole } from '@data/users';

test.describe('E2E — Autentykacja: Logowanie', () => {
  test('klient loguje się poprawnie danymi testowymi', async ({ page, loginPage, header, accountPage }) => {
    const customer = getUserByRole('customer');

    await loginPage.open();
    await loginPage.login(customer.email, customer.password);

    await expect(header.userMenu).toBeVisible();
    await expect(accountPage.pageTitle).toBeVisible();
    await expect(page).toHaveURL(/.*\/account/);
  });

  test('logowanie z nieprawidłowym hasłem wyświetla komunikat błędu', async ({ loginPage }) => {
    const customer = getUserByRole('customer');

    await loginPage.open();
    await loginPage.login(customer.email, 'wrong_password_999!');

    await expect(loginPage.loginError).toBeVisible();
    const errorMessage = await loginPage.getErrorMessage();
    expect(errorMessage.length).toBeGreaterThan(0);
  });
});
