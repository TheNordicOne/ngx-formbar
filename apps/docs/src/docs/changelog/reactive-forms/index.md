## v2.0.0

### Overview

New package containing all reactive forms functionality previously in `@ngx-formbar/core`. Components register via a plain interface contract: implement `ReactiveFormbarControl<T>`, `ReactiveFormbarGroup<T>`, or `FormbarBlock<T>` and declare matching `input()` signals. No host directives and no directive injection on consumer components. See [Controls](/reactive-forms/guides/controls).

### Added

- Component contract types: `ReactiveFormbarAbstractControl`, `ReactiveFormbarControl<T>`, `ReactiveFormbarGroup<T>`, `ReactiveFormbarArray<T>`, `FormbarBlock<T>`.
- Components: `NgxFbFormComponent` (root, takes `formConfig`), `NgxFbControlOutlet` (selector `<ngxfb-control-outlet />`), `NgxFbFormArrayOutlet`.
- Directives (internal, used by the outlet): `NgxFbControlDirective`, `NgxFbGroupDirective`, `NgxFbArrayDirective`, `NgxFbBlockDirective`.
- Provider setup: `provideFormbar`, `defineFormbarConfig`, `defineValidatorRegistrations`, `defineAsyncValidatorRegistrations`.
- Validator map helpers: `toValidatorRegistrationMap`, `toAsyncValidatorRegistrationMap` ([#65](https://github.com/TheNordicOne/ngx-formbar/issues/65)). See [Validation](/reactive-forms/guides/validation).
- Services: `FormService`, `ValidatorRegistrationService`.
- Tokens: `NGXFB_CONTROL_ENTRIES`, `NGX_FW_VALIDATOR_REGISTRATIONS`, `NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS`, `NGX_FW_VALIDATOR_REGISTRATIONS_RESOLVED`, `NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS_RESOLVED`, `NGX_FW_DEFAULT_VALIDATOR_REGISTRATIONS`, `NGX_FW_DEFAULT_ASYNC_VALIDATOR_REGISTRATIONS`, `NGX_VALIDATOR_RESOLVER`.
- Types: `FormbarConfig`, `ValidatorConfig`, `AsyncValidatorConfig`, `RegistrationRecord`, `ValidatorKey`, `ValidatorResolver`.
- Composables: `setComputedValueEffect`, `disabledEffect`, `hiddenEffects`, `withValidators`, `withAsyncValidators`.
- Helpers: `controlContainerViewProviders`.
- Form-level lifecycle cache. Values from destroyed controls are restored when the control is recreated, and cleared on form reset.
- Schematics: `ng-add` schematic for automated project setup.
- Form arrays. Repeating rows from a single `rowControl`, backed by a native `FormArray`. See [Arrays](/reactive-forms/guides/arrays).

### Changed

- Component authoring is interface-based. Consumer components implement the contract interfaces and declare `input()` signals; no host directive and no directive to inject.
- Group composition uses `<ngxfb-control-outlet />`. See [Groups](/reactive-forms/guides/groups).
- The hidden lifecycle destroys and recreates the consumer component (with `hiddenHandling: 'auto'`, the default), for both `hideStrategy: 'keep'` and `'remove'`. See [Blocks](/reactive-forms/guides/blocks).
- Visibility and disabled handling are per-registration: `hiddenHandling` and `disabledHandling` (`'auto' | 'manual'`) are read from the registration entry.
- `hiddenEffects` orchestrates the mount and form-attachment hooks via `onHidden` / `onVisible` callbacks.
- `setComputedValueEffect` only runs when a `computedValue` is configured.
- `provideFormbar` accepts `ComponentRegistrationEntry` values in `componentRegistrations`. See [Register](/fundamentals/register).
- Schematics generate `ComponentRegistrationEntry`-based registrations.

### Fixed

- `hideStrategy: 'remove'` with automatic visibility handling no longer raises `Cannot find control` ([#64](https://github.com/TheNordicOne/ngx-formbar/issues/64)).
- `setComputedValueEffect` no longer overwrites control values with `undefined` on dirty forms when no `computedValue` is configured.
- `valueStrategy: 'last'` now survives `hideStrategy: 'remove'` cycles.
- Form reset clears the lifecycle cache, preventing stale values from being restored.

### Removed

- `NgxfbAbstractControlDirective`.
- Host directive helpers `ngxfbControlHostDirective`, `ngxfbGroupHostDirective`, `ngxfbBlockHostDirective`.
- The earlier `Ngxfb…` directive class names. Directive classes now use a consistent capital `Fb`: `NgxFbControlDirective`, `NgxFbGroupDirective`, `NgxFbBlockDirective`.
- `setVisibilityHandling()` runtime method. Declare `hiddenHandling` on the component registration instead.

### Migration

No migration steps within this package; it is new. Users coming from v1 of `@ngx-formbar/core` should install `@ngx-formbar/reactive-forms` to replace the reactive-forms functionality previously in core. See [Migrating from v1](/changelog/migrating-from-v1).
