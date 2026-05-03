## v2.0.0

### Overview

New package containing all reactive forms functionality previously bundled in `@ngx-formbar/core`. Components register against the form via a plain interface contract: implement `ReactiveFormbarControl<T>`, `ReactiveFormbarGroup<T>`, or `FormbarBlock<T>` and declare matching `input()` signals. No host directives, no directive injection, no boilerplate on consumer components.

### Added

- **Component contract types:** `ReactiveFormbarAbstractControl`, `ReactiveFormbarControl<T>`, `ReactiveFormbarGroup<T>`, `FormbarBlock<T>`. The custom properties on `T` (beyond `NgxFbControl` / `NgxFbFormGroup` / `NgxFbBlock`) become additional signal inputs the consumer declares.
- **Components:** `NgxfbFormComponent` (root, takes `formConfig`) and `NgxfbControlOutlet` (selector `<ngxfb-control-outlet />`, used inside group components to render their children).
- **Directives (mostly internal, used by the outlet, not by consumers):** `NgxFbControlDirective`, `NgxFbGroupDirective`, `NgxfbBlockDirective`.
- **Provider setup:** `provideFormbar`, `defineFormbarConfig`.
- **Services:** `FormService`, `ValidatorRegistrationService`.
- **Tokens:** `NGXFB_CONTROL_ENTRIES`, `NGX_FW_VALIDATOR_REGISTRATIONS`, `NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS`, `NGX_FW_VALIDATOR_REGISTRATIONS_RESOLVED`, `NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS_RESOLVED`, `NGX_FW_DEFAULT_VALIDATOR_REGISTRATIONS`, `NGX_FW_DEFAULT_ASYNC_VALIDATOR_REGISTRATIONS`, `NGX_VALIDATOR_RESOLVER`.
- **Types:** `FormbarConfig`, `ValidatorConfig`, `AsyncValidatorConfig`, `RegistrationRecord`, `ValidatorKey`, `ValidatorResolver`.
- **Composables:** `withFormParent`, `withControlState`, `withComputedValue`, `setComputedValueEffect`, `withDisabledState`, `withDisabledLifecycle`, `disabledEffect`, `withHiddenState`, `withHiddenAttribute`, `hiddenEffects`, `withReadonlyState`, `withValidators`, `withAsyncValidators`, `withUpdateStrategy`, `withDynamicLabel`, `withDynamicTitle`, `withTestId`.
- **Helpers:** `controlContainerViewProviders`.
- **Form-level lifecycle cache.** Values from destroyed controls are stored against their dotted form path and restored when the control is recreated, so `valueStrategy: 'last'` survives both hide/show cycles and `hideStrategy: 'remove'` cycles. The cache is cleared on form reset.
- **Schematics:** `ng-add` schematic for automated project setup.

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
- The earlier `NgxfbControlDirective` / `NgxfbGroupDirective` class names. Replaced by `NgxFbControlDirective` / `NgxFbGroupDirective` (capital `Fb`). `NgxfbBlockDirective` keeps its name.
- `setVisibilityHandling()` runtime method. Declare `hiddenHandling` on the component registration instead.

### Migration

No migration steps within `@ngx-formbar/reactive-forms`. This is a new package. Users coming from v1 of `@ngx-formbar/core` should install `@ngx-formbar/reactive-forms` to replace the reactive-forms functionality previously in core. See [Migrating from v1](/changelog/migrating-from-v1) for the full guide.
