import { type Locator } from '@playwright/test';
import { BasePage } from '../base-page.ts';
import { ProductCardComponent } from '../components/index.ts';

export class HomePage extends BasePage {
  /**
   * Karty produktów. Kontrakt: `data-test="product-<ULID>"` (testIdAttribute
   * ustawiony w playwright.config.ts), filtrowany po obecności nazwy produktu.
   * Bez klasy CSS `a.card` — zweryfikowane na żywym DOM, że kontrakt wystarcza.
   */
  readonly cardItems: Locator = this.page
    .locator('[data-test^="product-"]')
    .filter({ has: this.page.getByTestId('product-name') });

  async open(options: { waitForProducts?: boolean } = {}): Promise<void> {
    const { waitForProducts = true } = options;
    await this.goto('/');
    if (waitForProducts) {
      await this.waitForLoaded();
    } else {
      await super.waitForLoaded();
    }
  }

  override async waitForLoaded(): Promise<void> {
    await super.waitForLoaded();
    await this.cardItems.first().waitFor({ state: 'visible', timeout: 15000 });
  }

  /**
   * Instancje komponentów kart dla aktualnie wyrenderowanych produktów.
   */
  async getProductCards(): Promise<ProductCardComponent[]> {
    const count = await this.cardItems.count();
    const cards: ProductCardComponent[] = [];
    for (let i = 0; i < count; i++) {
      cards.push(new ProductCardComponent(this.page, this.cardItems.nth(i)));
    }
    return cards;
  }

  /**
   * Pierwsza karta produktu, który nie jest oznaczony jako wyprzedany.
   * Rzuca czytelny błąd, gdy na stronie nie ma ani jednego dostępnego produktu.
   */
  async getFirstInStockCard(): Promise<ProductCardComponent> {
    for (const card of await this.getProductCards()) {
      if (!(await card.isOutOfStock())) {
        return card;
      }
    }
    throw new Error('Brak dostępnego (nie-wyprzedanego) produktu na stronie katalogu');
  }

  async getProductCount(): Promise<number> {
    return await this.cardItems.count();
  }
}
