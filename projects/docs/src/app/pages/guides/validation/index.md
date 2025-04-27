---
keyword: ValidationPage
---

__Formwork__ supports native Angular validators and async validators. That means, that all custom validators are fully supported.

To make the validators available to __formwork__ they need to be registered. You can also combine multiple validators under one key, which is useful if you frequently use certain combinations of validators.

> **Warning**
> You can not combine synchronous validators with async ones!
> Angular itself differentiates between those, so __formwork__ does to.

## Registration

You can register (async) validators under any name you want. Note, that you have to register async validators under a different property.

```ts name="app.config.ts"
export const appConfig: ApplicationConfig = {
  providers: [
    // other providers
    provideFormwork({
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
> You can use an existing validator registration by referring to it via its key.
```ts name="app.config.ts"
provideFormwork({
  //...
  validatorRegistrations: {
    'min-chars': [Validators.minLength(3)],
    letter: [letterValidator],
    combined: ['min-chars', Validators.required, 'letter'],
  }
})
```

## Using a validator

When writing your form configuration, you can add multiple validators for your control. Remember that you need differentiate between `sync` and `async` validators.

To use a validator for a control, you refer to it by its key.

```ts name="example.form.ts"
export const exampleForm: NgxFwContent[] = [
  {
    type: 'text',
    id: 'username',
    label: 'Username',
    default: 'UsernameSuggestion123',
    validators: ['min5Characters', 'required', 'blacklist'],
    asyncValidators: ['usernameIsFreeValidator'],
  }
]
```

## Default Validators

For convenience some static validators, that are built into Angular, are registered by default. Built-in functions that return a validator, like `Validators.minLength` cannot be provided by default, as they require an argument.

Checkout the [Validators Documentation on angular.dev](https://angular.dev/api/forms/Validators) to see how these work.

The following validators are registered by default:
- Validators.required
- Validators.requiredTrue
- Validators.email
- Validators.nullValidator

## Adding Custom Validators

_ngx-formwork_ uses the standard Angular validator functions. That means that writing your own is exactly the same as in Angular itself. Checkout ["Defining a custom validator" on the official docs](https://angular.dev/guide/forms/form-validation#defining-custom-validators).


### Validator

This example uses a forbidden letter validator, that ensure the letter "A" is not used.

```ts name="forbidden-letter.validator.ts"
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
```ts name="app.config.ts"
validatorRegistrations: {
  'forbidden-letter-a': [forbiddenLetterAValidator]
}
```
### Async Validator

Async validators work pretty much the same as synchronous ones.

This example uses a validator, that ensure the text contains the word "async".

> **Note**
> Async validators usually do some checks on the server.
> For this example we only pretend to do so by creating a dummy observable

```ts name="async.validator.ts"
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
```ts name="app.config.ts"
asyncValidatorRegistrations: {
  async: [asyncValidator]
}
```
