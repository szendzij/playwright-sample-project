import { test as base, expect } from '@playwright/test';
import { type UserRole } from '../../data/users.js';
import { ensureAuthenticatedSession } from '../../setup/utils/auth-manager.js';
import { HeaderComponent } from './components/header.component.js';
import { FilterSidebarComponent } from './components/filter-sidebar.component.js';
import { PaginationComponent } from './components/pagination.component.js';

export type UiFixtures = {
  userRole: UserRole;
  header: HeaderComponent;
  filterSidebar: FilterSidebarComponent;
  pagination: PaginationComponent;
};

export const test = base.extend<UiFixtures>({
  userRole: ['guest', { option: true }],

  storageState: async ({ userRole, baseURL }, use) => {
    if (userRole === 'guest') {
      await use(undefined);
      return;
    }

    const sessionPath = await ensureAuthenticatedSession(userRole, baseURL);
    await use(sessionPath || undefined);
  },

  header: async ({ page }, use) => {
    await use(new HeaderComponent(page));
  },

  filterSidebar: async ({ page }, use) => {
    await use(new FilterSidebarComponent(page));
  },

  pagination: async ({ page }, use) => {
    await use(new PaginationComponent(page));
  },
});

export { expect };
export { BasePage } from './base-page.js';
export { BaseComponent } from './base-component.js';
export {
  HeaderComponent,
  FilterSidebarComponent,
  ProductCardComponent,
  PaginationComponent,
} from './components/index.js';
