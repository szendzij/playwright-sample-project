import { type Locator } from '@playwright/test';
import { BasePage } from '../base-page.ts';

export class LoginPage extends BasePage {
  readonly emailInput: Locator = this.page.getByTestId('email');
  readonly passwordInput: Locator = this.page.getByTestId('password');
  readonly loginSubmitButton: Locator = this.page.getByTestId('login-submit');
  readonly loginError: Locator = this.page
    .getByTestId('login-error')
    .or(this.page.locator('.alert-danger, [data-test="login-error"]'));

  /**
   * Navigates to login page.
   */
  async open(): Promise<void> {
    await this.goto('/auth/login');
    await this.waitForLoaded();
  }

  /**
   * Fills credentials and clicks login submit button.
   */
  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginSubmitButton.click();
  }
}
