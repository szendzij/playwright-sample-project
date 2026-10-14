# Bramki weryfikacji w tym repo

Build jest dowodem. Poniżej konkretne recepty dla tego projektu oraz przypadki, które
wprowadzają w błąd najczęściej — bo bramka nieuruchomiona bywa opisywana jako „zielona".

## 1. Które bramki, w jakiej kolejności

1. **Type-check**: `npx tsc --noEmit` — brak wyjścia, exit 0.
   To DOKŁADNE orakulum „czy cokolwiek jeszcze to referencjonuje": usunięcie, które się
   kompiluje, jest usunięciem, którego nic nie używało. Uruchamiaj po każdym przepisaniu.
2. **Lint, zawężony do dotkniętego obszaru**: `npx eslint <obszar>` — musi być czysty,
   nawet jeśli reszta repo nie jest.
3. **Każdy projekt testowy OSOBNO, z własną oczekiwaną liczbą**:

   ```bash
   npx playwright test --project=toolshop-api    # REST/GraphQL
   npx playwright test --project=toolshop-mock   # mockowanie sieci
   npx playwright test --project=toolshop-e2e    # e2e + wizualne (aria snapshots)
   ```

   Jedna zagregowana liczba ukrywa, który projekt się zepsuł.

Zapisz wszystkie trzy PRZED pierwszą zmianą, z istniejącymi porażkami włącznie.

### Stan zastany (baseline) na koniec października 2026

| Bramka | Wynik |
|---|---|
| `npx tsc --noEmit` | exit 0, brak wyjścia |
| `npx eslint .` | 0 problemów (adoptowany w trakcie prac) |
| `toolshop-api` | 9 passed |
| `toolshop-mock` | 8 passed |
| `toolshop-e2e` | 11 passed |

Liczby są punktem odniesienia, nie celem — `toolshop-api` wahał się w obie strony:
9 → 10 przy rozbiciu jednego testu z warunkową asercją na dwa bezwarunkowe, a potem
10 → 9 po usunięciu testu powtarzającego pokrycie z `products.spec.ts`.

## 2. Test, który padł w baseline a potem przechodzi

Był flaky. Zgłoś go jako flaky, nie przedstawiaj jako naprawy i nie pozwól mu schować
prawdziwej regresji za tą samą liczbą.

Potwierdzony przypadek w tym repo: `tests/spec/mock/intercept-modify.spec.ts`
(„intercepts live products response and prepends an exclusive promo product") wykonuje
`route.fetch()` do PRAWDZIWEGO, zdalnego API i asertuje, że wstrzyknięty produkt wyląduje
pierwszy na liście. Przy słabej sieci przebieg potrafi zająć 30+ s i oblać się, a powtórka
dać `8 passed`. Odpowiedź na porażkę tej bramki to powtórka, nie „naprawa".

## 3. Liczba na całym repo jest zdominowana przez drzewo wendorowane

`.agents/` (196 plików `.js` z cudzym toolingiem) generuje ponad 2700 problemów lintera
i zagłusza wszystkie istotne. Raportuj liczby PER OBSZAR i wymień zastosowane wykluczenia
w `eslint.config.js`:

```js
{ ignores: ['node_modules/**', '.agents/**', 'test-results/**',
            'playwright-report/**', 'blob-report/**', '.hermes/**'] }
```

Ten config już istnieje w repo — nie dodawaj drugiego.

## 4. ESLint 9 flat config

Konfiguracja jest w `eslint.config.js` (repo ma `"type": "module"`). Fakty, których
poznanie kosztowało czas:

- **Sondowanie kluczy flat-config pluginu zamiast zgadywania**:

  ```bash
  node -e "import('eslint-plugin-playwright').then(m=>console.log(Object.keys(m.default.configs)))"
  # -> [ 'flat/recommended', 'playwright-test', 'recommended' ]
  ```

  Rozłóż klucz flat ZANIM ustawisz `files`, ale gdy nadpisujesz reguły, powtórz
  `files` PO rozłożeniu, żeby twój zakres wygrał.

- **Sondowanie opcji reguły przed wyborem strategii**:

  ```bash
  node -e "import('eslint-plugin-playwright').then(m=>{const r=m.default.rules;\
  console.log('no-skipped-test:',JSON.stringify(r['no-skipped-test'].meta.schema));\
  console.log('no-conditional-in-test:',JSON.stringify(r['no-conditional-in-test'].meta.schema))})"
  ```

  Wynik: `no-skipped-test` MA opcję `allowConditional`, `no-conditional-in-test` NIE ma
  żadnej. Bez tego sprawdzenia zakłada się opcje, których nie ma, albo sięga po
  wyłączenie całej reguły.

- **Pinuj pakiety configów do zainstalowanego majora ESLint.** `@eslint/js@latest` idzie
  za majorem ESLint i obok starszego `eslint` kończy się `ERESOLVE`. Tu jest przypięte
  `@eslint/js@^9` przy `eslint@9.39.5`.

- **Frameworkowy idiom może potykać regułę core.** Fixture bez zależności pisze się
  `async ({}, use) => {}`, czyli pusta destrukturyzacja. Ustaw opcję reguły
  `no-empty-pattern: ['error', { allowObjectPatternsAsParameters: true }]`
  (`allowObjectPatternsAsParameters`, nie `...AsProperties`), zamiast przepisywać idiom.
  Wyciszenie znanego fałszywego trafu to nie to samo co wyłączenie reguły.

- **Warunkowe `test.skip(warunek, powód)`** to idiomatyczny sposób pomijania testu
  zależnego od środowiska (brak wsparcia backendu dla HTTP QUERY) albo od danych konta.
  Włączone w `eslint.config.js` przez `allowConditional: true`; statyczne `.skip`/`.fixme`
  nadal są błędem.

- **Policz, zanim twierdzisz, że jest zero.** „0 problemów" dla bramki, która nigdy nie
  działała, to najczęstsze fałszywe twierdzenie. Uruchom ją, podaj
  `N problemów (E errors, W warnings)` w rozbiciu na obszar i regułę, i pozwól
  użytkownikowi wybrać politykę.

## 5. Wywołania frameworka, które już robią to samo

Przycinając argumenty sprawdź, czy framework ustawia go sam. W Playwright
`route.fulfill({ json })` ustawia `Content-Type: application/json`, więc `contentType`
obok niego jest redundantny — a dowodem jest suite, dlatego po „kosmetycznym" przycięciu
uruchom testy ponownie.

## 6. Bramka, która w tym repo jest świadomie pomijana

Narzędzie do edycji plików uruchamia type-check per plik, ale przy wykrytym
`tsconfig.json` robi to celowo pomija z komunikatem:

> Project tsconfig.json detected — per-file tsc skipped (single-file tsc can't resolve
> project aliases/globals; use the LSP tier or `tsc -p tsconfig.json` for real diagnostics).

Wniosek: **jedynym wiarygodnym type-checkiem jest `npx tsc --noEmit` na całym projekcie.**
Nie traktuj braku błędu przy edycji pojedynczego pliku jako zaliczonej bramki.

## 7. Fixtury, które widzi tylko framework

Fixtury testowe referencjonowane po NAZWIE (`storageState`, `page`, `context`, `userRole`),
klucze rejestracji w DI i każde wyszukiwanie po stringu są nieosiągalne dla analizy
statycznej i pozostają żywe w runtime. Ich usunięcie kompiluje się czysto i wywala się
dopiero w czasie wykonania — jedyny tryb porażki, którego żadna bramka z tej listy nie
złapie. Dodawaj takie nazwy do `--keep` analizatora.
