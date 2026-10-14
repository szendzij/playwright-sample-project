import { APIRequestContext, APIResponse } from '@playwright/test';

export class InvoiceHelper {
  constructor(private request: APIRequestContext) {}

  async getInvoicesResponse(): Promise<APIResponse> {
    return await this.request.get('/invoices');
  }

  async checkPdfStatusResponse(invoiceId: string): Promise<APIResponse> {
    return await this.request.get(`/invoices/${invoiceId}/download-pdf-status`);
  }
}
