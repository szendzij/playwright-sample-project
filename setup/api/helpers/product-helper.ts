import { APIRequestContext, APIResponse } from '@playwright/test';

export class ProductHelper {
  constructor(private request: APIRequestContext) {}

  async getProductsResponse(params?: Record<string, string | number>): Promise<APIResponse> {
    const stringParams: Record<string, string> = {};
    if (params) {
      for (const [key, val] of Object.entries(params)) {
        stringParams[key] = String(val);
      }
    }
    return await this.request.get('/products', {
      params: stringParams,
    });
  }

  async getProductByIdResponse(id: string): Promise<APIResponse> {
    return await this.request.get(`/products/${id}`);
  }

  async searchProductsResponse(query: string): Promise<APIResponse> {
    return await this.request.get('/products/search', {
      params: { q: query },
    });
  }
}
