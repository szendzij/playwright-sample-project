import { type Locator, type Page } from '@playwright/test';
import { BaseComponent } from '../base-component.ts';

/**
 * Panel filtrów katalogu (kolumna boczna) wraz z polem wyszukiwania.
 * Zweryfikowane na żywym DOM: pole wyszukiwania (`search-query`) jest wewnątrz
 * tego panelu, dlatego `search()` należy tutaj, a nie do headera.
 */
export class FilterSidebarComponent extends BaseComponent {
  /** Pole wyszukiwania katalogu. */
  readonly searchInput: Locator = this.root.getByTestId('search-query');
  /** Przycisk „Search". */
  readonly searchButton: Locator = this.root.getByTestId('search-submit');
  /** Przycisk „X" czyszczący zapytanie. */
  readonly searchResetButton: Locator = this.root.getByTestId('search-reset');

  constructor(page: Page, root: Locator = page.locator('div[data-test="filters"]')) {
    super(page, root);
  }

  /**
   * Wpisuje zapytanie i klika „Search".
   */
  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await this.searchButton.click();
  }

  /**
   * Checkbox marki, scope'owany do panelu filtrów.
   * Dostępna nazwa pochodzi z owijającego `<label>` (zweryfikowane:
   * `label="ForgeFlex Tools"`, `label="MightyCraft Hardware"`).
   */
  getBrandCheckbox(brand: string): Locator {
    return this.root.getByRole('checkbox', { name: brand }).first();
  }

  async filterByBrand(brand: string): Promise<void> {
    await this.getBrandCheckbox(brand).check();
  }
}
