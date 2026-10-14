import { test as base, expect, request, type APIRequestContext } from '@playwright/test';
import { resolveApiUrl, fetchAccessToken } from '../utils/api-login.ts';
import { AuthHelper } from './helpers/auth-helper.ts';
import { ProductHelper } from './helpers/product-helper.ts';
import { CartHelper } from './helpers/cart-helper.ts';
import { InvoiceHelper } from './helpers/invoice-helper.ts';

export type ApiWorkerFixtures = {
  tokenCache: Map<string, string>;
};

export type ApiTestFixtures = {
  apiAs: (role: 'admin' | 'customer') => Promise<APIRequestContext>;
  apiGuest: APIRequestContext;
  authHelper: AuthHelper;
  productHelper: ProductHelper;
  cartHelper: CartHelper;
  invoiceHelper: InvoiceHelper;
};

export const test = base.extend<ApiTestFixtures, ApiWorkerFixtures>({
  tokenCache: [
    async ({}, use) => {
      await use(new Map<string, string>());
    },
    { scope: 'worker' },
  ],

  apiAs: async ({ tokenCache }, use) => {
    const contexts: APIRequestContext[] = [];

    const factory = async (role: 'admin' | 'customer'): Promise<APIRequestContext> => {
      let token = tokenCache.get(role);
      if (!token) {
        token = await fetchAccessToken(resolveApiUrl(), role);
        tokenCache.set(role, token);
      }

      const authCtx = await request.newContext({
        baseURL: resolveApiUrl(),
        extraHTTPHeaders: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });
      contexts.push(authCtx);
      return authCtx;
    };

    await use(factory);

    for (const ctx of contexts) {
      await ctx.dispose();
    }
  },

  apiGuest: async ({}, use) => {
    const ctx = await request.newContext({
      baseURL: resolveApiUrl(),
      extraHTTPHeaders: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    await use(ctx);
    await ctx.dispose();
  },

  authHelper: async ({ apiGuest }, use) => {
    await use(new AuthHelper(apiGuest));
  },

  productHelper: async ({ apiGuest }, use) => {
    await use(new ProductHelper(apiGuest));
  },

  cartHelper: async ({ apiGuest }, use) => {
    await use(new CartHelper(apiGuest));
  },

  invoiceHelper: async ({ apiAs }, use) => {
    const adminApi = await apiAs('admin');
    await use(new InvoiceHelper(adminApi));
  },
});

export { expect, request, type APIRequestContext };
