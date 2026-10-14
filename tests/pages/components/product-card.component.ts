import { type Locator, type Page } from '@playwright/test';
import { BaseComponent } from '../base-component.ts';

export class ProductCardComponent extends BaseComponent {
  readonly title: Locator = this.root.getByTestId('product-name');
  readonly price: Locator = this.root.getByTestId('product-price');
  readonly outOfStockBadge: Locator = this.root.getByTestId('out-of-stock');

  constructor(page: Page, root: Locator) {
    super(page, root);
  }

  /**
   * Returns the product name / title text.
   */
  async getName(): Promise<string> {
    const text = await this.title.textContent();
    return text ? text.trim() : '';
  }

  async openDetails(): Promise<void> {
    await this.root.click();
  }

  /**
   * Returns true if the product has an out-of-stock badge displayed.
   */
  async isOutOfStock(): Promise<boolean> {
    return await this.outOfStockBadge.isVisible().catch(() => false);
  }
}
