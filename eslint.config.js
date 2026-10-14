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
  }
);
