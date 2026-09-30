import { test, expect } from '@pages/base';
import { generateCustomerData } from '@data/test-data';

test.describe('E2E — Autentykacja: Rejestracja', () => {
  test('nowy użytkownik może się zarejestrować z dynamicznymi danymi Faker', async ({
    page,
    registerPage,
  }) => {
    const newCustomer = generateCustomerData();

    await registerPage.open();
    await registerPage.register(newCustomer);

    // After successful registration, user should be redirected to login page
    await expect(page).toHaveURL(/.*\/auth\/login/, { timeout: 15000 });
  });
});
