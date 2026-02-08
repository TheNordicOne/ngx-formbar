## Notes

While it is possible to set up everything yourself, it is highly recommended to use the installation via `ng add`.

However, if you want to or have to install it manually, here is the bare minimum setup.

## Installation

Run this npm command.

```bash
npm install ngx-formbar
```

## Providing Formbar
_ngx-formbar_ is provided and configured in _app.config.ts_.


### With Tokens

```typescript name="app.config.ts"
export const appConfig: ApplicationConfig = {
  providers: [
    // other providers
    provideFormbar({
          // Global update strategy (optional)
          updateOn: 'blur', // or 'change' or 'submit'

          // Global configuration options (optional)
          globalConfig: {
            // Global configuration goes here
          }
        }),
        {
          provide: NGX_FW_COMPONENT_REGISTRATIONS,
          useValue: new Map([
            // Component registrations go her
          ])
        },
        // All tokens below are optional
        {
          provide: NGX_FW_VALIDATOR_REGISTRATIONS,
          useValue: new Map([
            // Validator registrations go here
            // Following Angular validators are registered by default
            // Validators.required
            // Validators.requiredTrue
            // Validators.email
            // Validators.nullValidator
          ]),
        },
        {
          provide: NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS,
          useValue: new Map([
            // Async Validator registrations go here
          ]),
        }
  ]
};
```

### With Configuration Object

```typescript name="app.config.ts"
export const appConfig: ApplicationConfig = {
  providers: [
    // other providers
    provideFormbar({
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

      // Global update strategy (optional)
      updateOn: 'blur', // or 'change' or 'submit'

      // Global configuration options (optional)
      globalConfig: {
        // Global configuration goes here
      }
    })
  ]
};
```

In addition to setting up the `app.config.ts`, you must also add a configuration to let formbar know, that you are using the config registration style.

Add this file next to your `app.config.ts`
```json name="formbar.config.json"
{
  "registrationType": "config"
}
```

### Splitting Configuration

To avoid bloating your _app.config.ts_, put your registrations in a separate file. Check out the Code Splitting Section in the Formbar Configuration guide for the details.

## Setting up helpers

Check out the Helper Files guide to see how to set up helpers.
