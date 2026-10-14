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
    ...playwright.configs['flat/recommended'],
    files: ['tests/**/*.ts'],
  }
);
