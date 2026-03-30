## v2.0.0

### Overview

The core package has been narrowed to focus on content rendering, expression evaluation, and DI infrastructure. All reactive forms code has been moved to `@ngx-formbar/reactive-forms`.

If you want you could also use the core package alone to build your own implementations or use it as a utility library.

### Added

- Composable functions for expression and state resolution: `resolveExpression`, `resolveInheritableExpression`, `resolveHiddenState`, `resolveDisabledEffect`, `resolveTestId`, `resolveHiddenAttribute`, `resolveUpdateStrategy`
- `NgxfbAbstractControlDirective` as a public API for building custom rendering directives
- String helper utilities via `toSafeString`

### Changed

- Removed `@angular/forms` and `@angular/cdk` as peer dependencies — the package now only depends on `@angular/core`
- Composable functions and low-level services are now part of the public API for consumers building custom form implementations

### Removed

- `NgxfbFormComponent`, `NgxfbControlDirective`, `NgxfbGroupDirective`, `NgxfbBlockDirective` (moved to `@ngx-formbar/reactive-forms`)
- `provideFormbar` and `defineFormbarConfig` (moved to `@ngx-formbar/reactive-forms`)
- `ValidatorConfig`, `AsyncValidatorConfig`, `RegistrationRecord` types (moved to `@ngx-formbar/reactive-forms`)
- `NGX_FW_VALIDATOR_REGISTRATIONS`, `NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS`, `NGX_VALIDATOR_RESOLVER` tokens (moved to `@ngx-formbar/reactive-forms`)
- `ValidatorRegistrationService` (moved to `@ngx-formbar/reactive-forms`)
- All schematics (moved to `@ngx-formbar/schematics`)

### Migration

See [**Migrating from v1**](/changelog/migrating-from-v1) for the full step-by-step guide.
