import { test, expect } from '../../fixtures/mock/mock-test.ts';

test.describe('Mock API — Network Resilience and Error Handling (route.abort & status codes)', () => {
  // Ten sam przebieg UI dla różnych odpowiedzi serwera — parametryzacja zamiast
  // bliźniaczych testów różniących się wyłącznie mockowanym statusem i payloadem.
  const serverErrors = [
    {
      status: 500,
      payload: { message: 'Internal server error occurred. Database unavailable.' },
      case: 'Internal Server Error',
    },
    {
      status: 401,
      payload: { message: 'Invalid credentials or account locked.' },
      case: 'Unauthorized with custom payload',
    },
  ] as const;

  for (const { status, payload, case: caseName } of serverErrors) {
    test(`handles HTTP ${status} ${caseName} during login gracefully`, async ({
      loginPage,
      mockHelper,
    }) => {
      // 1. Mock the login endpoint with the failing response
      await mockHelper.mockLoginResponse(status, payload);

      // 2. Open login page and attempt login
      await loginPage.open();
      await loginPage.login('user@test.com', 'Secret123!');

      // 3. Verify error container is displayed in the UI
      await expect(loginPage.loginError.first()).toHaveText(/\S/);
    });
  }

  test('handles dropped network connection via route.abort(failed)', async ({
    page,
    loginPage,
    mockHelper,
  }) => {
    // 1. Simulate hard network failure for login requests
    await mockHelper.abortRequests('**/users/login');

    // 2. Open login page
    await loginPage.open();

    // 3. Track page errors to ensure the frontend doesn't suffer unhandled crashes
    const pageErrors: Error[] = [];
    page.on('pageerror', (err) => pageErrors.push(err));

    // 4. Attempt login under simulated offline / network failure condition
    await loginPage.login('offline@test.com', 'Password123!');

    // 5. Verify submit button still exists and page remains responsive
    await expect(loginPage.loginSubmitButton).toBeVisible();
    expect(pageErrors).toHaveLength(0);
  });
});

