import { type Locator, type Page } from '@playwright/test';
import { BaseComponent } from '../base-component.ts';

export class FilterSidebarComponent extends BaseComponent {
  constructor(
    page: Page,
    root: Locator = page.locator('div[data-test="filters"]').or(page.locator('#filters')).first()
  ) {
    super(page, root);
  }

  /**
   * Returns locator for a brand checkbox by label/name.
   */
  getBrandCheckbox(brand: string): Locator {
    return this.root
      .getByRole('checkbox', { name: brand })
      .or(this.page.getByRole('checkbox', { name: brand }))
      .or(this.root.getByLabel(brand))
      .first();
  }

  async filterByBrand(brand: string): Promise<void> {
    const checkbox = this.getBrandCheckbox(brand);
    await checkbox.check();
  }
}
