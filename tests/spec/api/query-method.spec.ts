import { test, expect } from '../../../setup/api/fixtures.ts';

test.describe('API HTTP QUERY (RFC 10008)', () => {
  test('search products using HTTP QUERY method (RFC 10008)', async ({ apiGuest }) => {
    // Request using HTTP QUERY method (RFC 10008)
    const queryResponse = await apiGuest.fetch('/products', {
      method: 'QUERY',
      data: { query: 'Hammer' },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Wsparcie HTTP QUERY jest weryfikowane bezwarunkowo: sonda na żywym API
    // daje tu 200, więc warunkowy `test.skip` był gałęzią nieosiągalną.
    expect(queryResponse.status()).toBe(200);

    const body = await queryResponse.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body).toHaveProperty('current_page');
  });

  test('search products falls back to the standard search endpoint', async ({ productHelper }) => {
    const response = await productHelper.searchProductsResponse('Hammer');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body).toHaveProperty('current_page');
  });
});
