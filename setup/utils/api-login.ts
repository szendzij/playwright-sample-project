import { request } from '@playwright/test';
import { getUserByRole, type UserRole } from '@data/users';

export const DEFAULT_API_URL = 'https://api.practicesoftwaretesting.com';

/** Zwraca bazowy URL API z env lub domyślny (czytany w czasie wywołania, nie importu). */
export function resolveApiUrl(): string {
  return process.env.API_URL || DEFAULT_API_URL;
}

/**
 * Pobiera token JWT dla roli bezpośrednio z API.
 * Jedno źródło prawdy dla POST /users/login — używane przez fixture'y API i auth-manager.
 */
export async function fetchAccessToken(baseApiUrl: string, role: UserRole): Promise<string> {
  const user = getUserByRole(role);
  const ctx = await request.newContext({ baseURL: baseApiUrl });
  try {
    const res = await ctx.post('/users/login', {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      data: {
        email: user.email,
        password: user.password,
      },
    });
    if (!res.ok()) {
      throw new Error(`Login failed for role "${role}": ${res.status()} ${await res.text()}`);
    }
    const body = await res.json();
    const token = body.access_token as string | undefined;
    if (!token) {
      throw new Error(`Login for role "${role}" returned no access_token.`);
    }
    return token;
  } finally {
    await ctx.dispose();
  }
}
