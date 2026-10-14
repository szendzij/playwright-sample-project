# Instrukcje dla Agentów AI (.agents/agents.md)

Repozytorium: **practice-software-testing-playwright**  
Główny cel: Zestaw testów automatycznych E2E, API, mock oraz wizualnych (Aria snapshot) dla aplikacji *Practice Software Testing (Toolshop)* oparty na Playwright i TypeScript.

---

## 1. Struktura Projektu

- **`tests/spec/`** - Główne specyfikacje testowe:
  - `e2e/` - Testy przepływów użytkownika (auth, catalog, checkout, admin, contact).
  - `api/` - Testy warstwy REST / GraphQL API.
  - `mock/` - Testy z mockowaniem sieci (`page.route()`, manipulacja odpowiedziami i opóźnieniami).
  - `visual/` - Testy wizualne i dostępności oparte na `toMatchAriaSnapshot`.
- **`tests/pages/`** - Klasy Page Object Model (POM) enkapsulujące lokatory i akcje dla stron.
- **`setup/`** - Fixtures i konfiguracja wstępna (np. autentykacja, custom fixtures).
- **`data/`** - Dane testowe, stałe oraz mock payloads.
- **`env/`** - Pliki środowiskowe (`.env.prod`, `.env.example`).
- **`snapshots/`** - Przechowywane migawki wizualne / aria snapshots.

---

## 2. Kluczowe Komendy

```bash
# Uruchomienie wszystkich testów
npm run test:all

# Uruchamianie wg projektów
npm run test:e2e       # tylko testy E2E
npm run test:api       # tylko testy API
npm run test:mock      # tylko testy z mockami
npm run test:visual    # testy wizualne (@visual)

# Aktualizacja snapshotów
npm run test:visual:update_snapshot

# Linter i raporty
npm run lint
npm run report
```

---

## 3. Standardy i Konwencje Kodu

1. **Selektory:**
   - Domyślny atrybut testowy to `data-test` (`testIdAttribute: 'data-test'`).
   - Preferuj `page.getByTestId(...)` oraz selektory semantyczne/dostępności (`getByRole`, `getByLabel`, `getByText`).
   - Unikaj niestabilnych selektorów XPath lub głęboko zagnieżdżonych selektorów CSS bazujących na klasach stylowych.

2. **Czekanie i Asynchroniczność:**
   - **Nigdy nie używaj sztywnych waitów (`page.waitForTimeout`)**, chyba że testujesz zachowanie sieciowe przy specyficznym opóźnieniu (np. w katalogu `mock/network-delay`).
   - Polegaj na automatycznym oczekiwaniu Playwright (auto-waiting) oraz assercjach `expect(locator).toBeVisible()`, `toPass()`, etc.

3. **Page Object Model (POM):**
   - Logikę selektorów i interakcji z UI umieszczaj w klasach w `tests/pages/`.
   - Pliki specyfikacji (`*.spec.ts`) powinny skupiać się na scenariuszu testowym i asercjach biznesowych.

4. **Izolacja Testów:**
   - Testy działają w trybie `fullyParallel: true`. Każdy test musi być niezależny i samowystarczalny.
   - Do generowania unikalnych danych użytkowników i produktów używaj biblioteki `@faker-js/faker`.

---

## 4. Wytyczne dla Agenta

- **Dokumentacja bibliotek**: W razie pytań o składnię lub nowości Playwright, sprawdzaj aktualną dokumentację narzędziem `ctx7` (`npx ctx7@latest`).
- **Weryfikacja**: Po wprowadzeniu zmian w testach uruchom odpowiedni zestaw (np. `npx playwright test tests/spec/...`) przed zakończeniem zadania.
- **Git**: Commity, staging i odczyty gita wykonuj automatycznie; **nigdy nie wykonuj `git push`** bez bezpośredniej prośby użytkownika.

---

## 5. Dyscyplina weryfikacji

Obowiązuje w każdym zadaniu zmieniającym kod. Pełna reguła:
`.agents/rules/local-verification-discipline.md`.

- **Baseline przed, bramki po.** Uruchom i zapisz realne wyjście każdej bramki PRZED
  pierwszą zmianą — z istniejącymi porażkami włącznie. Bramka zepsuta już wcześniej jest
  raportowana jako stan zastany, nigdy jako „zweryfikowana".
- **`npx tsc --noEmit` na całym projekcie jest jedynym wiarygodnym type-checkiem.**
  Narzędzie edycyjne pomija type-check per plik przy wykrytym `tsconfig.json` (nie
  rozwiąże aliasów ani globali) — brak błędu przy edycji pojedynczego pliku NIE jest
  zaliczoną bramką.
- **Każdy projekt testowy osobno**: `toolshop-api`, `toolshop-mock`, `toolshop-e2e`.
  Jedna zagregowana liczba ukrywa, który projekt się zepsuł.
- **Bramka czerwona w baseline i zielona po zmianie była flaky** — powiedz to wprost,
  nie przypisuj sobie naprawy. Dotyczy to m.in. `tests/spec/mock/intercept-modify.spec.ts`,
  który uderza do prawdziwego, zdalnego API.
- **Nie osłabiaj asercji, żeby zadowolić linter.** Pusta asercja jest gorsza niż czerwona
  bramka. Zanim wyłączysz regułę, sprawdź jej schemat — często ma opcję na znany
  fałszywy traf frameworka.
- **Liczby lintera licz per obszar** i wykluczaj `.agents/` (196 plików `.js`
  wendorowanego toolingu generuje ponad 2700 problemów i zagłusza wszystko inne).

---

## 6. Upraszczanie kodu (KISS)

Gdy zadanie brzmi „uprość katalog X", „co tu można uprościć" albo „lecimy z KISS":

- **Skill**: `.agents/skills/codebase-simplification/SKILL.md` — procedura, pułapki,
  pliki wsparcia (playbook z realnymi przebiegami, recepty bramek).
- **Komenda**: `.agents/workflows/simplify-area.md` — pełny przebieg od baseline do raportu.
- **Narzędzie**: `.agents/scripts/local/find-dead-members.py` — analiza osiągalności
  (raport domyślnie, `--rewrite` usuwa z ochroną kotwic).

Zasada nadrzędna: **kompilator jest orakulum**. Jeśli po usunięciu składowej projekt się
kompiluje, nic jej nie referencjonowało. Usuwanie martwego kodu w osobnym commicie od
zmian strukturalnych; duże cięcie publicznego/demonstracyjnego API to decyzja użytkownika,
nie rutyna.
