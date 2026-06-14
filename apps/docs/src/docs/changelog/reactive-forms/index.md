## v2.0.0

### Overview

New package containing all reactive forms functionality previously bundled in `@ngx-formbar/core`. Components register against the form via a plain interface contract: implement `ReactiveFormbarControl<T>`, `ReactiveFormbarGroup<T>`, or `FormbarBlock<T>` and declare matching `input()` signals. No host directives and no directive injection on consumer components.

### Added

- **Component contract types:** `ReactiveFormbarAbstractControl`, `ReactiveFormbarControl<T>`, `ReactiveFormbarGroup<T>`, `ReactiveFormbarArray<T>`, `FormbarBlock<T>`. The custom properties on `T` (beyond `NgxFbControl` / `NgxFbFormGroup` / `NgxFbArray` / `NgxFbBlock`) become additional signal inputs the consumer declares.
- **Components:** `NgxFbFormComponent` (root, takes `formConfig`), `NgxFbControlOutlet` (selector `<ngxfb-control-outlet />`, used inside group components to render their children), and `NgxFbFormArrayOutlet` (renders array rows).
- **Directives (mostly internal, used by the outlet, not by consumers):** `NgxFbControlDirective`, `NgxFbGroupDirective`, `NgxFbArrayDirective`, `NgxFbBlockDirective`.
- **Provider setup:** `provideFormbar`, `defineFormbarConfig`, `defineValidatorRegistrations`, `defineAsyncValidatorRegistrations`.
- **Validator map helpers:** `toValidatorRegistrationMap`, `toAsyncValidatorRegistrationMap`. Use them in token-based providers (`NGX_FW_VALIDATOR_REGISTRATIONS` / `NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS`) so that cross-references between sibling validators stay type-checked, resolved at runtime, and discoverable through auto-complete ([#65](https://github.com/TheNordicOne/ngx-formbar/issues/65)).
- **Services:** `FormService`, `ValidatorRegistrationService`.
- **Tokens:** `NGXFB_CONTROL_ENTRIES`, `NGX_FW_VALIDATOR_REGISTRATIONS`, `NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS`, `NGX_FW_VALIDATOR_REGISTRATIONS_RESOLVED`, `NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS_RESOLVED`, `NGX_FW_DEFAULT_VALIDATOR_REGISTRATIONS`, `NGX_FW_DEFAULT_ASYNC_VALIDATOR_REGISTRATIONS`, `NGX_VALIDATOR_RESOLVER`.
- **Types:** `FormbarConfig`, `ValidatorConfig`, `AsyncValidatorConfig`, `RegistrationRecord`, `ValidatorKey`, `ValidatorResolver`.
- **Composables:** `setComputedValueEffect`, `disabledEffect`, `hiddenEffects`, `withValidators`, `withAsyncValidators`. (Resolution-only composables such as `withDynamicLabel`, `withHiddenState`, `withDisabledState`, `withReadonlyState`, `withTestId`, `withUpdateStrategy`, `withComputedValue`, `withDynamicTitle` live in `@ngx-formbar/core`.)
- **Helpers:** `controlContainerViewProviders`.
- **Form-level lifecycle cache.** Values from destroyed controls are stored against their form path and restored when the control is recreated, so `valueStrategy: 'last'` survives hide/show and `hideStrategy: 'remove'` cycles, and follows array rows by identity. The cache is cleared on form reset.
- **Schematics:** `ng-add` schematic for automated project setup.
- **Form arrays.** Repeating rows from a single `rowControl`, backed by a native `FormArray`.

### Changed

- **Component authoring is interface-based.** Consumer components implement `ReactiveFormbarControl<T>` / `ReactiveFormbarGroup<T>` / `FormbarBlock<T>` and declare the corresponding `input()` signals. Inputs are wired via `createComponent` bindings; there is no host directive on the consumer component and no directive to inject.
- **Group composition uses `<ngxfb-control-outlet />`.** Group components place the outlet in their template wherever child controls should appear; child entries flow in via `NGXFB_CONTROL_ENTRIES`.
- **The hidden lifecycle destroys and recreates the consumer component.** With `hiddenHandling: 'auto'` (the default), the directive clears its host and unmounts the consumer component when the resolved hidden state becomes true, then mounts a fresh instance when it becomes false again. This applies for both `hideStrategy: 'keep'` and `hideStrategy: 'remove'`. The two strategies differ only in what happens to the underlying form control: `'keep'` leaves it attached to the parent group, `'remove'` removes it from the parent group on hide and reattaches it on show.
- **Visibility and disabled handling are per-registration.** `hiddenHandling: 'auto' | 'manual'` and `disabledHandling: 'auto' | 'manual'` are read from the component registration entry. With `'auto'` the directive applies state automatically; with `'manual'` the consumer component owns it.
- **`hiddenEffects` orchestrates the mount and form-attachment hooks.** The directive provides `onHidden` / `onVisible` callbacks for its own attach/detach policy and value-strategy application.
- **`setComputedValueEffect` only runs when a `computedValue` is configured.** It requires an `isComputedValueDefined` signal and never overwrites values on controls that don't opt in.
- **`provideFormbar` accepts `ComponentRegistrationEntry` values** in `componentRegistrations`. Use `staticComponent()` for static or `loadComponent()` for lazy registrations. Registrations also carry `hiddenHandling` and `disabledHandling`.
- **Schematics generate `ComponentRegistrationEntry`-based registrations.**

### Fixed

- Using `hideStrategy: 'remove'` with automatic visibility handling no longer raises `Cannot find control`. The directive coordinates component destruction with control removal and reattachment ([#64](https://github.com/TheNordicOne/ngx-formbar/issues/64)).
- `setComputedValueEffect` no longer overwrites control values with `undefined` on dirty forms when no `computedValue` is configured.
- `valueStrategy: 'last'` now survives `hideStrategy: 'remove'` cycles. The saved value is preserved across destroy/create via the form-level lifecycle cache and reapplied when the control is recreated.
- Form reset clears the lifecycle cache, preventing stale values from being restored after a reset.

### Removed

- `NgxfbAbstractControlDirective`. Superseded by per-kind directives backed by composables.
- Host directive helpers `ngxfbControlHostDirective`, `ngxfbGroupHostDirective`, and `ngxfbBlockHostDirective`. Consumer components no longer need host directives.
- The earlier `Ngxfb…` directive class names. All directive classes now use a consistent capital `Fb`: `NgxFbControlDirective`, `NgxFbGroupDirective`, `NgxFbBlockDirective`.
- `setVisibilityHandling()` runtime method. Declare `hiddenHandling` on the component registration instead.

### Migration

No migration steps within `@ngx-formbar/reactive-forms`. This is a new package. Users coming from v1 of `@ngx-formbar/core` should install `@ngx-formbar/reactive-forms` to replace the reactive-forms functionality previously in core. See [Migrating from v1](/changelog/migrating-from-v1) for the full guide.
