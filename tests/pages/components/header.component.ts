import { type Locator, type Page } from '@playwright/test';
import { BaseComponent } from '../base-component.ts';

export class HeaderComponent extends BaseComponent {
  readonly searchInput: Locator = this.page.getByTestId('search-query');
  readonly searchButton: Locator = this.page.getByTestId('search-submit');
  readonly cartLink: Locator = this.page.getByTestId('nav-cart');
  readonly userMenu: Locator = this.page.getByTestId('nav-menu');
  readonly appHeader: Locator = this.page.locator('app-header');

  constructor(page: Page, root: Locator = page.locator('nav.navbar').first()) {
    super(page, root);
  }

  /**
   * Enters search query into search input and clicks search submit button.
   */
  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchButton.click();
  }

  /**
   * Clicks on the navigation cart link.
   */
  async openCart(): Promise<void> {
    await this.cartLink.click();
  }
}
