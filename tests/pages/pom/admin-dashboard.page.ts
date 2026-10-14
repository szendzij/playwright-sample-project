import { type Locator } from '@playwright/test';
import { BasePage } from '../base-page.ts';

export interface AdminNewProduct {
  name: string;
  price: number;
  description: string;
  stock: number;
  category: string;
  brand: string;
}

export class AdminDashboardPage extends BasePage {
  readonly navProducts: Locator = this.page.getByTestId('nav-admin-products');
  readonly addProductButton: Locator = this.page
    .getByTestId('product-add')
    .or(this.page.locator('a[href*="/admin/products/add"], [data-test="page-title"] + a'));
  readonly productsTableRows: Locator = this.page.locator('table tbody tr');

  /**
   * Navigates to admin dashboard.
   */
  async open(): Promise<void> {
    await this.goto('/admin/dashboard');
    await this.waitForLoaded();
  }

  /**
   * Navigates to Products management view.
   */
  async openProducts(): Promise<void> {
    if (!(await this.navProducts.isVisible())) {
      await this.page.getByTestId('nav-menu').click();
      await this.tryWaitForVisible(this.navProducts, 5000);
    }
    if (await this.navProducts.isVisible()) {
      await this.navProducts.click();
    } else {
      await this.goto('/admin/products');
    }
    await this.productsTableRows.first().waitFor({ state: 'visible', timeout: 10000 });
  }

  async getProductsCount(): Promise<number> {
    return await this.productsTableRows.count();
  }
}
