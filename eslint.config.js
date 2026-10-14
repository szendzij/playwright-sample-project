import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      '.agents/**',
      'test-results/**',
      'playwright-report/**',
      'blob-report/**',
      '.hermes/**',
      'snapshots/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    rules: {
      // Fixture'y Playwright bez zależności mają postać `async ({}, use) => {}`.
      'no-empty-pattern': ['error', { allowObjectPatternsAsParameters: true }],
    },
  },
  {
    ...playwright.configs['flat/recommended'],
    files: ['tests/**/*.ts'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Zezwalamy na warunkowe `test.skip(warunek, powód)` — to idiomatyczny sposób
      // pomijania testu zależnego od środowiska (np. brak wsparcia backendu dla
      // HTTP QUERY) lub od danych konta. Statyczne `.skip`/`.fixme` nadal są błędem.
      'playwright/no-skipped-test': ['error', { allowConditional: true }],
    },
  },
  {
    files: ['tests/spec/**/*.ts'],
    rules: {
      // Kontrakt POM (Playwright docs /docs/pom: "capturing element selectors in
      // one place"). Selektory żyją w tests/pages/**; specyfikacja konsumuje POM.
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='page'][callee.property.name=/^getBy/]",
          message:
            'Surowy lokator page.getBy* w specyfikacji — dodaj lokator/metodę do page objectu w tests/pages.',
        },
        {
          selector: "CallExpression[callee.object.name='page'][callee.property.name='locator']",
          message:
            'Surowy page.locator w specyfikacji — dodaj lokator do page objectu w tests/pages.',
        },
      ],
    },
  }
);
