import { type Locator, type Page } from '@playwright/test';

/**
 * Base abstract class for all Page Object Models (POM).
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /**
   * Navigates to a path relative to the base URL or absolute URL.
   */
  async goto(path: string = ''): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Waits for the page to be in a loaded state.
   * Can be overridden by subclasses to wait for domain-specific elements.
   */
  async waitForLoaded(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Zwraca przycięty tekst elementu albo '' gdy element nie jest widoczny.
   */
  protected async visibleText(locator: Locator): Promise<string> {
    const first = locator.first();
    if (!(await first.isVisible().catch(() => false))) {
      return '';
    }
    return ((await first.textContent()) ?? '').trim();
  }
}
