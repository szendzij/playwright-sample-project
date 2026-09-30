import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from '@playwright/test';
import { getUserByRole, type UserRole } from '@data/users';
import { isSessionValid, withSessionLock } from './lock-helper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '../..');
const authDir = path.resolve(projectRoot, 'setup/session-storage/.auth');

export function getAuthDir(): string {
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }
  return authDir;
}

export function getSessionPath(role: UserRole): string {
  return path.join(getAuthDir(), `${role}.json`);
}

export function getLockPath(role: UserRole): string {
  return path.join(getAuthDir(), `${role}.lock`);
}

/**
 * Ensures an authenticated storage state exists for the given user role.
 * Returns the path to the storage state file, or null if role is 'guest'.
 */
export async function ensureAuthenticatedSession(
  role: UserRole,
  baseURL?: string
): Promise<string | null> {
  if (role === 'guest') {
    return null;
  }

  const dir = getAuthDir();
  const sessionPath = path.join(dir, `${role}.json`);
  const lockPath = path.join(dir, `${role}.lock`);

  if (isSessionValid(sessionPath)) {
    return sessionPath;
  }

  const user = getUserByRole(role);

  await withSessionLock(lockPath, sessionPath, async () => {
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext();
      const page = await context.newPage();

      const base = (baseURL || process.env.BASE_URL || 'https://practicesoftwaretesting.com').replace(/\/+$/, '');
      const loginUrl = `${base}/auth/login`;

      await page.goto(loginUrl);

      await page.locator('[data-test="email"]').fill(user.email);
      await page.locator('[data-test="password"]').fill(user.password);
      await page.locator('[data-test="login-submit"]').click();

      const waitForUrl = page
        .waitForURL((url) => !url.href.includes('/auth/login'), { timeout: 15_000 })
        .catch((err) => ({ error: err }));
      const waitForMenu = page
        .locator('[data-test="nav-menu"]')
        .waitFor({ state: 'visible', timeout: 15_000 })
        .catch((err) => ({ error: err }));

      const firstResult = await Promise.race([waitForUrl, waitForMenu]);
      if (firstResult && 'error' in firstResult) {
        const results = await Promise.all([waitForUrl, waitForMenu]);
        const allFailed = results.every((r) => r && 'error' in r);
        if (allFailed) {
          throw new Error(
            `Authentication failed for role "${role}": neither URL redirect nor nav-menu appeared within 15000ms.`
          );
        }
      }

      const tmpPath = `${sessionPath}.tmp`;
      await context.storageState({ path: tmpPath });
      fs.renameSync(tmpPath, sessionPath);
    } finally {
      await browser.close();
    }
  });

  return sessionPath;
}
