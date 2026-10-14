import path from 'path';
import { test, expect } from '@pages/base';
import { generateContactMessage } from '@data/test-data';

const fixtureFile = path.resolve(import.meta.dirname, '../../../../data/fixtures/sample-attachment.txt');

test.describe('E2E — Contact', () => {
  test('submit contact form with file attachment', async ({ contactPage }) => {
    const contactMessage = generateContactMessage({
      subject: 'Customer service',
      message: 'This is an automated test message regarding toolshop order inquiry with attachment.',
    });

    await contactPage.open();
    await contactPage.fillForm(contactMessage);
    await contactPage.attachFile(fixtureFile);
    await contactPage.submit();

    await expect(contactPage.successAlert.first()).toHaveText(/\S/, { timeout: 15000 });
  });
});
