import { type Locator } from '@playwright/test';
import { BasePage } from '../base-page.ts';

export class ProductDetailsPage extends BasePage {
  readonly productName: Locator = this.page.getByTestId('product-name');
  readonly addToCartButton: Locator = this.page.getByTestId('add-to-cart');
  readonly productContainer: Locator = this.page.locator('app-detail');

  /**
   * Navigates to a specific product details page by its ID, or waits for page load if already navigated.
   */
  async open(productId?: string | number): Promise<void> {
    if (productId !== undefined) {
      await this.goto(`/product/${productId}`);
    }
    await this.waitForLoaded();
  }

  /**
   * Overridden waitForLoaded waiting for product name to be visible.
   */
  override async waitForLoaded(): Promise<void> {
    await super.waitForLoaded();
    await this.productName.waitFor({ state: 'visible', timeout: 15000 });
  }

  async addToCart(): Promise<void> {
    await this.addToCartButton.click();
  }
}
