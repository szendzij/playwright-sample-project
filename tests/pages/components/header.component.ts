import { type Locator, type Page } from '@playwright/test';
import { BaseComponent } from '../base-component.ts';

/**
 * Górna nawigacja.
 *
 * UWAGA (zweryfikowane na żywym DOM): dzieci tego komponentu NIE są scope'owane
 * do `root`, bo nawigacja renderuje część elementów warunkowo i asynchronicznie
 * (`data-test="nav-cart"` nie istnieje przy pustym koszyku, a pole wyszukiwania
 * katalogu żyje w panelu filtrów, nie tutaj). Scope'owanie groziłoby regresją
 * w login.spec.ts i catalog-aria.spec.ts.
 */
export class HeaderComponent extends BaseComponent {
  readonly cartLink: Locator = this.page.getByTestId('nav-cart');
  readonly userMenu: Locator = this.page.getByTestId('nav-menu');

  constructor(page: Page, root: Locator = page.locator('app-header')) {
    super(page, root);
  }

  /**
   * Otwiera koszyk z górnej nawigacji (link pojawia się po dodaniu produktu).
   */
  async openCart(): Promise<void> {
    await this.cartLink.click();
  }
}
