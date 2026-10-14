---
description: Przeprowadź uproszczenie wybranego obszaru repo (KISS) — pomiar osiągalności, usunięcie kodu martwego, zwinięcie duplikatów, weryfikacja wszystkimi bramkami i raport z jawnym podaniem rzeczy nieporuszonych.
---

# Komenda: uprość obszar

Punkt wejścia operatora do przebiegu opisanego w skillu `codebase-simplification`
(`.agents/skills/codebase-simplification/SKILL.md`).

## Jak to faktycznie działa

To nie jest pojedynczy skrypt, a sekwencja bramek — dlatego kolejność ma znaczenie:

1. **Baseline.** Zapisz REALNY stan bramek, z istniejącymi porażkami włącznie:

   ```bash
   npx tsc --noEmit; echo "TSC=$?"
   npx eslint .; echo "LINT=$?"
   npx playwright test --project=toolshop-api  | tail -2
   npx playwright test --project=toolshop-mock | tail -2
   npx playwright test --project=toolshop-e2e  | tail -2
   ```

2. **Pomiar osiągalności** (raport, bez zmian):

   ```bash
   python .agents/scripts/local/find-dead-members.py \
     --area <obszar> --roots tests/spec --roots tests/pages/base.ts \
     --keep storageState --keep userRole
   ```

3. **Decyzja o zakresie.** Ciśnięcie wewnętrznego okablowania — działaj. Cięcie dużego
   kawałka API publicznego/demonstracyjnego — zadaj JEDNO pytanie z opcjami, zanim
   cokolwiek skasujesz.

4. **Usunięcie** (przepisanie plików z ochroną kotwic) → `--rewrite`, potem obowiązkowo
   `npx tsc --noEmit` i przywrócenie wszystkiego, na co się poskarży. Commit osobny:
   `refactor(<obszar>): remove unreachable <co>`.

5. **Warstwa strukturalna** na tym, co przetrwało: zbędne konstruktory, wspólne helpery
   wyniesione do bazy, `as any` zamienione na uczciwe typy, argumenty równe domyślnym
   wartościom, opcje redundantne wobec frameworka. Commit osobny:
   `refactor(<obszar>): drop redundant constructors, share X, remove any-casts`.

6. **Poziom obiektu.** Grep nazw fixture'ów i eksportów w zbiorze korzeni — pusta klasa
   trzymana przez fixture i barrel jest martwa, choć analiza na poziomie składowych jej
   nie zgłosi. Commit osobny.

7. **Bramki końcowe** — dokładnie te same z punktu 1. Bramka czerwona w baseline i zielona
   teraz = flaky; powiedz to wprost. Zielona w baseline i czerwona teraz = twoja wina,
   napraw albo cofnij tę jedną zmianę.

8. **Raport.** Liczby linii przed → po, liczby per commit, realne wyjście każdej bramki,
   lista świadomie NIEPORUSZONYCH rzeczy z powodem dla każdej.

## Czego nie robić w tym przebiegu

- Nie refaktoryzuj przed usunięciem — przepiszesz metody, które punkt 4 kasuje.
- Nie licz problemów lintera na całym repo bez wykluczenia `.agents/` (196 plików `.js`,
  ponad 2700 problemów, zagłuszy wszystko).
- Nie „naprawiaj" czerwonego linta kasując asercję albo zamieniając ją na `test.skip`.
  Pusta asercja to gorzej niż ostrzeżenie.
- Nie przepisuj historii, żeby uprządkować własne commity — zgłoś i pozwól zdecydować.

## Arguments

$ARGUMENTS:

- `[obszar]` — katalog lub warstwa do uproszczenia, np. `tests/pages`, `setup/`,
  `tests/fixtures/mock`. Gdy nie podano, zapytaj o obszar; nie zgaduj.
- `[--dry-run]` — wykonaj tylko punkty 1–3 (baseline + pomiar + propozycja zakresu),
  bez modyfikowania plików. Przydatne, gdy użytkownik chce najpierw zobaczyć liczby.
