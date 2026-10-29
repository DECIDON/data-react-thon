import js from '@eslint/js'
import boundaries from 'eslint-plugin-boundaries'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

/**
 * ESLint 9 flat config — socle de la foundation React :
 * - frontières de couches tenues par eslint-plugin-boundaries (baseline 0, ADR C-003) ;
 * - jamais de `new Error` nu hors `src/platform/errors/base.ts` (D-002) ;
 * - console interdite hors `src/platform/logging.ts` (S-09) ;
 * - pas de danger HTML ni d'eval (preuves négatives mécanisées, SECURITY.md).
 */
export default tseslint.config(
  {
    ignores: [
      'dist/',
      'node_modules/',
      'coverage/',
      'playwright-report/',
      'test-results/',
      'public/version.json',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs['recommended-latest'],
  {
    // Plugin des frontières (v7, sélecteurs « selectors/policies ») : ARCHITECTURE.md §3, ADR C-003.
    // `domain` reste pur : interdit des modules externes ET des couches ascendantes ; l'UI est coupée
    // de la donnée et de l'orchestration directes.
    plugins: { boundaries },
    settings: {
      'import/resolver': {
        typescript: { project: ['tsconfig.app.json', 'tsconfig.node.json'], noWarnOnMultipleProjects: true },
      },
      'boundaries/elements': [
        { type: 'platform', pattern: 'src/platform/**' },
        { type: 'domain', pattern: 'src/domain/**' },
        { type: 'data', pattern: 'src/data/**' },
        { type: 'application', pattern: 'src/application/**' },
        { type: 'hooks', pattern: 'src/hooks/**' },
        { type: 'components', pattern: 'src/components/**' },
        { type: 'pages', pattern: 'src/pages/**' },
      ],
    },
    rules: {
      'boundaries/dependencies': [
        'error',
        {
          default: 'allow',
          policies: [
            {
              from: { element: { type: 'domain' } },
              disallow: {
                to: {
                  element: { types: { anyOf: ['data', 'application', 'hooks', 'components', 'pages'] } },
                },
              },
            },
            // (Pureté `domain` vs modules externes : tenue par `no-restricted-imports`, bloc dédié plus bas.)
            {
              from: { element: { types: { anyOf: ['components', 'pages'] } } },
              disallow: { to: { element: { types: { anyOf: ['data', 'application'] } } } },
            },
          ],
        },
      ],
    },
  },
  {
    // ARCHITECTURE.md §3 (tenu par la règle cœur) : `domain` n'importe AUCUN framework.
    // Liste = celle de la foundation (react, dexie, supabase, redux, zustand) + SDK du même registre.
    files: ['src/domain/**/*.ts', 'src/domain/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-dom',
                'react-router',
                'react-i18next',
                'i18next',
                'zustand',
                'dexie',
                '@reduxjs/toolkit',
                'redux-saga',
                '@supabase/supabase-js',
                '@tanstack/react-query',
              ],
              message: 'Domaine pur interdit (ARCHITECTURE.md §3) : aucun framework dans src/domain/.',
            },
          ],
        },
      ],
    },
  },
  {
    // D-002 : erreurs typées uniquement. Liste blanche volontairement quasi vide au départ.
    files: ['src/**/*.ts', 'src/**/*.tsx', '!src/platform/errors/base.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'NewExpression[callee.name=/^(Error|TypeError|RangeError|SyntaxError)$/]',
          message: 'Interdit : utiliser BaseError (src/platform/errors/base.ts) ou une de ses subclasses.',
        },
        {
          selector: 'JSXAttribute[name.name="dangerouslySetInnerHTML"]',
          message: 'Interdit : tout rendu de contenu non contrôlé doit être sanitisé (SECURITY.md S-07).',
        },
      ],
    },
  },
  {
    // S-09 : un seul module de logging.
    files: ['src/**/*.ts', 'src/**/*.tsx', '!src/platform/logging.ts'],
    rules: { 'no-console': 'error' },
  },
  {
    // Scripts Node du build : hors application (console/process légitimes ici, jamais dans src/).
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: { console: 'readonly', process: 'readonly' } },
    rules: { 'no-console': 'off' },
  },
  {
    // Preuves négatives mécanisées (SECURITY.md) : pas d'eval, pas de fonction dynamique.
    rules: { 'no-eval': 'error', 'no-new-func': 'error' },
  },
)
