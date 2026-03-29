## v2.0.0

### Overview
 
New package containing all reactive forms functionality, split from `@ngx-formbar/core`.

### Added 

- **Components:** `NgxfbFormComponent`
- **Directives:** `NgxfbControlDirective`, `NgxfbGroupDirective`, `NgxfbBlockDirective`
- **Host directive configs:** `ngxfbControlHostDirective`, `ngxfbGroupHostDirective`
- **Services:** `FormService`, `ValidatorRegistrationService`
- **Provider setup:** `provideFormbar`, `defineFormbarConfig`
- **Tokens:** `NGX_FW_VALIDATOR_REGISTRATIONS`, `NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS`, `NGX_FW_VALIDATOR_REGISTRATIONS_RESOLVED`, `NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS_RESOLVED`, `NGX_FW_DEFAULT_VALIDATOR_REGISTRATIONS`, `NGX_VALIDATOR_RESOLVER`
- **Types:** `FormbarConfig`, `ValidatorConfig`, `AsyncValidatorConfig`, `RegistrationRecord`, `ValidatorResolver`, `ValidatorKey`
- **Composables:** `withComputedValue`, `setComputedValueEffect`, `withDisabledState`, `disabledEffect`, `withHiddenState`, `withHiddenAttribute`, `hiddenEffect`, `withReadonlyState`, `withValidators`, `withAsyncValidators`, `withUpdateStrategy`, `withDynamicLabel`, `withDynamicTitle`, `withTestId`
- **Helpers:** `controlContainerViewProviders`
- **Schematics:** `ng-add` schematic for automated project setup

### Migration

No migration steps required. This is a new package — install it to replace the reactive forms functionality previously in `@ngx-formbar/core`. See [Migrating from v1](/changelog/migrating-from-v1) for details.
 
