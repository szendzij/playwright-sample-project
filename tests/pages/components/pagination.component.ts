import { type Locator, type Page } from '@playwright/test';
import { BaseComponent } from '../base-component.ts';

export class PaginationComponent extends BaseComponent {
  constructor(page: Page, root: Locator = page.locator('ul.pagination').first()) {
    super(page, root);
  }
}
