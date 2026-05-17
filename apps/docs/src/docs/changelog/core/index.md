## v2.0.0

### Overview

The core package has been narrowed to focus on content rendering, expression evaluation, and DI infrastructure. All reactive forms code has been moved to `@ngx-formbar/reactive-forms`.

If you want, you can also use the core package on its own to build your own implementations, or use it as a utility library.

### Added

- Composable functions for expression and state resolution: `resolveExpression`, `resolveInheritableExpression`, `resolveHiddenState`, `resolveTestId`, `resolveHiddenAttribute`, `resolveUpdateStrategy`
- Form-agnostic composables for component registration lookup, dynamic mounting, and value inheritance: `withBase`, `withComponentHost` (with `ComponentHost` and `ComponentHostOptions` types), `withInheritedValue`, `withLoadedComponent`. These have no dependency on `@angular/forms` and are available to any consumer that builds on top of `@ngx-formbar/core`
- `FormConfigEntry<T>` content-binding type (`{ name: string; config: T }`) used by directive inputs and outlets that render a single named entry from a configuration tree
- `toSignalMap` helper and `SignalMapFor<T>` type for building the typed `Map<string, Signal<unknown>>` consumed by `withComponentHost`. Anchoring the record to a directive interface forces every key and signal type to match the contract, so stray keys, typos, and stale entries fail to compile
- Form-state composables that wrap the existing `resolve*` functions and read from new DI tokens: `withDynamicLabel`, `withDynamicTitle`, `withComputedValue`, `withHiddenState`, `withDisabledState`, `withReadonlyState`, `withTestId`, `withUpdateStrategy`. Each runs in any injection context that has the required tokens provided
- `NGX_FW_FORM_VALUE` token (`Signal<FormContext>`) — per-form provider for the current form value, consumed by composables that evaluate expressions. Integrations supply this from their form-state source
- `NGX_FW_PARENT_CONTEXT` token and `NgxFwParentContext` interface — contract for a parent group's state and inheritable directive options (`isHidden`, `isDisabled`, `isReadonly`, `testId`, `hideStrategy`, `valueStrategy`, `updateStrategy`). Group directives provide themselves; child composables read with `{ optional: true, skipSelf: true }`
- Type guards for narrowing content entries: `isFormbarControl`, `isFormbarGroup`, `isFormbarBlock`. Each accepts either a value or a `Signal` and narrows to the corresponding `NgxFbControl` / `NgxFbFormGroup` / `NgxFbBlock` shape
- Utility types for building consumer-facing component contracts on top of Angular signal inputs: `SignalInput<T>`, `ToSignalInputs<T>`, `RemoveIndexSignature<T>`, `BlockManagedKeys`, `ExtendedBlockInputs<T>`. Used by `@ngx-formbar/reactive-forms` to derive the public input surface for blocks
- New `disabledHandling?: StateHandling` option on component registrations, mirroring the existing visibility option. When set to `'manual'`, the library leaves the underlying form control's disabled state alone and the component receives the resolved `isDisabled` signal to apply itself. Defaults to `'auto'`

### Changed

- Peer dependencies are now limited to `@angular/core` (`>=20.0.0 <22.0.0`). `@angular/forms` and `@angular/cdk` are no longer required by the core package
- Composable functions and low-level services are now part of the public API for consumers building custom form implementations
- Component registrations now use `ComponentRegistrationEntry` instead of bare `Type<unknown>`. Each entry is either a static registration (`{ component: Type<unknown> }`) or a lazy registration (`{ loadComponent: LoadComponentFn }`), optionally with a `ComponentRegistrationOptions`. Helper functions `staticComponent()` and `loadComponent()` accept an optional second argument for these options. The `NGX_FW_COMPONENT_REGISTRATIONS` token and `ComponentResolver` interface use `ComponentRegistrationEntry` accordingly
- Registration option renamed: `visibilityHandling` is now `hiddenHandling` (still typed as `StateHandling = 'auto' | 'manual'`, default `'auto'`). Update any registrations that previously passed `{ visibilityHandling: 'manual' }` to `{ hiddenHandling: 'manual' }`
- Type renamed: `NgxFbContent` is now `NgxFbItem`. The shape is unchanged (`NgxFbFormGroup | NgxFbControl | NgxFbBlock`). Update any imports or type annotations that referenced `NgxFbContent`

### Removed

- `NgxfbFormComponent`, `NgxfbControlDirective`, `NgxfbGroupDirective`, `NgxfbBlockDirective` (moved to `@ngx-formbar/reactive-forms`)
- `provideFormbar` and `defineFormbarConfig` (moved to `@ngx-formbar/reactive-forms`)
- `ValidatorConfig`, `AsyncValidatorConfig`, `RegistrationRecord` types (moved to `@ngx-formbar/reactive-forms`)
- `NGX_FW_VALIDATOR_REGISTRATIONS`, `NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS`, `NGX_VALIDATOR_RESOLVER` tokens (moved to `@ngx-formbar/reactive-forms`)
- `ValidatorRegistrationService` (moved to `@ngx-formbar/reactive-forms`)
- All schematics (moved to `@ngx-formbar/schematics`)

### Migration

See [**Migrating from v1**](/changelog/migrating-from-v1) for the full step-by-step guide.
