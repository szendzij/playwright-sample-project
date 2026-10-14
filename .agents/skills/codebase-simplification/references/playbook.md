# Playbook: jak przebiega upraszczanie (na realnych obszarach tego repo)

Konkretny, powtarzalny przebieg. Liczby są zmierzone, nie szacowane — mogą służyć jako
wzorzec tego, co da się wycisnąć z podobnej warstwy.

## Kolejność działań

```
0. Baseline        -> zapisz realny stan wszystkich bramek (istniejące porażki włącznie)
1. Rozpoznanie     -> struktura obszaru, drzewo plików, liczniki linii
2. Zbiór korzeni   -> tests/spec/** + pliki okablowania (fixtures, barrel)
3. Pomiar          -> analizator: ile składowych nieosiągalnych (dwie liczby: pewne, tranzytywne)
4. Decyzja         -> jeśli cięcie duże/publiczne: JEDNO pytanie z opcjami do użytkownika
5. Usunięcie       -> przepisanie plików z ochroną kotwic; tsc po każdym kroku
6. Commit #1       -> "remove unreachable ..." (osobny, łatwy do cofnięcia)
7. Dedup+struktura -> konstruktory, wspólne helpery, rzutowania any, opcje redundantne
8. Commit #2       -> "drop redundant constructors, share X, remove any-casts"
9. Poziom obiektu  -> puste klasy / nieużywane fixtury -> Commit #3
10. Bramki         -> tsc, eslint obszar, eslint całość, każdy projekt testowy osobno
11. Raport         -> liczby przed -> po, liczby per commit, realne wyjście bramek,
                      lista świadomie NIEPORUSZONYCH rzeczy z powodem
```

## Realne przebiegi

### `setup/` — wewnętrzne okablowanie (bezsporne, bez pytania)

| Metryka | Wynik |
|---|---|
| Linie TS w `setup/` | 673 → 462 (−31%) |
| Commity | 9 (m.in. `api-login.ts` jako jedno `fetchAccessToken`, `auth-manager` bez drugiej kopii logowania, `lock-helper` z odzyskiwaniem osieroconego locka) |
| Usunięte | martwy barrel `api/index.ts`, alias `@setup/*` z `tsconfig`, 10 funkcji modułowych, 9 metod „rzucających", 8 interfejsów |

Cięcie było bezsporne, bo to warstwa wewnętrzna: nie pytano użytkownika.

### `tests/fixtures/mock` — helper mocków

| Metryka | Wynik |
|---|---|
| `mock-helper.ts` | 120 → 95 linii |
| Usunięte | druga kopia obstawiania trasy produktów (regex + guard + continue), 4 × `any`, redundantny `contentType` przy `fulfill({ json })` |

Efekt uboczny i dowód wartości: regex trafiał do trzech miejsc (dwa w helperze, jedno
ręcznie w `network-delay.spec.ts`). Po wyniesieniu do stałej `PRODUCTS_PATTERN`
wywołanie w specu skróciło się do `delayResponse(delayMs)`.

### `tests/pages` — warstwa POM (duże cięcie, wymagało decyzji)

| Metryka | Wynik |
|---|---|
| Linie TS | 1348 → 784 (−42%) |
| Składowych nieosiągalnych | 81 z 185 (pewne: 42; reszta tranzytywnie) |
| Commity | `9838416` usunięcie (−499 linii), `7ed6e25` struktura (+46/−79), `d0d9956` pusty komponent (−19) |

Tu zatrzymano się i zadano jedno pytanie z czterema opcjami, bo POM-y w projekcie *sample*
są częściowo dokumentacją wzorców. Użytkownik wybrał pełne usunięcie jako revertowalny commit.

Największe cięcia (linie przed → po): `product-details` 107→35, `pagination` 55→9,
`account` 68→15, `filter-sidebar` 75→27, `admin-dashboard` 120→51, `cart` 73→28.

## Co realnie okazało się duplikacją po usunięciu martwego kodu

Kluczowe spostrzeżenie: **po kroku 5 duplikacja prawie zniknęła.** Ocalały:

- 4 kopie bloku „isVisible → return '' → trim" (`login`, `register`, `contact`, `checkout`)
  → jeden `BasePage.visibleText`.
- 8 × zbędny `constructor(page: Page) { super(page); }` w klasach pochodnych.
- 6 × rzutowanie `(x as any).pole` wynikające z typu, który nie deklarował czytanego pola
  → nazwany typ wejściowy (`RegisterInput`) i pola-aliasy.
- Unia typów z rzutowaniem w `contact.fillForm` → jeden luźny typ przyjmował już oba
  warianty strukturalnie.

Parsowanie ceny (`getPrice`) istniało w dwóch kopiach, ale **obie były w martwym kodzie** —
helper dla zera ocalałych wywołań byłby gorszy niż nic. To jest test na to, czy kolejność
„najpierw usuń" została zachowana.

## Trzy błędy, które kosztowały czas (żeby ich nie powtórzyć)

1. **Zakres cięcia z linii deklaracji** zjadł konstruktory (objaw: `Expected 2 arguments,
   but got 1`) i zamykający `}` klas (objaw: `error TS1005: '}' expected`).
   Lekcja: kotwice strukturalne, nie linie deklaracji.
2. **Regex złapał pola interfejsu** (`category: string` w `AdminNewProduct`) jako składową
   klasy — usunięcie rozjechało interfejs. Lekcja: wykluczaj zakresy `interface`/`type`.
3. **Wieloliniowe parametry rozbijały bloki składowych**, przez co ciała metod nie były
   skanowane, a wszystko, co wołały, raportowane jako martwe (fałszywie zaniżona liczba
   żywych). Lekcja: śledzenie głębokości nawiasów.

Dodatkowo jeden fałszywy traf, którego żadna analiza nie uniknie: fixture `storageState`
używa framework po nazwie, nie odwołanie — musiało trafić do `--keep`.

## Wzorzec raportu końcowego

```
Co zmienione (commity + licznik linii przed -> po)
Weryfikacja (realne wyjście każdej bramki, nie opis)
Dwie rzetelne uwagi o metodzie (jeśli analiza była poprawiana — powiedz o tym)
Czego świadomie NIE ruszyłem i dlaczego
Co zostało do zrobienia (dług lintera, martwe obiekty, decyzje użytkownika)
```

Ostatnia sekcja jest tym, co pozwala przyjąć zmianę bez czytania diffu — i tym, co
odróżnia upraszczanie od rozbiórki.
