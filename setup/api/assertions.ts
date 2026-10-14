import { expect, type APIResponse } from '@playwright/test';

export interface PaginatedProductList {
  data: Array<Record<string, unknown>>;
  current_page?: number;
  total?: number;
  per_page?: number;
}

/**
 * Wspólny kontrakt paginowanej listy produktów: 200, niepusta tablica `data`
 * i pole `current_page`. Dotyczy zarówno `/products`, jak i `/products/search`
 * (oba endpointy zwracają ten sam kształt — zweryfikowane w specach).
 * Zwraca sparsowane ciało, żeby spec mógł doprecyzować asercje dla swojego endpointu.
 */
export async function expectProductListResponse(
  response: APIResponse
): Promise<PaginatedProductList> {
  expect(response.status()).toBe(200);

  const body = (await response.json()) as PaginatedProductList;
  expect(Array.isArray(body.data)).toBe(true);
  expect(body.data.length).toBeGreaterThan(0);
  expect(body).toHaveProperty('current_page');

  return body;
}
