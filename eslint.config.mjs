import eslint from '@eslint/js';
import nx from '@nx/eslint-plugin';
import {
  configs as ngConfigs,
  processInlineTemplates,
} from 'angular-eslint';
import prettierConfig from 'eslint-config-prettier';
import { defineConfig } from 'eslint/config';
import { configs as tsConfigs } from 'typescript-eslint';

export default defineConfig(
  ...nx.configs['flat/base'],
  { ignores: ['**/dist', '**/out-tsc', '.angular/*'] },
  {
    name: 'JavaScript',
    files: ['**/*.js', '**/*.mjs'],
    extends: [eslint.configs.recommended, prettierConfig],
  },
  {
    name: 'CommonJS',
    files: ['**/*.cjs'],
    extends: [eslint.configs.recommended, prettierConfig],
    languageOptions: {
      sourceType: 'commonjs',
    },
  },
  {
    name: 'TypeScript',
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tsConfigs.strictTypeChecked,
      ...tsConfigs.stylisticTypeChecked,
      ...ngConfigs.tsAll,
      prettierConfig,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    processor: processInlineTemplates,
    rules: {
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'ngxfb',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'ngxfb',
          style: 'kebab-case',
        },
      ],
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/component-class-suffix': 'off',
      '@typescript-eslint/no-explicit-any': ['error', { fixToUnknown: true }],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'TSEnumDeclaration',
          message: "Enums are forbidden. Use an Object with 'as const' instead",
        },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]',
            match: false,
          },
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
          custom: {
            regex: '^T[A-Z]',
            match: false,
          },
        },
      ],
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/no-unsafe-declaration-merging': 'error',
      '@typescript-eslint/unbound-method': [
        'error',
        {
          ignoreStatic: true,
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { ignoreRestSiblings: true },
      ],
      '@angular-eslint/use-injectable-provided-in': 'off',
    },
  },
  {
    name: 'HTML',
    files: ['**/*.html'],
    extends: [...ngConfigs.templateAll, ...ngConfigs.templateAccessibility],
    rules: {
      '@angular-eslint/template/i18n': 'off',
      '@angular-eslint/template/prefer-self-closing-tags': 'error',
      // Turning this off to be able to use signals
      // There currently is no way to differentiate between a signal and a function call, other than adding prefixes or suffixes
      '@angular-eslint/template/no-call-expression': 'off',
    },
  },
  {
    name: 'Angular',
    files: ['**/*.component.ts'],
    rules: {
      '@typescript-eslint/no-extraneous-class': 'off',
    },
  },
  {
    name: 'Nx Module Boundaries',
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [
            '^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$',
            '@ng-doc/generated',
          ],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
);
