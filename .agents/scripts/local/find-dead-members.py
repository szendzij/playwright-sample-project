#!/usr/bin/env python
"""Analizator osiągalności dla przebiegu upraszczania (KISS).

Znajduje składowe (pola/metody) OBSZARU, do których nie dociera nic ze ZBIORU KORZENI.
Ostatecznym sędzią pozostaje kompilator — po usunięciu uruchom type-check i przywróć
wszystko, na co się poskarży.

Raport (domyślnie):
    python .agents/scripts/local/find-dead-members.py \
        --area tests/pages --roots tests/spec --keep storageState --keep userRole

Przepisanie plików w miejscu (usuwa martwe składowe, z ochroną kotwic):
    python .agents/scripts/local/find-dead-members.py \
        --area tests/pages --roots tests/spec --keep storageState --rewrite

--area   katalog, którego składowe są kandydatami do usunięcia (powtarzalny)
--roots  katalog/plik definiujący życie, np. specyfikacje albo plik okablowania
         (powtarzalny). Składowa, której NAZWA występuje w pliku korzenia, jest żywa.
--ext    rozszerzenie skanowanych plików (domyślnie: .ts)
--keep   nazwy, które nigdy nie mogą zostać zgłoszone jako martwe: fixtury frameworka
         (storageState, page, context, userRole...), klucze DI (powtarzalny)

Kod wyjścia zawsze 0; czytaj raport. Wynik to kandydaci, nie wyroki — kolizje nazw
między plikami czynią raport KONSERWATYWNYM: martwa składowa nigdy nie zostanie
zgłoszona błędnie, gdy jej nazwa występuje dwa razy, ale żywa może zostać zachowana.

Ważne dla tego repo: przy liczeniu na całym drzewie WYKLUCZ .agents/ (196 plików .js
z wendorowanym toolingiem). Analizuj per obszar.
"""
import argparse
import collections
import os
import re
import sys

DECL = re.compile(
    r'^[ \t]*(?:export\s+)?(?:abstract\s+)?(?:override\s+)?'
    r'(?:readonly\s+|protected\s+|public\s+|private\s+)?(?:async\s+)?(\w+)\s*[\(=:]'
)
# słowa, które regex deklaracji łapie na zwykłych instrukcjach
NOT_A_MEMBER = {
    'if', 'for', 'return', 'const', 'let', 'import', 'export', 'await', 'type',
    'class', 'super', 'this', 'try', 'catch', 'else', 'new', 'while', 'switch',
    'case', 'interface', 'function',
}


def read(path):
    with open(path, encoding='utf-8', errors='ignore') as fh:
        return fh.read()


def collect_files(dirs, ext):
    out = []
    for item in dirs:
        if os.path.isfile(item):
            if item.endswith(ext):
                out.append(item)
            continue
        for dp, _, fs in os.walk(item):
            out.extend(os.path.join(dp, f) for f in fs if f.endswith(ext))
    return sorted(out)


def interface_ranges(lines):
    """Zakresy linii (0-based, włącznie) wewnątrz deklaracji interface/type."""
    out, depth, start = [], 0, None
    for i, line in enumerate(lines):
        if start is None and re.match(r'\s*(export\s+)?(interface|type)\b.*\{', line):
            start, depth = i, line.count('{') - line.count('}')
            if depth <= 0:
                out.append((i, i))
                start = None
            continue
        if start is not None:
            depth += line.count('{') - line.count('}')
            if depth <= 0:
                out.append((start, i))
                start = None
    return out


def parse_members(path, root, ext):
    """-> ścieżka rel, {nazwa: (start, end)}, lista kotwic, wszystkie linie.

    Kotwice: składowa | konstruktor | interfejs | koniec klasy. Zakres każdej martwej
    składowej jest przycinany do następnej kotwicy, dzięki czemu nie zjada konstruktora
    ani zamykającego '}' klasy (dwa realne objawy: 'Expected N arguments, but got 1'
    oraz "error TS1005: '}' expected").
    """
    rel = os.path.relpath(path, root).replace(os.sep, '/')
    lines = read(path).split('\n')
    inside_type = set()
    for a, b in interface_ranges(lines):
        inside_type.update(range(a, b + 1))

    anchors = []
    depth = 0  # głębokość nawiasów: nigdy nie przyjmuj deklaracji wewnątrz sygnatury
    for i, line in enumerate(lines):
        if i in inside_type:
            pass
        elif re.match(r'\s*constructor\s*\(', line):
            anchors.append((i, 'ctor', None))
        elif depth == 0:
            m = DECL.match(line)
            if m and m.group(1) not in NOT_A_MEMBER:
                anchors.append((i, 'member', m.group(1)))
        depth += line.count('(') - line.count(')') + line.count('[') - line.count(']')

    tail = len(lines)  # zamykający '}' klasy nigdy nie jest usuwalny
    for i in range(len(lines) - 1, -1, -1):
        if lines[i].rstrip() == '}' and not lines[i][:1].isspace():
            tail = i
            break
    anchors.append((tail, 'tail', None))
    anchors.sort(key=lambda a: a[0])

    members = {}
    for k, (line, kind, name) in enumerate(anchors):
        if kind != 'member':
            continue
        end = anchors[k + 1][0] - 1 if k + 1 < len(anchors) else len(lines) - 1
        members[name] = (line, max(end, line))
    return rel, members, anchors, lines


def find_dead(areas, roots, ext, keep, root):
    root_src = ''.join(read(p) for p in collect_files(roots, ext))
    per_file, lines_of = {}, {}
    for area in areas:
        for path in collect_files([area], ext):
            rel, members, anchors, lines = parse_members(path, root, ext)
            if members:
                per_file[rel] = (members, anchors)
                lines_of[rel] = lines

    name_count = collections.Counter()
    for members, _ in per_file.values():
        name_count.update(members.keys())
    # nazwa unikalna w całym repo daje jednoznaczną krawędź między plikami
    unique = {}
    for rel, (members, _) in per_file.items():
        for name in members:
            if name_count[name] == 1:
                unique[name] = rel

    edges = {}
    for rel, (members, _) in per_file.items():
        lines = lines_of[rel]
        for name, (start, end) in members.items():
            refs = set()
            for i in range(start, min(end + 1, len(lines))):
                for other in members:
                    if other != name and re.search(
                        r'\b' + re.escape(other) + r'\b', lines[i]
                    ):
                        refs.add((rel, other))
                for other, other_rel in unique.items():
                    if other_rel != rel and re.search(
                        r'\b' + re.escape(other) + r'\b', lines[i]
                    ):
                        refs.add((other_rel, other))
            edges[(rel, name)] = refs

    all_members = {(rel, n) for rel, (members, _) in per_file.items() for n in members}
    live = {
        m for m in all_members if re.search(r'\b' + re.escape(m[1]) + r'\b', root_src)
    }
    frontier = list(live)
    while frontier:
        for nxt in edges.get(frontier.pop(), ()):
            if nxt not in live:
                live.add(nxt)
                frontier.append(nxt)

    dead = sorted(m for m in all_members - live if m[1] not in keep)
    return dead, per_file, lines_of


def rewrite(dead, per_file, lines_of):
    def doc_start(lines, i):
        j = i
        while j - 1 >= 0 and lines[j - 1].strip().startswith(('*/', '*', '/**', '//')):
            j -= 1
        return j

    by_file = collections.defaultdict(list)
    for rel, name in dead:
        by_file[rel].append(name)

    for rel, names in sorted(by_file.items()):
        lines = lines_of[rel]
        members, anchors = per_file[rel]
        kill = set()
        for name in names:
            line = members[name][0]
            k = next(i for i, a in enumerate(anchors) if a[0] == line and a[1] == 'member')
            end = anchors[k + 1][0] - 1 if k + 1 < len(anchors) else members[name][1]
            kill.update(range(doc_start(lines, line), min(end, members[name][1]) + 1))
        out = [l for i, l in enumerate(lines) if i not in kill]
        while len(out) > 1 and out[-1].strip() == '' and out[-2].strip() == '':
            out.pop()
        text = '\n'.join(out)
        text = text.rstrip('\n') + '\n'
        with open(rel, 'w', encoding='utf-8', newline='') as fh:
            fh.write(text)
        print('  przepisano %s: %d -> %d linii (usunięto %d)' % (rel, len(lines), len(out), len(names)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--area', action='append', required=True)
    ap.add_argument('--roots', action='append', required=True)
    ap.add_argument('--ext', default='.ts')
    ap.add_argument('--keep', action='append', default=[])
    ap.add_argument('--rewrite', action='store_true')
    args = ap.parse_args()

    root = os.getcwd()
    dead, per_file, lines_of = find_dead(
        args.area, args.roots, args.ext, set(args.keep), root
    )
    total = sum(len(m) for m, _ in per_file.values())
    print('składowych: %d   osiągalnych: %d   MARTWYCH: %d\n'
          % (total, total - len(dead), len(dead)))
    current = None
    for rel, name in dead:
        if rel != current:
            print('%s:' % rel)
            current = rel
        print('    :%d  %s' % (per_file[rel][0][name][0] + 1, name))
    if args.rewrite and dead:
        print()
        rewrite(dead, per_file, lines_of)
        print('\nTeraz uruchom type-check (npx tsc --noEmit). Przywróć każdą składową, '
              'na którą się poskarży.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
