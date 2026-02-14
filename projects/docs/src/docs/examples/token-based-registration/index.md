

This example demonstrates how to register components and validators using
Angular DI tokens. This is the most explicit approach — you provide each
registration map directly as a provider.

## How It Works

Component registrations use the `NGX_FW_COMPONENT_REGISTRATIONS` token with a `Map<string, Type>`:

```typescript name="component-registrations.ts"
import { Type } from '@angular/core';
import { NGX_FW_COMPONENT_REGISTRATIONS } from '@ngx-formbar/core';

export const componentRegistrationsProvider = {
  provide: NGX_FW_COMPONENT_REGISTRATIONS,
  useValue: new Map<string, Type<unknown>>([
    ['text', TextControlComponent],
    ['number', NumberControlComponent],
    ['checkbox', CheckboxControlComponent],
    // ...
  ]),
};
```

Validator registrations follow the same pattern with `NGX_FW_VALIDATOR_REGISTRATIONS`:

```typescript name="validator-registrations.ts"
import { ValidatorFn, Validators } from '@angular/forms';
import { NGX_FW_VALIDATOR_REGISTRATIONS } from '@ngx-formbar/reactive-forms';

export const validatorRegistrationsProvider = {
  provide: NGX_FW_VALIDATOR_REGISTRATIONS,
  useValue: new Map<string, ValidatorFn[]>([
    ['required', [Validators.required]],
    ['email', [Validators.email]],
    ['min2Characters', [minLen(2)]],
    // ...
  ]),
};
```

Then in `app.config.ts`, you provide everything alongside `provideFormbar()`:

```typescript name="app.config.ts"
import { provideFormbar } from '@ngx-formbar/reactive-forms';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFormbar({}),
    componentRegistrationsProvider,
    validatorRegistrationsProvider,
    asyncValidatorRegistrationsProvider,
  ],
};
```

## Live Demo

{{ NgDocActions.demo("TokenBasedDemoComponent") }}

## Form Configuration Used

<details>
<summary>maintenance-form.ts (click to expand)</summary>

```typescript file="./../../../app/examples/forms/maintenance-form.ts"
```

</details>
