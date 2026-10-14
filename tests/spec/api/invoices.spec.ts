import { test, expect } from '../../../setup/api/fixtures.ts';

test.describe('API Invoices', () => {
  test('retrieve invoice list for logged-in user', async ({ invoiceHelper }) => {
    const response = await invoiceHelper.getInvoicesResponse();

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);

    test.skip(body.data.length === 0, 'konto testowe nie ma faktur do weryfikacji PDF');

    const firstInvoice = body.data[0];
    expect(firstInvoice).toHaveProperty('id');
    expect(firstInvoice).toHaveProperty('invoice_number');

    // Verify PDF status endpoint for existing invoice
    const pdfStatusRes = await invoiceHelper.checkPdfStatusResponse(firstInvoice.id);
    expect([200, 400]).toContain(pdfStatusRes.status());
  });
});
