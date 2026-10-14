import { type Locator } from '@playwright/test';
import { BasePage } from '../base-page.ts';

export class CartPage extends BasePage {
  readonly proceed1Button: Locator = this.page.getByTestId('proceed-1');
  readonly itemRows: Locator = this.page.locator('table tbody tr');

  /**
   * Navigates to the cart/checkout page.
   */
  async open(): Promise<void> {
    await this.goto('/checkout');
    await this.waitForLoaded();
  }

  /**
   * Returns the count of items currently in the cart table.
   */
  async getItemCount(): Promise<number> {
    return await this.itemRows.count();
  }

  async proceedToStep2(): Promise<void> {
    await this.proceed1Button.click();
  }
}
