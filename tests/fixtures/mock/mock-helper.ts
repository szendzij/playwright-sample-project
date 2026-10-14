import { type Page, type Route } from '@playwright/test';
import emptyProductsData from './data/empty-products.json' with { type: 'json' };
import customProductsData from './data/custom-products.json' with { type: 'json' };

/** Adres listy produktów, opcjonalnie z query stringiem. */
const PRODUCTS_PATTERN = /\/products(\?.*)?$/;

export class ApiMockHelper {
  constructor(private readonly page: Page) {}

  /**
   * Podstawia handler pod żądania listy produktów.
   * Podścieżki, np. `/products/search` lub `/products/:id`, przechodzą do backendu.
   */
  private async routeProductList(handler: (route: Route) => Promise<void>): Promise<void> {
    await this.page.route(PRODUCTS_PATTERN, async (route: Route) => {
      const url = new URL(route.request().url());
      if (url.pathname === '/products') {
        await handler(route);
      } else {
        await route.continue();
      }
    });
  }

  /** Mockuje listę produktów własnymi danymi (domyślnie `data/custom-products.json`). */
  async mockProducts(data: unknown = customProductsData, status = 200): Promise<void> {
    await this.routeProductList((route) => route.fulfill({ status, json: data }));
  }

  /** Mockuje pusty katalog (0 produktów). */
  async mockEmptyProducts(): Promise<void> {
    await this.mockProducts(emptyProductsData);
  }

  /**
   * Demonstruje Playwright `route.fetch()`: pobiera prawdziwą odpowiedź API,
   * wstawia produkt na początek listy i zwraca wzbogacony JSON.
   */
  async interceptAndPrependProduct(fakeProduct: unknown): Promise<void> {
    await this.routeProductList(async (route) => {
      const response = await route.fetch({ method: 'GET' });
      const json = await response.json();

      if (Array.isArray(json.data)) {
        json.data.unshift(fakeProduct);
        json.total = (json.total || 0) + 1;
      }

      await route.fulfill({ response, json });
    });
  }

  /** Mockuje odpowiedź logowania o zadanym statusie HTTP i treści. */
  async mockLoginResponse(status: number, body: unknown): Promise<void> {
    await this.page.route('**/users/login', (route: Route) => route.fulfill({ status, json: body }));
  }

  /** Symuluje awarię sieci (`route.abort()`) na pasujących żądaniach. */
  async abortRequests(
    urlPattern: string | RegExp,
    errorReason: 'failed' | 'aborted' | 'timedout' | 'connectionreset' = 'failed'
  ): Promise<void> {
    await this.page.route(urlPattern, (route: Route) => route.abort(errorReason));
  }

  /** Dodaje sztuczne opóźnienie przed przepuszczeniem żądania (domyślnie: lista produktów). */
  async delayResponse(delayMs = 1500, urlPattern: string | RegExp = PRODUCTS_PATTERN): Promise<void> {
    await this.page.route(urlPattern, async (route: Route) => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await route.continue();
    });
  }

  /**
   * Selektywnie mockuje zapytania/mutacje GraphQL po `operationName`;
   * pozostałe operacje przechodzą do backendu.
   */
  async mockGraphQL(operationName: string, mockData: unknown): Promise<void> {
    await this.page.route('**/graphql', async (route: Route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        const postData = request.postDataJSON();
        if (
          postData?.operationName === operationName ||
          (typeof postData?.query === 'string' && postData.query.includes(operationName))
        ) {
          await route.fulfill({ status: 200, json: mockData });
          return;
        }
      }
      await route.continue();
    });
  }
}
