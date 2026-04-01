## Formbar Configuration vs. Schematics Configuration

There are two configuration files used by _ngx-formbar_

- Formbar Configuration: `formbar.config.ts`
- Schematics Configuration: `formbar.config.json`

The schematics configuration is only used for the schematics and therefore only hold default values. This file is not relevant during runtime. All relevant options are shown on the schematics pages Generators and Register.

## Formbar Configuration Object

The configuration object that is used by the `provideFormbar` function has these properties

| Property                    | Type                                           | Required | Description                                   |
|-----------------------------|------------------------------------------------|----------|-----------------------------------------------|
| componentRegistrations      | Record<string, LoadComponentFn>                | No       | Mapping between keys and controls.            |
| validatorRegistrations      | [key]: (ValidatorFn \| ValidatorKey<T>)[]      | No       | Mapping between keys and validators.          |
| asyncValidatorRegistrations | [key]: (AsyncValidatorFn \| ValidatorKey<T>)[] | No       | Mapping between keys and async validators.    |
| updateOn                    | 'change' \| 'blur' \| 'submit'                 | No       | Specifies when to update the control's value. |
| globalConfig                | NgxFbGlobalConfiguration                       | No       | Configuration that is used for all controls.  |

### NgxFbGlobalConfiguration

This configuration provides a global runtime configuration that is used by all controls, groups or blocks.

| Property        | Type                                                                         | Required | Description                                              |
|-----------------|------------------------------------------------------------------------------|----------|----------------------------------------------------------|
| testIdBuilderFn | `(content: NgxFbBaseContent, name: string, parentTestId?: string) => string` | No       | Function that is used to build the test id for a control |


## Code Splitting

Registering all controls, validators, etc. directly in the _app.config.ts_ is not ideal. _ngx-formbar_ provides multiple approaches to organize your code better.

If you ran `ng add` with default parameters to install _ngx-formbar_ your setup already is using split configurations.

> **Note**
> This section assumes that you have read and understood the Registration Concepts in the Core Concepts guide and know how you need to set the configuration.

### Using defineFormbarConfig

Create a file next to your _app.config.ts_ with this content to get started. The `defineFormbarConfig` function is a helper that provides type support when defining the configuration in a separate file.

```typescript name="formbar.config.ts"
import { defineFormbarConfig } from '@ngx-formbar/reactive-forms';

export const formbarConfig = defineFormbarConfig({
  componentRegistrations: {
    // Component registrations go here
    // e.g. text: () => import('./text-control.component').then(m => m.TextControlComponent)
  },
  // validatorRegistrations are optional
  validatorRegistrations: {
    // Validator registrations go here
  },
  // asyncValidatorRegistrations are optional
  asyncValidatorRegistrations: {
    // Async Validator registrations go here
  },
});
```

In _app.config.ts_ use it like this:

```typescript name="app.config.ts"
import { formbarConfig } from './formbar.config.ts';

export const appConfig: ApplicationConfig = {
  providers: [
    // other providers
    provideFormbar(formbarConfig),
  ],
};
```

### Using Injection Tokens

For more advanced code organization, you can leverage Angular's dependency injection system by providing the tokens directly.

> **Note**
> When using the DI tokens, be aware of how resolution works:
>
> - For components: Your provided map is taken "as is"
> - For validators: Your provided validators are merged with defaults, with your values taking precedence for duplicate keys
> - For global config: Your configuration is deeply merged with defaults

#### Component Registration with Tokens

```typescript name="component-registrations.provider.ts"
import { NGX_FW_COMPONENT_REGISTRATIONS, LoadComponentFn } from '@ngx-formbar/core';

export const componentRegistrationsProvider = {
  provide: NGX_FW_COMPONENT_REGISTRATIONS,
  useValue: new Map<string, LoadComponentFn>([
    ['text-control', () => import('./components/text-control.component').then(m => m.TextControlComponent)],
    ['group', () => import('./components/group.component').then(m => m.GroupComponent)],
    ['info', () => import('./components/info-block.component').then(m => m.InfoBlockComponent)],
    // more registrations...
  ]),
};
```

#### Validator Registration with Tokens

```typescript name="validator-registrations.provider.ts"
import { ValidatorFn, AsyncValidatorFn } from '@angular/forms';
import { NGX_FW_VALIDATOR_REGISTRATIONS, NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS } from '@ngx-formbar/reactive-forms';
import { Validators } from '@angular/forms';
import { letterValidator, noDuplicateValuesValidator, forbiddenLetterAValidator } from './validators';
import { asyncValidator, asyncGroupValidator } from './async-validators';

// Synchronous validators
export const validatorRegistrationsProvider = {
  provide: NGX_FW_VALIDATOR_REGISTRATIONS,
  useValue: new Map<string, ValidatorFn[]>([
    ['min-chars', [Validators.minLength(3)]],
    ['letter', [letterValidator]],
    ['combined', [Validators.minLength(3), Validators.required, letterValidator]],
    ['no-duplicates', [noDuplicateValuesValidator]],
    ['forbidden-letter-a', [forbiddenLetterAValidator]],
    // more registrations...
  ]),
  multi: true,
};

// Asynchronous validators
export const asyncValidatorRegistrationsProvider = {
  provide: NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS,
  useValue: new Map<string, AsyncValidatorFn[]>([
    ['async', [asyncValidator]],
    ['async-group', [asyncGroupValidator]],
    // more registrations...
  ]),
  multi: true,
};
```

In _app.config.ts_ use them like this:

```typescript name="app.config.ts"
import { componentRegistrationsProvider } from './component-registrations.provider';
import { validatorRegistrationsProvider, asyncValidatorRegistrationsProvider } from './validator-registrations.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    // other providers
    provideFormbar(),
    // Custom providers MUST come after provideFormbar()
    componentRegistrationsProvider,
    validatorRegistrationsProvider,
    asyncValidatorRegistrationsProvider,
  ],
};
```

### Multiple Configurations with Injection Tokens

You can also provide multiple configuration objects that will be merged according to their resolution strategy:

```typescript name="split-configurations.provider.ts"
import { NGX_FW_COMPONENT_REGISTRATIONS, NGX_FW_CONFIG, LoadComponentFn } from '@ngx-formbar/core';
import { NGX_FW_VALIDATOR_REGISTRATIONS } from '@ngx-formbar/reactive-forms';

// First set of components
export const baseComponentsProvider = {
  provide: NGX_FW_COMPONENT_REGISTRATIONS,
  useValue: new Map<string, LoadComponentFn>([
    ['text', () => import('./components/text.component').then(m => m.TextComponent)],
    ['number', () => import('./components/number.component').then(m => m.NumberComponent)],
  ]),
};

// Additional components from a different module
export const extraComponentsProvider = {
  provide: NGX_FW_COMPONENT_REGISTRATIONS,
  useValue: new Map<string, LoadComponentFn>([
    ['date', () => import('./components/date.component').then(m => m.DateComponent)],
    ['select', () => import('./components/select.component').then(m => m.SelectComponent)],
  ]),
};

// Multiple global configs will be deep merged
export const baseConfigProvider = {
  provide: NGX_FW_CONFIG,
  useValue: {
    testIdBuilderFn: (content, name, parentTestId) => `${parentTestId ? parentTestId + '-' : ''}${name}`,
  },
  multi: true,
};
```

> **Note**
> When providing multiple maps with the same token:
>
> - For components: Only the last provided map will be used
> - For validators: All maps are collected in an array and merged, with later entries overriding earlier ones
> - For global config: All configs are deeply merged, with nested object properties preserved

### Traditional Code Splitting

For simpler scenarios, you can still split your registration files by type while using the `provideFormbar()` function.

#### Controls Registration

Create a file with the following content, at whatever location makes sense.

```typescript name="controls.registrations.ts"
export const componentRegistrations: ComponentRegistrationConfig = {
  'text-control': () => import('./components/text-control.component').then(m => m.TextControlComponent),
  group: () => import('./components/group.component').then(m => m.GroupComponent),
  info: () => import('./components/info-block.component').then(m => m.InfoBlockComponent),
  // more registrations...
};
```

In _app.config.ts_ use it like this

```typescript name="app.config.ts"
import { componentRegistrations } from './controls.registrations.ts';

export const appConfig: ApplicationConfig = {
  providers: [
    // other providers
    provideFormbar({
      componentRegistrations,
    }),
  ],
};
```

In _formbar.config.ts_ use it like this

```typescript name="formbar.config.ts"
import { componentRegistrations } from './controls.registrations.ts';

export const formbarConfig = defineFormbarConfig({
  // other providers
  componentRegistrations,
});
```

#### Validators Registration

Create a file with the following content, at whatever location makes sense. You can also further split the files between sync and async validators

```typescript name="validators.registrations.ts"
export const validatorRegistrations: ValidatorConfig<RegistrationRecord> = {
  'min-chars': [Validators.minLength(3)],
  letter: [letterValidator],
  combined: ['min-chars', Validators.required, 'letter'],
  'no-duplicates': [noDuplicateValuesValidator],
  'forbidden-letter-a': [forbiddenLetterAValidator],
};

export const asyncValidatorRegistrations: AsyncValidatorConfig<RegistrationRecord> = {
  async: [asyncValidator],
  'async-group': [asyncGroupValidator],
};
```

In _app.config.ts_ use it like this

```typescript name="app.config.ts"
import { validatorRegistrations, asyncValidatorRegistrations } from './validators.registrations.ts';

export const appConfig: ApplicationConfig = {
  providers: [
    // other providers
    provideFormbar({
      validatorRegistrations,
      asyncValidatorRegistrations,
    }),
  ],
};
```

In _formbar.config.ts_ use it like this

```typescript name="formbar.config.ts"
import { componentRegistrations } from './controls.registrations.ts';
import { validatorRegistrations, asyncValidatorRegistrations } from './validators.registrations.ts';

export const formbarConfig = defineFormbarConfig({
  componentRegistrations,
  validatorRegistrations,
  asyncValidatorRegistrations,
});
```

> **Warning**
> Extracting the validator registrations means losing some of the type safety features. Specifically it won't be possible to get warnings when you misspell the key in a reference. It is therefore recommended to keep the validators directly in `defineFormbarConfig` or `provideFormbar` function call.
>
> The following example shows the case where the reference to the `letter` validator is misspelled.

```typescript name="misspelled.validators.registrations.ts"
export const validatorRegistrations: ValidatorConfig<RegistrationRecord> = {
  letter: [letterValidator],
  // ⚠️ letter only spelled with one T.
  // This will give an TS error in the provideFormbar function, but not in this case
  combined: [Validators.required, 'leter'],
};
```

### Global Configuration with Injection Tokens

For advanced scenarios, you can provide global configuration options using the `NGX_FW_CONFIG` injection token.

```typescript name="global-config.provider.ts"
import { NGX_FW_CONFIG } from '@ngx-formbar/core';
import { TestIdBuilderFn } from '@ngx-formbar/core';

// Example test ID builder function
const testIdBuilder: TestIdBuilderFn = (content, name, parentTestId) => {
  return `${parentTestId ? parentTestId + '-' : ''}${name}`;
};

export const globalConfigProvider = {
  provide: NGX_FW_CONFIG,
  useValue: {
    testIdBuilderFn: testIdBuilder,
  },
  multi: true,
};
```

In _app.config.ts_ use it like this:

```typescript name="app.config.ts"
import { globalConfigProvider } from './global-config.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    // other providers
    provideFormbar(),
    globalConfigProvider,
  ],
};
```
