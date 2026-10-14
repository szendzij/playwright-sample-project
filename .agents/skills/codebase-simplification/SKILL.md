---
name: codebase-simplification
description: Uproszczenie wybranego obszaru repo zgodnie z KISS — usunięcie kodu nieosiągalnego z testów i zwinięcie duplikatów bez zmiany zachowania. Użyj, gdy użytkownik mówi "uprość katalog X", "co tu można uprościć", "lecimy z KISS" albo wskazuje warstwę podejrzaną o martwy kod.
---

# Upraszczanie obszaru repo (KISS)

Jednostką pracy jest **wybrany obszar** (katalog, warstwa, moduł), nie ostatni diff.

**Zasada nadrzędna: kompilator jest orakulum.** Jeśli po usunięciu składowej projekt
nadal się kompiluje, to nic jej nie referencjonowało. To jest dokładniejsze niż
jakakolwiek analiza statyczna i to ona rozstrzyga, nie intuicja ani nazwa symbolu.

## Kiedy używać

- Użytkownik wskazuje obszar i pyta, co da się uprościć.
- Warstwa narosła przez dokładanie i podejrzewa się w niej nieużywany interfejs.
- Po przenoszeniu/zmianie nazw, żeby posprzątać resztki.

Nie używaj do recenzji świeżego diffu (od tego jest code review) ani do pojedynczej
oczywistej zmiany.

## Zasady nienegocjowalne

1. **Baseline przed, bramki po.** Zapisz REALNE wyniki każdej bramki przed dotknięciem
   pliku — z istniejącymi porażkami włącznie. Bramka zepsuta już wcześniej jest
   raportowana jako stan zastany, nigdy jako „zweryfikowana".
2. **Najpierw usuń, potem zwijaj duplikaty.** Większość „duplikacji" w zastanej
   warstwie siedzi w martwym kodzie — refaktoryzowałbyś metody, które zaraz znikną.
3. **Usuwanie martwego kodu w osobnym commicie** od warstwy strukturalnej, żeby jeden
   `git revert` cofał duże cięcie bez cofania przepisań.
4. **KISS to nie demolka** — patrz sekcja Pułapki, lista rzeczy, które MUSZĄ zostać.
5. **Nie przepisuj opublikowanej historii** bez pytania, żeby uprzątnąć własne commity.

## Procedura

### 1. Rozpoznanie obszaru i jego realnych konsumentów

```bash
find <obszar> -type f | sort
find <obszar> -name '*.ts' -exec wc -l {} + | sort -n
```

Zbiór korzeni (co czyni składową żywą) to dla tego repo: `tests/spec/**` (specyfikacje)
oraz pliki okablowania frameworka — `tests/pages/base.ts` (definicje fixture'ów),
`setup/api/fixtures.ts` i barrele `*/index.ts`. Składowa osiągalna tylko z okablowania
jest nadal żywa.

Policz dwie niezależne liczby:

- **Pewnie martwe** — nazwa składowej występuje w całym drzewie dokładnie RAZ (sama
  deklaracja). Konserwatywne, zero fałszywych trafień, i to jest liczba, którą można
  podać bez zastrzeżeń.
- **Martwe tranzytywnie** — punkt stały osiągalności: pola i metody używane wyłącznie
  przez inne martwe składowe giną razem z nimi. To ona steruje cięciem.

`scripts/find-dead-members.py` liczy obie. Raportuj je per obszar i **wymień katalogi,
które wykluczyłeś** — jedno wendorowane drzewo w repo (tu: `.agents/`, 196 plików `.js`)
zdominuje każdy wynik liczony na całym repo i uczyni go bezwartościowym.

### 2. Ustal zakres z użytkownikiem, gdy cięcie jest duże

Usuwanie wewnętrznego okablowania to rutyna — rób to. Usunięcie dużego kawałka API
**publicznego lub demonstracyjnego** to decyzja produktowa: POM-y w `tests/pages` są
napisane „na zapas" i częściowo pełnią rolę dokumentacji wzorców.

W momencie, gdy masz liczby w rodzaju „N z M składowych nieosiągalnych (X%)", zatrzymaj
się i zadaj JEDNO pytanie z konkretnymi opcjami (usunąć wszystko jako revertowalny
commit / tylko warstwę bazową i infrastrukturę / tylko całe spójne grupy / nic, jedynie
struktura) — rekomendację postaw jako pierwszą. Powiedz, jak będziesz weryfikować.
Równolegle rób tę bezsporną, strukturalną połowę.

### 3. Usuń martwy kod, chroniąc kotwice strukturalne

Przepisuj całe pliki, ale zakresy do usunięcia wyprowadzaj z KOTWIC, nigdy z samych
linii deklaracji:

```
kotwica = składowa | konstruktor | interfejs/typ | koniec klasy (ostatni `}` w kolumnie 0)
```

Zakres każdej martwej składowej przycinaj do następnej kotwicy. Po przepisaniu uruchom
type-check: **każdy zgłoszony błąd to składowa, którą twój model błędnie uznał za martwą** —
przywróć ją (nie poszerzaj cięcia, żeby uciszyć błąd) i powtarzaj aż będzie czysto.

### 4. Zwiń duplikację, która przetrwała

Powtórz najpierw analizę osiągalności — duplikacja jest zwykle już znacznie mniejsza.
W kolejności zwrotu:

- **Konstruktory, które tylko wołają `super(...)`.** Klasa pochodna nie potrzebuje
  konstruktora, gdy bazowa ma tę samą sygnaturę — usuń go, a potem importy typów,
  których był jedynym użytkownikiem.
- **Jedno ciało powtórzone w kilku klasach** — wynieś do bazy jako `protected` helper
  (w tym repo: `BasePage.visibleText`). Licz tylko kopie, które przetrwały krok 3:
  helper wyciągnięty dla dwóch wywołań jest gorszy niż powtórzona linia.
- **Rzutowania `as any`, które istnieją, bo typ nie ma pola, a kod je czyta** — poszerz
  typ wejściowy uczciwie (`RegisterInput`, opcjonalne pole-alias z komentarzem, że obie
  pisownie są akceptowane) zamiast trzymać rzutowanie.
- **Parametry typu unii budowane rzutowaniem** — często jeden luźny typ przyjmuje już
  oba warianty strukturalnie; sprawdź, zanim zostawisz unię.
- **Argument w wywołaniu powtarzający domyślną wartość kalibrowanej funkcji.**
- **Opcje przekazywane do wywołania frameworka, które framework ustawia sam**
  (np. `route.fulfill({ json })` ustawia `Content-Type: application/json`).

Na koniec powtórz analizę **na poziomie obiektu, nie składowej**: klasa może stracić
wszystkie pola i metody, a nadal wyglądać na osiągalną, bo konstruuje ją fixture,
trzyma pole strony i eksportuje barrel. Wykrywanie: grep nazw fixture'ów i eksportów
w zbiorze korzeni. Taka zmiana dotyka kilku plików (typ `UiFixtures` + fixture + pole +
barrel), więc dostaje własny commit.

### 5. Weryfikuj wobec baseline, bramka po bramce, w każdym projekcie testowym

```bash
npx tsc --noEmit                              # dokładne orakulum referencji
npx eslint <obszar>                           # dotknięty obszar musi być czysty
npx eslint .                                  # stan całego repo (liczba problemów)
npx playwright test --project=toolshop-api    # każdy projekt OSOBNO, z własną liczbą
npx playwright test --project=toolshop-mock
npx playwright test --project=toolshop-e2e
```

Pełne recepty i fakty o bramkach: `references/verification-gates.md`.

- Bramka, która padła w baseline a teraz przechodzi, była **flaky** — powiedz to wprost
  i nie przypisuj sobie jej naprawy.
- Bramka, która przechodziła w baseline a teraz pada, jest twoja — napraw albo cofnij
  tę jedną zmianę.

### 6. Raportuj i nazwij, co świadomie zostawiłeś

Raport zawiera: liczniki linii przed → po, liczby per commit, realne wyjście każdej
bramki i krótką listę powierzchni, której NIE ruszyłeś, z powodem dla każdej pozycji.
Ta ostatnia lista pozwala przyjąć zmianę bez czytania diffu. Wzorzec:
`references/playbook.md`.

## Pułapki

- **Zakres wyliczony z samych linii deklaracji.** Konstruktory, ciała `interface`/`type`
  i zamykający `}` klasy nie są składowymi, ale leżą POMIĘDZY nimi — zakres „od
  deklaracji do następnej deklaracji" je połyka. Objawy: `error TS1005: '}' expected`
  dla klamry oraz `Expected N arguments, but got 1`, gdy zjedzony został konstruktor
  z parametrem domyślnym.
- **Pola interfejsu brane za składowe klasy.** Regex na `name:` / `name =` łapie też pola
  interfejsu i ich usunięcie okalecza typ. Zbierz zakresy linii `interface`/`type`
  i wyklucz je.
- **Parametry wieloliniowej sygnatury brane za składowe.** Parametr w osobnej linii
  (`customerData: X | Y`) pasuje do naiwnego regexu i — co gorsza — ROZBIJA blok
  prawdziwej składowej, więc jej ciało nigdy nie jest skanowane, a każda wołana przez
  nią składowa raportowana jest jako martwa. Śledź głębokość nawiasów i przyjmuj
  deklaracje tylko na poziomie zero.
- **Liczenie wystąpień nazw zamiast grafu odwołań.** Nazwa pola współdzielona przez kilka
  klas (`searchInput`, `submitButton`, `emailInput`) nigdy nie spada do jednego
  wystąpienia, nawet gdy wszystkie są martwe. Do finalnej listy używaj krawędzi
  odwołań per składowa plus punktu stałego.
- **Fixtury frameworka referencjonowane po nazwie.** `storageState`, `page`, `context`
  i wszystko wyszukiwane po stringu są niewidoczne dla analizy i ZAWSZE zostaną
  zgłoszone jako martwe. Zostaw je — to jedyny fałszywy traf, którego kompilator też
  ci nie złapie. Dodawaj je do `--keep`.
- **Puste klasy pozostawione po kroku 3.** Klasa, której wszystkie składowe były martwe,
  sama jest zwykle martwa, ale trzyma ją fixture, pole strony i barrel — żaden przebieg
  na poziomie składowych jej nie zgłosi. To najczęstszy leftover tej procedury.
- **KISS stosowany jako rozbiórka.** Zostaw: jednowierszowe wrappery, których zadaniem
  jest ukrycie importu przed wywołującym; warstwy fixture'ów kupujące leniwe
  konstruowanie; typy wejściowe przyjmujące kilka pisowni pól, żeby wywołania nie
  potrzebowały rzutowania; metodę o nazwie mówiącej intencję w miejsce surowego wywołania
  frameworka. Ich usunięcie wymienia linię kodu na zdublowaną wiedzę w każdym miejscu
  wywołania.
- **Refaktoryzacja przed usunięciem.** Przepiszesz metody, które krok 3 usuwa.
- **Całoplikowe `write_file` po odczycie.** Może zostać odrzucone jako nieaktualne lub
  „różniące się" (widok paginowany, zredagowane linie wyglądające jak dane uwierzytelniające).
  Do chirurgicznych zmian używaj `patch` i weryfikuj z wygenerowanego diffu.

## Pliki wsparcia

- `references/playbook.md` — pełny przebieg na trzech realnych obszarach tego repo
  (`setup/`, `tests/fixtures/mock`, `tests/pages`) z liczbami przed → po.
- `references/verification-gates.md` — które bramki, jak je uruchamiać w tym repo, jak
  udostępnić bramkę, która nigdy nie działała, i jak nie pomylić flakiness z naprawą.
- `scripts/find-dead-members.py` — analizator osiągalności (raport domyślnie,
  `--rewrite` usuwa martwe składowe z ochroną kotwic).
- `.agents/workflows/simplify-area.md` — komenda operatora uruchamiająca cały przebieg.
- `.agents/rules/local-verification-discipline.md` — reguły weryfikacji obowiązujące
  w tym repo.
