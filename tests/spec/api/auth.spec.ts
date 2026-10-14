import { test, expect } from '@setup/api/fixtures';
import { getUserByRole } from '@data/users';
import { generateCustomerData } from '@data/test-data';

test.describe('API Authentication', () => {
  test('user logs in via API with valid credentials', async ({ authHelper }) => {
    const customer = getUserByRole('customer');
    const response = await authHelper.loginResponse({
      email: customer.email,
      password: customer.password,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('access_token');
    expect(typeof body.access_token).toBe('string');
    expect(body.access_token.length).toBeGreaterThan(0);
    expect(body.token_type?.toLowerCase()).toBe('bearer');
  });

  test('login with invalid credentials returns 401 Unauthorized', async ({ authHelper }) => {
    // Celowo NIEISTNIEJĄCE konto: serwis blokuje konto po 3 nieudanych próbach
    // (HTTP 423, „Account locked, too many failed attempts"), a wspólne konto
    // klienta z data/users.ts jest używane przez resztę zestawu. Zweryfikowane
    // sondą: nieistniejące konto zwraca 401 niezależnie od liczby prób.
    const response = await authHelper.loginResponse({
      email: `nonexistent_${Date.now()}@example.com`,
      password: 'InvalidPassword_999!',
    });

    expect(response.status()).toBe(401);
  });

  test('register new customer with unique Faker email', async ({ authHelper }) => {
    const newCustomer = generateCustomerData();

    const response = await authHelper.registerCustomerResponse(newCustomer);
    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body).toHaveProperty('id');
    expect(body.email).toBe(newCustomer.email.toLowerCase());
    expect(body.first_name).toBe(newCustomer.first_name);
  });
});
