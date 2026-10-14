import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { type UserRole } from '@data/users';
import { isSessionValid, withSessionLock } from './lock-helper.ts';
import { fetchAccessToken, resolveApiUrl } from './api-login.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '../..');
const authDir = path.resolve(projectRoot, 'setup/session-storage/.auth');

function getAuthDir(): string {
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  return authDir;
}

function getSessionPath(role: UserRole): string {
  return path.join(getAuthDir(), `${role}.json`);
}

function getLockPath(role: UserRole): string {
  return path.join(getAuthDir(), `${role}.lock`);
}

/**
 * Zapewnia zapisany stan sesji (storageState) dla danej roli.
 * Loguje się przez API i zapisuje token w localStorage, z pominięciem
 * UI-owych wyzwań Cloudflare i bez uruchamiania dodatkowej przeglądarki.
 * Zwraca ścieżkę do pliku storageState lub null dla roli 'guest'.
 */
export async function ensureAuthenticatedSession(
  role: UserRole,
  baseURL?: string
): Promise<string | null> {
  if (role === 'guest') {
    return null;
  }

  const sessionPath = getSessionPath(role);
  const lockPath = getLockPath(role);

  if (isSessionValid(sessionPath)) {
    return sessionPath;
  }

  await withSessionLock(lockPath, sessionPath, async () => {
    const webOrigin = (baseURL || process.env.BASE_URL || 'https://practicesoftwaretesting.com').replace(
      /\/+$/,
      ''
    );
    const token = await fetchAccessToken(resolveApiUrl(), role);

    const storageState = {
      cookies: [],
      origins: [
        {
          origin: webOrigin,
          localStorage: [
            {
              name: 'auth-token',
              value: token,
            },
          ],
        },
      ],
    };

    const tmpPath = `${sessionPath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(storageState, null, 2), 'utf-8');
    fs.renameSync(tmpPath, sessionPath);
  });

  return sessionPath;
}
