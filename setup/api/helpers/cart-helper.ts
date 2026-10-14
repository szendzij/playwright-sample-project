import { APIRequestContext, APIResponse } from '@playwright/test';

export class CartHelper {
  constructor(private request: APIRequestContext) {}

  async createCartResponse(): Promise<APIResponse> {
    return await this.request.post('/carts');
  }

  async addItemToCartResponse(cartId: string, productId: string, quantity = 1): Promise<APIResponse> {
    return await this.request.post(`/carts/${cartId}`, {
      data: {
        product_id: productId,
        quantity,
      },
    });
  }

  async getCartResponse(cartId: string): Promise<APIResponse> {
    return await this.request.get(`/carts/${cartId}`);
  }
}
