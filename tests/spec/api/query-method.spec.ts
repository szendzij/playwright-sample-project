import { test, expect } from '../../../setup/api/fixtures.js';

test.describe('API HTTP QUERY (RFC 10008)', () => {
  test('wyszukiwanie produktów z użyciem metody HTTP QUERY (RFC 10008) lub fallbacku search', async ({
    apiGuest,
    productHelper,
  }) => {
    // Zapytanie metodą HTTP QUERY (RFC 10008)
    const queryResponse = await apiGuest.fetch('/products', {
      method: 'QUERY',
      data: { query: 'Hammer' },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (queryResponse.status() === 200) {
      const body = await queryResponse.json();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data.length).toBeGreaterThan(0);
      expect(body).toHaveProperty('current_page');
    } else {
      // Fallback do standardowego endpointu wyszukiwania przy braku wsparcia dla QUERY
      const fallbackResponse = await productHelper.searchProductsResponse('Hammer');
      expect(fallbackResponse.status()).toBe(200);

      const fallbackBody = await fallbackResponse.json();
      expect(Array.isArray(fallbackBody.data)).toBe(true);
      expect(fallbackBody.data.length).toBeGreaterThan(0);
    }
  });
});
