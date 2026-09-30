import { type Locator, type Page } from '@playwright/test';
import { BasePage } from '../base-page.js';
import { type CustomerData } from '../../../data/test-data.js';

export class RegisterPage extends BasePage {
  readonly firstNameInput: Locator = this.page.getByTestId('first-name');
  readonly lastNameInput: Locator = this.page.getByTestId('last-name');
  readonly dobInput: Locator = this.page.getByTestId('dob');
  readonly addressInput: Locator = this.page.getByTestId('address');
  readonly postcodeInput: Locator = this.page.getByTestId('postcode');
  readonly cityInput: Locator = this.page.getByTestId('city');
  readonly stateInput: Locator = this.page.getByTestId('state');
  readonly countrySelect: Locator = this.page.getByTestId('country');
  readonly phoneInput: Locator = this.page.getByTestId('phone');
  readonly emailInput: Locator = this.page.getByTestId('email');
  readonly passwordInput: Locator = this.page.getByTestId('password');
  readonly registerSubmitButton: Locator = this.page.getByTestId('register-submit');
  readonly registerError: Locator = this.page
    .getByTestId('register-error')
    .or(this.page.locator('.alert-danger, [data-test="register-error"]'));

  constructor(page: Page) {
    super(page);
  }

  /**
   * Navigates to registration page.
   */
  async open(): Promise<void> {
    await this.goto('/auth/register');
    await this.waitForLoaded();
  }

  /**
   * Fills all registration form inputs with customer data and clicks register submit button.
   */
  async register(
    customerData: CustomerData | (Partial<CustomerData> & { firstName?: string; lastName?: string })
  ): Promise<void> {
    const firstName = (customerData as any).firstName || customerData.first_name || '';
    const lastName = (customerData as any).lastName || customerData.last_name || '';

    if (firstName) {
      await this.firstNameInput.fill(firstName);
    }
    if (lastName) {
      await this.lastNameInput.fill(lastName);
    }
    if (customerData.dob) {
      await this.dobInput.fill(customerData.dob);
    }
    if (customerData.address) {
      await this.addressInput.fill(customerData.address);
    }
    if (customerData.postcode) {
      await this.postcodeInput.fill(customerData.postcode);
    }
    if (customerData.city) {
      await this.cityInput.fill(customerData.city);
    }
    if (customerData.state) {
      await this.stateInput.fill(customerData.state);
    }
    if (customerData.country) {
      try {
        await this.countrySelect.selectOption({ label: customerData.country });
      } catch {
        await this.countrySelect.selectOption({ value: customerData.country });
      }
    }
    if (customerData.phone) {
      await this.phoneInput.fill(customerData.phone);
    }
    if (customerData.email) {
      await this.emailInput.fill(customerData.email);
    }
    if (customerData.password) {
      await this.passwordInput.fill(customerData.password);
    }

    await this.registerSubmitButton.click();
  }

  /**
   * Returns error message text if registration failed.
   */
  async getErrorMessage(): Promise<string> {
    const isVisible = await this.registerError.first().isVisible().catch(() => false);
    if (!isVisible) {
      return '';
    }
    const text = await this.registerError.first().textContent();
    return text ? text.trim() : '';
  }
}
