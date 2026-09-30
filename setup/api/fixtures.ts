import { test as base, expect, request, type APIRequestContext } from '@playwright/test';
import { getUserByRole } from '../../data/users.js';
import { AuthHelper } from './helpers/auth-helper.js';
import { ProductHelper } from './helpers/product-helper.js';
import { CartHelper } from './helpers/cart-helper.js';
import { InvoiceHelper } from './helpers/invoice-helper.js';

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
      const cache = new Map<string, string>();
      await use(cache);
    },
    { scope: 'worker' },
  ],

  apiAs: async ({ baseURL, tokenCache }, use) => {
    const contexts: APIRequestContext[] = [];
    const baseApiUrl = process.env.API_URL || baseURL || 'https://api.practicesoftwaretesting.com';

    const factory = async (role: 'admin' | 'customer'): Promise<APIRequestContext> => {
      let token = tokenCache.get(role);
      if (!token) {
        const user = getUserByRole(role);
        const loginCtx = await request.newContext({ baseURL: baseApiUrl });
        try {
          const res = await loginCtx.post('/users/login', {
            data: {
              email: user.email,
              password: user.password,
            },
          });
          if (!res.ok()) {
            throw new Error(`Login failed for role "${role}": ${res.status()} ${await res.text()}`);
          }
          const data = await res.json();
          token = data.access_token as string;
          tokenCache.set(role, token);
        } finally {
          await loginCtx.dispose();
        }
      }

      const authCtx = await request.newContext({
        baseURL: baseApiUrl,
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

  apiGuest: async ({ baseURL }, use) => {
    const baseApiUrl = process.env.API_URL || baseURL || 'https://api.practicesoftwaretesting.com';
    const ctx = await request.newContext({
      baseURL: baseApiUrl,
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

  invoiceHelper: async ({ apiGuest }, use) => {
    await use(new InvoiceHelper(apiGuest));
  },
});

export { expect, request, type APIRequestContext };
export { AuthHelper } from './helpers/auth-helper.js';
export { ProductHelper } from './helpers/product-helper.js';
export { CartHelper } from './helpers/cart-helper.js';
export { InvoiceHelper } from './helpers/invoice-helper.js';
