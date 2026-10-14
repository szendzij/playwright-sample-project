import { type Locator } from '@playwright/test';
import { BasePage } from '../base-page.ts';

export class AccountPage extends BasePage {
  readonly pageTitle: Locator = this.page.getByTestId('page-title');

  /**
   * Navigates to account dashboard.
   */
  async open(): Promise<void> {
    await this.goto('/account');
    await this.waitForLoaded();
  }
}
