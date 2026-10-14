import { test, expect } from '@setup/api/fixtures';
import { expectProductListResponse } from '@setup/api/assertions';

test.describe('API Products', () => {
  test('retrieve product list with pagination', async ({ productHelper }) => {
    const response = await productHelper.getProductsResponse({ page: 1 });
    const body = await expectProductListResponse(response);
    expect(body.current_page).toBe(1);
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('per_page');

    const firstProduct = body.data[0];
    expect(firstProduct).toHaveProperty('id');
    expect(firstProduct).toHaveProperty('name');
    expect(firstProduct).toHaveProperty('price');
  });

  test('search product by phrase Drill', async ({ productHelper }) => {
    const query = 'Drill';
    const response = await productHelper.searchProductsResponse(query);
    const body = await expectProductListResponse(response);

    const matchFound = body.data.some((product) =>
      String(product.name ?? '').toLowerCase().includes(query.toLowerCase()) ||
      String(product.description ?? '').toLowerCase().includes(query.toLowerCase())
    );
    expect(matchFound).toBe(true);
  });
});
