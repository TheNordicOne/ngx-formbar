## v2.0.0

### Overview
 
New package containing all reactive forms functionality, split from `@ngx-formbar/core`.

### Added 

- **Components:** `NgxfbFormComponent`
- **Directives:** `NgxfbAbstractControlDirective`, `NgxfbControlDirective`, `NgxfbGroupDirective`, `NgxfbBlockDirective`
- **Host directive configs:** `ngxfbControlHostDirective`, `ngxfbGroupHostDirective`
- **Services:** `FormService`, `ValidatorRegistrationService`
- **Provider setup:** `provideFormbar`, `defineFormbarConfig`
- **Tokens:** `NGX_FW_VALIDATOR_REGISTRATIONS`, `NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS`, `NGX_FW_VALIDATOR_REGISTRATIONS_RESOLVED`, `NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS_RESOLVED`, `NGX_FW_DEFAULT_VALIDATOR_REGISTRATIONS`, `NGX_VALIDATOR_RESOLVER`
- **Types:** `FormbarConfig`, `ValidatorConfig`, `AsyncValidatorConfig`, `RegistrationRecord`, `ValidatorResolver`, `ValidatorKey`
- **Composables:** `withComputedValue`, `setComputedValueEffect`, `withDisabledState`, `disabledEffect`, `withHiddenState`, `withHiddenAttribute`, `hiddenEffect`, `withReadonlyState`, `withValidators`, `withAsyncValidators`, `withUpdateStrategy`, `withDynamicLabel`, `withDynamicTitle`, `withTestId`
- **Helpers:** `controlContainerViewProviders`
- **Schematics:** `ng-add` schematic for automated project setup

### Changed

- `NgxfbAbstractControlDirective` now supports both static and lazy component registrations via `ComponentRegistrationEntry`
- `NgxfbAbstractControlDirective` structurally removes components when `hideStrategy: 'remove'` is used — the component is destroyed when hidden and recreated when shown
- `hiddenEffect` no longer handles the `remove` strategy — it only manages `keep` strategy (attach control, apply value strategy while hidden)
- `hiddenEffect` and `withHiddenAttribute` now accept a `handleVisibility` boolean signal instead of a `StateHandling` string signal
- `setComputedValueEffect` now requires an `isComputedValueDefined` signal parameter — the effect only runs when a `computedValue` is explicitly configured
- `NgxfbControlDirective`, `NgxfbGroupDirective`, and `NgxfbBlockDirective` now read `visibilityHandling` from the component registration instead of a runtime method call
- `NgxfbControlDirective` and `NgxfbGroupDirective` now inject `FORM_LIFECYCLE_STATE` for value save/restore across hide/show cycles
- `NgxfbFormComponent` now provides `FORM_LIFECYCLE_STATE` — a form-level cache that stores control values when they are destroyed and restores them on re-creation based on the `valueStrategy`
- `provideFormbar` accepts `ComponentRegistrationEntry` values in `componentRegistrations` — use `staticComponent()` for static or `loadComponent()` for lazy
- Schematics generate `ComponentRegistrationEntry`-based registrations

### Fixed

- Using `hideStrategy: 'remove'` with automatic visibility handling no longer causes `Cannot find control` errors ([#64](https://github.com/TheNordicOne/ngx-formbar/issues/64))
- `setComputedValueEffect` no longer overwrites control values with `undefined` on dirty forms when no `computedValue` is configured
- Form reset now clears the lifecycle state cache, preventing stale values from being restored

### Added

- **Service:** `FormLifecycleState` — form-level cache for control values across destroy/create cycles
- **Token:** `FORM_LIFECYCLE_STATE`

### Removed

- `setVisibilityHandling()` method from `NgxfbControlDirective`, `NgxfbGroupDirective`, and `NgxfbBlockDirective` — use `visibilityHandling` in the component registration instead (e.g., `staticComponent(MyComponent, { visibilityHandling: 'manual' })`)

### Migration

No migration steps required. This is a new package — install it to replace the reactive forms functionality previously in `@ngx-formbar/core`. See [Migrating from v1](/changelog/migrating-from-v1) for details.
 
