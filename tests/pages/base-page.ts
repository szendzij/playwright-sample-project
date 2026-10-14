import { type Locator, type Page } from '@playwright/test';

/**
 * Bazowa klasa abstrakcyjna dla wszystkich Page Object Models (POM).
 *
 * Konwencje (Playwright docs: /docs/pom oraz /docs/best-practices):
 * - Lokatory są polami `readonly` inicjalizowanymi z `this.page` / `this.root`.
 * - Priorytet selektorów: test id -> rola -> tekst -> CSS (CSS tylko z komentarzem).
 * - Asercje NIE mieszkają w POM; POM udostępnia lokatory, test wykonuje `expect`.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /**
   * Nawigacja do ścieżki względnej wobec baseURL. `protected`, bo publicznym
   * punktem wejścia każdego POM jest `open()`.
   */
  protected async goto(path: string = ''): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Czeka na podstawowy stan załadowania dokumentu. Klasy pochodne nadpisują tę
   * metodę, aby dodatkowo poczekać na własne landmarki.
   * Czekanie MUSI być twarde (bez `.catch(() => {})`) — połknięty timeout
   * przesuwa porażkę testu w losowe, trudne do zdiagnozowania miejsce.
   */
  async waitForLoaded(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Czeka na widoczność lokatora i zwraca, czy element się pojawił.
   * Używaj WYŁĄCZNIE dla elementów naprawdę opcjonalnych (np. zwijane menu),
   * nigdy dla elementów, na których test robi asercję.
   */
  protected async tryWaitForVisible(locator: Locator, timeout = 5000): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }
}

