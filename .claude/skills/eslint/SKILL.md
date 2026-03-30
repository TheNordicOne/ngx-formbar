---
name: eslint
description: Key ESLint rules for this project. Activate when writing any `.ts` or `.html` template file — contains lint rules to follow for first-draft compliance. Covers TypeScript strict checking, Angular lint, and import boundaries.
license: MIT
compatibility: Requires eslint, typescript-eslint, angular-eslint
---

# ESLint Compliance

Write code that passes lint on the first draft. Do not rely on lint-then-fix cycles.

## TypeScript Rules (strictTypeChecked + stylisticTypeChecked)

- **`curly: 'all'`** — always use braces, even for single-line `if`/`else`/`for`/`while`
- **`eqeqeq: 'always'`** — strict equality only (`===`, `!==`)
- **`no-else-return`** — no `else` after a block that returns
- **`no-console: 'warn'`** — avoid `console.*` in production code
- **`no-explicit-any`** — `any` is an error; auto-fixes to `unknown`
- **No enums** — `TSEnumDeclaration` is a lint error; use `as const` objects
- **No `I`/`T` prefixes** — interfaces and types use `PascalCase` without hungarian prefixes
- **`prefer-readonly`** — mark properties `readonly` when never reassigned
- **Unused vars are errors** — exception: `_`-prefixed args and rest siblings (`ignoreRestSiblings`)
- **`consistent-type-definitions: off`** — use `interface` or `type` as appropriate

## Angular Rules (tsAll + templateAll + templateAccessibility)

- **OnPush required** — `ChangeDetectionStrategy.OnPush` is enforced
- **Self-closing tags required** — always self-close empty elements in templates
- **Selector prefix** — components: configured prefix + kebab-case; directives: prefix + camelCase
- **`no-call-expression: off`** — disabled to allow signal calls in templates
- **`component-class-suffix: off`** — no enforced class suffix
- **`use-injectable-provided-in: off`** — `providedIn` is not enforced (evaluate per service)
- **`i18n: off`** — template i18n not enforced

## Boundaries Plugin

- Imports are restricted by project boundaries
- `shared` can import from `shared`; `project` from `shared` and same project; `test` from anywhere
- `boundaries/no-unknown` and `boundaries/no-unknown-files` are errors

## Test Files (`*.spec.ts`, `*.cy.ts`)

- `no-console: off`
- `consistent-type-assertions: off` — casting allowed in tests
- `no-extraneous-class: off`
