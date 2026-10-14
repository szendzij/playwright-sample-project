import fs from 'fs';
import path from 'path';

export const LOCK_POLL_INTERVAL_MS = 250;
export const LOCK_MAX_WAIT_MS = 30_000;
export const LOCK_STALE_MS = 60_000;

/**
 * Zapas, o jaki token w cache musi jeszcze żyć, żeby uznać sesję za ważną.
 * Tokeny serwisu mają TTL 300 s (`expires_in: 300`), a pełny przebieg e2e trwa
 * dziesiątki sekund — przy zapasie mniejszym niż czas przebiegu test startuje
 * z tokenem, który umiera w trakcie, i aplikacja przełącza się na widok gościa.
 */
export const SESSION_EXPIRY_MARGIN_S = 120;

interface StorageStateEntry {
  name?: unknown;
  value?: unknown;
}

interface StorageStateOrigin {
  localStorage?: unknown;
}

interface StorageState {
  origins?: unknown;
}

/** Wyciąga token z zapisanego storageState (Playwright). */
function extractAuthToken(parsed: unknown): string | null {
  if (typeof parsed !== 'object' || parsed === null) {
    return null;
  }
  const { origins } = parsed as StorageState;
  if (!Array.isArray(origins)) {
    return null;
  }
  for (const origin of origins) {
    const { localStorage } = (origin ?? {}) as StorageStateOrigin;
    if (!Array.isArray(localStorage)) {
      continue;
    }
    const item = (localStorage as StorageStateEntry[]).find(
      (entry) => entry?.name === 'auth-token' || entry?.name === 'token'
    );
    if (item && typeof item.value === 'string') {
      return item.value;
    }
  }
  return null;
}

/** Dekoduje payload JWT. Zwraca null, gdy token nie jest poprawnym JWT. */
function decodeJwtPayload(token: string): { exp?: number } | null {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  try {
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

/**
 * Sesja jest ważna, jeśli plik istnieje, parsuje się do obiektu,
 * zawiera token i token nie wygasł (z zapasem `SESSION_EXPIRY_MARGIN_S`).
 */
export function isSessionValid(sessionPath: string): boolean {
  try {
    if (!fs.existsSync(sessionPath)) {
      return false;
    }
    const content = fs.readFileSync(sessionPath, 'utf-8').trim();
    if (!content) {
      return false;
    }
    const parsed = JSON.parse(content);
    if (typeof parsed !== 'object' || parsed === null) {
      return false;
    }
    const token = extractAuthToken(parsed);
    if (!token) {
      return false;
    }
    const payload = decodeJwtPayload(token);
    if (!payload) {
      return false;
    }
    return !payload.exp || Date.now() / 1000 < payload.exp - SESSION_EXPIRY_MARGIN_S;
  } catch {
    return false;
  }
}

/**
 * Wykonuje fn() pod file-lockiem. Czeka gdy lock istnieje (max LOCK_MAX_WAIT_MS),
 * a lock starszy niż LOCK_STALE_MS uznaje za osierocony i przejmuje.
 * Po zwolnieniu locka: jeśli sesja już jest ważna, zwraca bez ponownego fn().
 */
export async function withSessionLock(
  lockPath: string,
  sessionPath: string,
  fn: () => Promise<void>
): Promise<void> {
  const startTime = Date.now();
  let waited = false;

  while (fs.existsSync(lockPath)) {
    const ageMs = Date.now() - fs.statSync(lockPath).mtimeMs;
    if (ageMs > LOCK_STALE_MS) {
      // Proces trzymający lock padł — odzyskaj go.
      try {
        fs.unlinkSync(lockPath);
      } catch {
        // ignoruj, ktoś inny mógł już usunąć
      }
      break;
    }
    waited = true;
    if (Date.now() - startTime >= LOCK_MAX_WAIT_MS) {
      throw new Error(`Timeout waiting for lockfile "${lockPath}" after ${LOCK_MAX_WAIT_MS}ms`);
    }
    await new Promise((resolve) => setTimeout(resolve, LOCK_POLL_INTERVAL_MS));
  }

  if (waited && isSessionValid(sessionPath)) {
    return;
  }

  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  fs.writeFileSync(lockPath, String(process.pid));

  try {
    await fn();
  } finally {
    try {
      if (fs.existsSync(lockPath)) {
        fs.unlinkSync(lockPath);
      }
    } catch {
      // ignoruj, jeśli lock już usunięty
    }
  }
}
