---
title: Providing Formwork
keyword: ProvidingFormworkPage
sidebar:
  order: 1
---

_ngx-formwork_ is provided and configured in _app.config.ts_.

```ts title="app.config.ts"
export const appConfig: ApplicationConfig = {
  providers: [
    // other providers
    provideFormwork({
      componentRegistrations: {
        // Component registrations go here
      },
      
      // validatorRegistrations are optional
      validatorRegistrations: {
        // Validator registrations go here
        // Following Angular validators are registered by default
        // Validators.required
        // Validators.requiredTrue
        // Validators.email
        // Validators.nullValidator
      },
      
      // asyncValidatorRegistrations are optional
      asyncValidatorRegistrations: {
        // Async Validator registrations go here
      },
    })
  ]
};
```

## Splitting configuration

To avoid bloating your config, put your registrations in a separate file

### Registrations
```ts title="component.registrations.ts"
export const componentRegistrations: ComponentRegistrationConfig = {
  // Component registrations go here
}
```

```ts title="validator.registrations.ts"
export const validatorRegistrations: ValidatorConfig<RegistrationRecord> = {
  // Validator registrations go here
}

export const asyncValidatorRegistrations: AsyncValidatorConfig<RegistrationRecord> = {
  // Async Validator registrations go here
}
```

### Usage

```ts title="app.config.ts"
provideFormwork({
  componentRegistrations,
  validatorRegistrations,
  asyncValidatorRegistrations
})
```
