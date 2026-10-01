import { test as baseTest, expect } from '../../pages/base.js';
import { ApiMockHelper } from './mock-helper.js';

export type MockTestFixtures = {
  mockHelper: ApiMockHelper;
};

export const test = baseTest.extend<MockTestFixtures>({
  mockHelper: async ({ page }, use) => {
    const helper = new ApiMockHelper(page);
    await use(helper);
  },
});

export { expect };
