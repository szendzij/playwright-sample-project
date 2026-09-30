import { test as base, expect } from '@playwright/test';
import { type UserRole } from '../../data/users.js';
import { ensureAuthenticatedSession } from '../../setup/utils/auth-manager.js';
import { HeaderComponent } from './components/header.component.js';
import { FilterSidebarComponent } from './components/filter-sidebar.component.js';
import { PaginationComponent } from './components/pagination.component.js';
import {
  HomePage,
  ProductDetailsPage,
  CartPage,
  CheckoutPage,
  LoginPage,
  RegisterPage,
  AccountPage,
  ContactPage,
  AdminDashboardPage,
} from './pom/index.js';

export type UiFixtures = {
  userRole: UserRole;
  header: HeaderComponent;
  filterSidebar: FilterSidebarComponent;
  pagination: PaginationComponent;
  homePage: HomePage;
  productDetailsPage: ProductDetailsPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  loginPage: LoginPage;
  registerPage: RegisterPage;
  accountPage: AccountPage;
  contactPage: ContactPage;
  adminDashboardPage: AdminDashboardPage;
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

  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  productDetailsPage: async ({ page }, use) => {
    await use(new ProductDetailsPage(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },

  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },

  accountPage: async ({ page }, use) => {
    await use(new AccountPage(page));
  },

  contactPage: async ({ page }, use) => {
    await use(new ContactPage(page));
  },

  adminDashboardPage: async ({ page }, use) => {
    await use(new AdminDashboardPage(page));
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
export {
  HomePage,
  ProductDetailsPage,
  CartPage,
  CheckoutPage,
  LoginPage,
  RegisterPage,
  AccountPage,
  ContactPage,
  AdminDashboardPage,
  type PaymentMethod,
  type ContactFormData,
  type AdminNewProduct,
} from './pom/index.js';
