#!/usr/bin/env node
/**
 * Hook lokalny (poza instalacją ECC): bramka jakości przed `git commit`.
 *
 * Po co: w tym repo type-check NIE jest częścią bramki commita.
 *   - `scripts/hooks/post-edit-typecheck.js` sprawdza pojedynczy plik po edycji,
 *     a przy wykrytym `tsconfig.json` jest pomijany (nie rozwiąże aliasów ani globali),
 *   - `scripts/hooks/pre-bash-commit-quality.js` lintuje TYLKO pliki stage'owane.
 * Skutek: commit z błędem typów w niezmienionym pliku przechodzi niezauważony.
 * Ten hook uruchamia type-check i lint na CAŁYM projekcie.
 *
 * Zachowanie:
 *   - domyślnie OSTRZEGA (exit 0) i wypisuje werdykt na stderr,
 *   - blokuje commit (exit 2) tylko przy ECC_COMMIT_GATE_STRICT=true.
 * Wybór jest świadomy: instrukcja repo (.agents/agents.md) każe agentowi commitować
 * automatycznie, więc domyślne blokowanie walczyłoby z nią.
 *
 * Zmienne:
 *   ECC_COMMIT_GATE_STRICT=true  – blokuj commit przy czerwonej bramce
 *   ECC_COMMIT_GATE_OFF=true     – całkowicie wyłącz ten hook
 *
 * Podpięcie (UWAGA): `hooks.json` i `scripts/hooks/**` są ZARZĄDZANE przez instalator
 * ECC i `auto-update` może je nadpisać. Ten skrypt celowo leży w `scripts/local/`,
 * poza manifestem instalacji. Wpis do hooka dodaje się ręcznie jako OSOBNY element,
 * np. w `hooks/hooks.json`:
 *
 *   {
 *     "matcher": "Bash",
 *     "hooks": [{ "type": "command",
 *                 "command": "node scripts/local/commit-gate.js", "timeout": 180 }],
 *     "description": "Local gate: whole-project tsc + eslint before git commit",
 *     "id": "local:pre:bash:commit-gate"
 *   }
 *
 * Po aktualizacji ECC sprawdź, czy wpis nadal istnieje.
 *
 * Kody wyjścia: 0 – kontynuuj, 2 – zablokuj wywołanie narzędzia (PreToolUse).
 */

const { spawnSync } = require('child_process');

const MAX_STDIN = 1024 * 1024;

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
      if (data.length > MAX_STDIN) data = data.slice(0, MAX_STDIN);
    });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(data));
  });
}

function run(cmd, args, timeout) {
  // shell: true jest konieczne dla `npx`/`npx.cmd` na Windows
  return spawnSync(cmd, args, {
    encoding: 'utf8',
    shell: true,
    timeout,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function isRepoCommand(command) {
  // `git commit` / `git -C <path> commit`, ale nie `git commit --amend` na wycofanie zmian
  return /\bgit\b[^\n;&|]*\bcommit\b/.test(command);
}

async function main() {
  const raw = await readStdin();

  if (process.env.ECC_COMMIT_GATE_OFF === 'true') {
    process.stdout.write(raw);
    return 0;
  }

  let input = {};
  try {
    input = JSON.parse(raw || '{}');
  } catch {
    process.stdout.write(raw);
    return 0; // nie psuj przepływu, gdy kształt wejścia się zmieni
  }

  const command = input?.tool_input?.command || '';
  if (!isRepoCommand(command)) {
    process.stdout.write(raw);
    return 0;
  }

  const failures = [];

  const tsc = run('npx', ['tsc', '--noEmit'], 120000);
  if (tsc.status !== 0) {
    const out = `${tsc.stdout || ''}${tsc.stderr || ''}`.trim();
    failures.push(['tsc --noEmit', out.split('\n').slice(0, 12).join('\n')]);
  }

  const lint = run('npx', ['eslint', '.'], 120000);
  if (lint.status !== 0) {
    const out = `${lint.stdout || ''}${lint.stderr || ''}`.trim();
    const summary = out.split('\n').filter((l) => /problem/.test(l)).slice(-1)[0] || '';
    failures.push(['eslint .', summary || out.split('\n').slice(-3).join('\n')]);
  }

  if (failures.length === 0) {
    process.stdout.write(raw);
    return 0;
  }

  const strict = process.env.ECC_COMMIT_GATE_STRICT === 'true';
  console.error('[commit-gate] Bramka repozytorium jest CZERWONA:');
  for (const [step, detail] of failures) {
    console.error(`[commit-gate]   ${step}:`);
    for (const line of String(detail).split('\n')) {
      console.error(`[commit-gate]     ${line}`);
    }
  }
  console.error(
    '[commit-gate] Uruchom bramki na całości: npx tsc --noEmit oraz npx eslint .'
  );
  console.error(
    '[commit-gate] Uwaga: bramka czerwona JUŻ w baseline to stan zastany, nie regresja — ' +
      'zaraportuj to jako stan zastany.'
  );

  if (strict) {
    console.error('[commit-gate] ECC_COMMIT_GATE_STRICT=true -> commit ZABLOKOWANY.');
    process.stdout.write(raw);
    return 2;
  }

  console.error('[commit-gate] Tryb ostrzegawczy -> commit przechodzi (exit 0).');
  process.stdout.write(raw);
  return 0;
}

main().then(
  (code) => process.exit(code),
  () => process.exit(0)
);
