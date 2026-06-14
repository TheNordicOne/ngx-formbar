## v2.0.0

### Overview

The core package now focuses on content rendering, expression evaluation, and DI infrastructure. All reactive forms code moved to `@ngx-formbar/reactive-forms`. Core can also be used on its own to build custom implementations.

### Added

- Composable functions for expression and state resolution: `resolveExpression`, `resolveInheritableExpression`, `resolveHiddenState`, `resolveTestId`, `resolveHiddenAttribute`, `resolveUpdateStrategy`.
- Form-agnostic composables with no `@angular/forms` dependency: `withBase`, `withComponentHost` (with `ComponentHost` and `ComponentHostOptions` types), `withInheritedValue`, `withLoadedComponent`.
- `FormConfigEntry<T>` content-binding type (`{ name: string; config: T }`).
- `toSignalMap` helper and `SignalMapFor<T>` type for building the typed `Map<string, Signal<unknown>>` consumed by `withComponentHost`.
- Form-state composables reading from new DI tokens: `withDynamicLabel`, `withDynamicTitle`, `withComputedValue`, `withHiddenState`, `withDisabledState`, `withReadonlyState`, `withTestId`, `withUpdateStrategy`.
- `NGX_FW_FORM_VALUE` token (`Signal<FormContext>`): per-form provider for the current form value.
- `NGX_FW_PARENT_CONTEXT` token and `NgxFwParentContext` interface: contract for a parent group's state and inheritable directive options.
- Type guards for narrowing content entries: `isFormbarControl`, `isFormbarGroup`, `isFormbarArray`, `isFormbarBlock`.
- Utility types for consumer-facing component contracts: `SignalInput<T>`, `ToSignalInputs<T>`, `RemoveIndexSignature<T>`, `BlockManagedKeys`, `ExtendedBlockInputs<T>`.
- `disabledHandling?: StateHandling` option on component registrations (default `'auto'`).
- String helper utility `toSafeString`.
- Form array config type `NgxFbArray<T>`, now part of the `NgxFbItem` union.

### Changed

- Peer dependencies limited to `@angular/core` (`>=20.0.0 <22.0.0`) and `rxjs` (`>=7.0.0`). `@angular/forms` and `@angular/cdk` no longer required.
- Composable functions and low-level services are now part of the public API.
- Component registrations use `ComponentRegistrationEntry` instead of bare `Type<unknown>`. Each entry is static (`{ component: Type<unknown> }`) or lazy (`{ loadComponent: LoadComponentFn }`), with optional `ComponentRegistrationOptions`. Use `staticComponent()` or `loadComponent()`. See [Register](/fundamentals/register).
- Registration option `visibilityHandling` renamed to `hiddenHandling` (`StateHandling = 'auto' | 'manual'`, default `'auto'`).
- Type `NgxFbContent` renamed to `NgxFbItem` (`NgxFbFormGroup | NgxFbControl | NgxFbArray | NgxFbBlock`).

### Removed

- `NgxFbFormComponent`, `NgxFbControlDirective`, `NgxFbGroupDirective`, `NgxFbBlockDirective` (moved to `@ngx-formbar/reactive-forms`).
- `provideFormbar` and `defineFormbarConfig` (moved to `@ngx-formbar/reactive-forms`).
- `ValidatorConfig`, `AsyncValidatorConfig`, `RegistrationRecord` types (moved to `@ngx-formbar/reactive-forms`).
- `NGX_FW_VALIDATOR_REGISTRATIONS`, `NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS`, `NGX_VALIDATOR_RESOLVER` tokens (moved to `@ngx-formbar/reactive-forms`).
- `ValidatorRegistrationService` (moved to `@ngx-formbar/reactive-forms`).
- All schematics (moved to `@ngx-formbar/schematics`).

### Expression engine

The expression language for `Expression<T>` strings was hardened and now uses an in-tree allow-list parser adapted from [jsep](https://github.com/EricSmekens/jsep) (MIT), removing the runtime `acorn` dependency. See [Expressions](/fundamentals/expressions) and [Migration Step 10](/changelog/migrating-from-v1#step-10-audit-string-based-expressions) for the behavior changes.

### Migration

See [Migrating from v1](/changelog/migrating-from-v1), including [Step 10](/changelog/migrating-from-v1#step-10-audit-string-based-expressions) for the expression-language behavior changes.
