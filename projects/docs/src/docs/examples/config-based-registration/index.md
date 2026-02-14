

This example demonstrates the config-based registration approach using
`defineFormbarConfig()`. Instead of providing DI tokens manually, you pass
everything through a single configuration object.

## How It Works

Define registrations as plain objects:

```typescript name="component-registrations.ts"
import { ComponentRegistrationConfig } from '@ngx-formbar/core';

export const componentRegistrations: ComponentRegistrationConfig = {
  text: TextControlComponent,
  number: NumberControlComponent,
  checkbox: CheckboxControlComponent,
  // ...
};
```

```typescript name="validator-registrations.ts"
import { ValidatorConfig, RegistrationRecord } from '@ngx-formbar/reactive-forms';
import { Validators } from '@angular/forms';

export const validatorRegistrations: ValidatorConfig<RegistrationRecord> = {
  required: [Validators.required],
  email: [Validators.email],
  min2Characters: [minLen(2)],
  // ...
};
```

Then use `defineFormbarConfig()` and pass to `provideFormbar()`:

```typescript name="app.config.ts"
import { provideFormbar, defineFormbarConfig } from '@ngx-formbar/reactive-forms';

const formbarConfig = defineFormbarConfig({
  componentRegistrations,
  validatorRegistrations,
  asyncValidatorRegistrations,
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideFormbar(formbarConfig),
  ],
};
```

This is the recommended approach — it's more concise and type-safe.

## Live Demo

The form rendered below is identical to the token-based example.
The difference is purely in how the registrations are wired up.

{{ NgDocActions.demo("ConfigBasedDemoComponent") }}

## Form Configuration Used

<details>
<summary>maintenance-form.ts (click to expand)</summary>

```typescript file="./../../../app/examples/forms/maintenance-form.ts"
```

</details>
