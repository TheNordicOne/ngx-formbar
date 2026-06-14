ngx-formbar supports native Angular validators and async validators. That means all custom validators are fully supported.

To make validators available to ngx-formbar, you need to register them. You can also combine multiple validators under one key, which is useful when you frequently use certain combinations.

> **Warning**
> You can not combine synchronous validators with async ones!
> Angular itself differentiates between those, so ngx-formbar does too.

## Registration

You can register (async) validators under any name you want. Note that you have to register async validators under a different property.

```typescript name="app.config.ts"
export const appConfig: ApplicationConfig = {
  providers: [
    // other providers
    provideFormbar({
      //...
      // Validators
      validatorRegistrations: {
        // Custom validator
        'forbidden-letter-a': [forbiddenLetterAValidator],
        // Validators with argument
        'min-chars': [Validators.minLength(3)]
      },
      // Async Validators
      asyncValidatorRegistrations: {
        // Custom async validator
        someAsync: [asyncValidator]
      },
    })
  ]
};
```

### Combining Validators

Combining validators is as easy as adding them in the same array. This is also possible for async validators.

> **Note**
> You can use an existing validator registration by referring to it via its key. Sibling key references are type-checked against the keys you have declared, so misspellings raise a TS error and your IDE auto-completes valid references.

```typescript name="app.config.ts"
export const appConfig: ApplicationConfig = {
  providers: [
    // other providers
    provideFormbar({
      //...
      validatorRegistrations: {
        'min-chars': [Validators.minLength(3)],
        letter: [letterValidator],
        combined: ['min-chars', Validators.required, 'letter'],
      }
    })
  ],
};
```

### Splitting Registrations into Their Own Files

When you move your validator registrations into a separate file, wrap them with `defineValidatorRegistrations` (sync) or `defineAsyncValidatorRegistrations` (async). The helpers are identity functions that preserve the inferred key types so cross-references stay type-checked and auto-completed.

```typescript name="validator.registrations.ts"
import { defineValidatorRegistrations, defineAsyncValidatorRegistrations } from '@ngx-formbar/reactive-forms';

export const validatorRegistrations = defineValidatorRegistrations({
  'min-chars': [Validators.minLength(3)],
  letter: [letterValidator],
  combined: ['min-chars', Validators.required, 'letter'],
});

export const asyncValidatorRegistrations = defineAsyncValidatorRegistrations({
  someAsync: [asyncValidator],
});
```

Then pass them into `provideFormbar` (or `defineFormbarConfig`) by reference.

```typescript name="app.config.ts"
import { validatorRegistrations, asyncValidatorRegistrations } from './validator.registrations';

export const appConfig: ApplicationConfig = {
  providers: [
    // other providers
    provideFormbar({
      validatorRegistrations,
      asyncValidatorRegistrations,
    })
  ],
};
```

## Using a Validator

When writing your form configuration, you can add multiple validators for your control. Remember that you need to differentiate between `sync` and `async` validators.

To use a validator for a control, you refer to it by its key.

```typescript name="example.form.ts"
export const exampleForm: NgxFbForm = {
  content: {
    username: {
      type: 'text',
      label: 'Username',
      defaultValue: 'UsernameSuggestion123',
      validators: ['min5Characters', 'required', 'blacklist'],
      asyncValidators: ['usernameIsFreeValidator'],
    }
  }
};
```

## Default Validators

For convenience some static validators, that are built into Angular, are registered by default. Built-in functions that return a validator, like `Validators.minLength` cannot be provided by default, as they require an argument.

Check out the [Validators Documentation on angular.dev](https://angular.dev/api/forms/Validators) to see how these work.

The following validators are registered by default:
- Validators.required
- Validators.requiredTrue
- Validators.email
- Validators.nullValidator

## Adding Custom Validators

ngx-formbar uses the standard Angular validator functions. Writing your own is exactly the same as in Angular itself. See ["Defining a custom validator" on the official docs](https://angular.dev/guide/forms/form-validation#defining-custom-validators).


### Validator

This example uses a forbidden letter validator that ensures the letter "A" is not used.

```typescript name="forbidden-letter.validator.ts"
export function forbiddenLetterAValidator(
  control: AbstractControl<unknown>,
): ValidationErrors | null {
  const value = control.value;
  if (!value) {
    return null;
  }
  if (typeof value !== 'object') {
    const includesA = containsText(value, 'a');
    return includesA ? { forbiddenLetterA: { value } } : null;
  }

  const values = Object.values(value);
  const someValueIncludesA = values.some((v) => containsText(v, 'a'));
  return someValueIncludesA ? { forbiddenLetterA: { value } } : null;
}
```

You can then register this validator under any name you want.
```typescript name="app.config.ts"
validatorRegistrations: {
  'forbidden-letter-a': [forbiddenLetterAValidator]
}
```
### Async Validator

Async validators work pretty much the same as synchronous ones.

This example uses a validator that ensures the text contains the word "async".

> **Note**
> Async validators usually do some checks on the server.
> For this example, we only pretend to do so by creating a dummy observable.

```typescript name="async.validator.ts"
export function asyncValidator(
  control: AbstractControl<string | undefined | null>,
): Observable<ValidationErrors | null> {
  const value = control.value;
  if (containsText(value, 'async')) {
    return of(null);
  }
  return of({ async: { value } });
}
```

You can then register this validator under any name you want
```typescript name="app.config.ts"
asyncValidatorRegistrations: {
  async: [asyncValidator]
}
```
