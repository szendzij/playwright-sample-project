import { test } from '../../../setup/api/fixtures.ts';
import { expectProductListResponse } from '../../../setup/api/assertions.ts';

test.describe('API HTTP QUERY (RFC 10008)', () => {
  test('search products using HTTP QUERY method (RFC 10008)', async ({ apiGuest }) => {
    // Request using HTTP QUERY method (RFC 10008)
    const queryResponse = await apiGuest.fetch('/products', {
      method: 'QUERY',
      data: { query: 'Hammer' },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Wsparcie HTTP QUERY jest weryfikowane bezwarunkowo: sonda na żywym API
    // daje tu 200, więc warunkowy `test.skip` był gałęzią nieosiągalną.
    await expectProductListResponse(queryResponse);
  });
});
