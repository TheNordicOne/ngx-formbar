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

## Splitting Configuration

To avoid bloating your _app.config.ts_, put your registrations in a separate file. Checkout the [Code Splitting Section](/guides/improvements#code-splitting) for the details.
