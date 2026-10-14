# Dyscyplina weryfikacji (reguła lokalna tego repo)

> Reguła projektowa, dopisana lokalnie — nie pochodzi z instalacji ECC. Rozszerza
> zasady weryfikacji z `rules/common-testing.md` i `rules/typescript-testing.md`
> o to, czego nauczono się przy realnych przebiegach upraszczania `setup/`,
> `tests/fixtures/mock` i `tests/pages`.

## Standardy

1. **Baseline przed zmianą, bramki po zmianie.** Każdą bramkę uruchom i zapisz jej
   realne wyjście PRZED dotknięciem plików — razem z istniejącymi porażkami.
   „Wcześniej też nie działało" to informacja, nie usprawiedliwienie.
2. **Kompilator jest orakulum referencji.** `npx tsc --noEmit` na całym projekcie.
   Narzędzie edycyjne pomija type-check per plik przy wykrytym `tsconfig.json` (nie
   rozwiąże aliasów ani globali) — brak błędu przy edycji NIE jest zaliczoną bramką.
   Usunięcie, które się kompiluje, jest usunięciem, którego nic nie używało.
3. **Każdy projekt testowy osobno, z własną oczekiwaną liczbą.** Jedna zagregowana
   liczba ukrywa, który projekt się zepsuł. W tym repo: `toolshop-api`, `toolshop-mock`,
   `toolshop-e2e`.
4. **Bramka czerwona w baseline i zielona po zmianie była flaky.** Zgłoś to jako
   flaky i nie przypisuj sobie naprawy. Potwierdzony przypadek:
   `tests/spec/mock/intercept-modify.spec.ts` (uderza `route.fetch()` w prawdziwe,
   zdalne API).
5. **Nie osłabiaj asercji, żeby zadowolić linter.** Zamiana realnej asercji na
   `test.skip` bez powodu, skasowanie `expect(...)` albo wyłączenie reguły na cały
   katalog to regresja ukryta jako sprzątanie. Przypadek z historii: test faktur
   przechodził przy pustym koncie, nie sprawdzając niczego — to jest gorsze niż
   czerwona bramka.
6. **Zanim wyłączysz regułę, sprawdź, czy nie ma opcji.** Sondowanie schematu:

   ```bash
   node -e "import('eslint-plugin-playwright').then(m=>{const r=m.default.rules;\
   console.log(JSON.stringify(r['no-skipped-test'].meta.schema))})"
   ```

   `no-skipped-test` ma `allowConditional`, `no-conditional-in-test` nie ma żadnej.
   Wyciszenie znanego fałszywego trafu (idiom frameworka) to nie to samo co wyłączenie reguły.
7. **Adopcja nowej bramki to najpierw zadanie pomiarowe.** Bramka, która nigdy nie
   działała, nie ma „0 problemów" — ma nieznaną liczbę. Uruchom ją, podaj
   `N problemów (E errors, W warnings)` w rozbiciu na obszar i regułę, i pozwól
   użytkownikowi wybrać politykę.
8. **Raporty liczb licz per obszar.** `.agents/` (196 plików `.js` wendorowanego
   toolingu) generuje ponad 2700 problemów lintera i zagłusza wszystko inne.
9. **Po zewnętrznym zapisie czytaj z powrotem.** Sukces wywołania narzędzia to nie
   sukces zadania — dotyczy to zwłaszcza commitów i paczek plików zapisywanych przez
   pośrednika.
10. **Nie przepisuj opublikowanej historii bez prośby.** Commit zbędny albo zdublowany
    zgłoś i pozwól zdecydować; rebase/push wyłącznie na wyraźne polecenie
    (zob. `rules/common-git-workflow.md`).

## Checklista przed uznaniem zadania za skończone

- [ ] `npx tsc --noEmit` — exit 0, brak wyjścia.
- [ ] `npx eslint <dotknięty obszar>` — czysty.
- [ ] `npx eslint .` — liczba problemów podana, zmiana wobec baseline wyjaśniona.
- [ ] Każdy projekt Playwright uruchomiony osobno, liczby porównane z baseline.
- [ ] Rzeczy pominięte / nienaruszone wymienione z powodem.
- [ ] Uwaga o flakiness, jeśli jakaś bramka zmieniła stan bez zmiany w kodzie.
