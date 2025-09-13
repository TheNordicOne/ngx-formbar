---
title: Improvements & DRY Code
keyword: HelperPage
---

## Helper

To reduce the amount of boilerplate needed with each component and to improve maintainability, you can set up a few helper objects. This way, should anything change, you only need to update one file.

:::caution
Helper file names must exactly be `control-container.view-provider.ts` and `<type>.host-directive.ts`. Any deviation will result in the schematics not recognizing the files correctly and falling back to the verbose syntax.

The declarations within these files also have to be exact, otherwise you will end up with a broken import that you need to fix manually.
:::

### Manual Helper File Integration

- If you create helper files yourself, you can place them in any folder in your project.
- Run schematics with the `--helper` flag and use `--helperPath <path>` to point to your helper directory (default: `src/app/shared/helper`).
- The schematic will look in that path for files named exactly:
  - `control-container.view-provider.ts`
  - `control.host-directive.ts`
  - `group.host-directive.ts`
  - `block.host-directive.ts`

When running schematics, pass the flags to use your files:

```bash
ng generate ngx-formwork:<schematic> --helper --helperPath src/app/shared/helper
```

Or set these defaults in `angular.json` under your project's `schematics` section:

```json
"ngx-formwork:control": { "helper": true, "helperPath": "src/app/shared/helper" },
```


### Control Container View Providers

`ControlContainer` is required for all controls and groups that will be used within _ngx-formwork_. Injection of the control container allows the components to use reactive forms functionality, without needing to pass the form group through inputs and wrapping the template into additional tags. See this YouTube Video for more detailed explanation: [How to Make Forms in Angular REUSABLE (Advanced, 2023)](https://www.youtube.com/watch?v=o74WSoJxGPI)

```ts title="control-container.view-provider.ts"
export const controlContainerViewProviders = [
  {
    provide: ControlContainer,
    useFactory: () => inject(ControlContainer, { skipSelf: true }),
  },
];
```

```ts title="text-control.component.ts || group.component.ts"
@Component({
  // Other component decorator options
  viewProviders: controlContainerViewProviders,
})
```

### Control Host Directive

This is a convenience helper to apply the `NgxfwControlDirective`.

```ts title="control.host-directive.ts"
export const ngxfwControlHostDirective = {
  directive: NgxfwControlDirective,
  inputs: ['content', 'name'],
};
```

Use it like this:

```ts title="text-control.component.ts"
@Component({
  // Other component decorator options
  hostDirectives: [
    // Apply here
    ngxfwControlHostDirective
  ],
})
```

### Group Host Directive

This is a convenience helper to apply the `NgxfwGroupDirective`.

```ts title="group.host-directive.ts"
export const ngxfwGroupHostDirective = {
  directive: NgxfwGroupDirective,
  inputs: ['content', 'name'],
};
```

Use it like this:

```ts title="group.component.ts"
@Component({
  // Other component decorator options
  hostDirectives: [
    // Apply here
    ngxfwGroupHostDirective
  ],
})
```

### Union Types

For official documentation of Union Types checkout the [official docs](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types).

Setting up a union type for your own controls is highly recommended, as it gives you much better type safety, when writing your forms in TypeScript.

```ts
export type MyAppControls = TestTextControl | TestGroup | InfoBlock;
```

## Code Splitting

Registering all controls, validators, etc. directly in the _app.config.ts_ is not ideal. ngx-formwork provides multiple approaches to organize your code better.

### Using defineFormworkConfig

Create a file next to your _app.config.ts_ with this content to get started. The `defineFormworkConfig` function is a helper that provides type support when defining the configuration in a separate file.

```ts title="formwork.config.ts"
import { defineFormworkConfig } from 'ngx-formwork';

export const formworkConfig = defineFormworkConfig({
  componentRegistrations: {
    // Component registrations go here
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

```ts title="app.config.ts"
import { formworkConfig } from './formwork.config.ts';

export const appConfig: ApplicationConfig = {
  providers: [
    // other providers
    provideFormwork(formworkConfig)
  ]
};
```

### Using Injection Tokens Directly

For more advanced code organization, you can leverage Angular's dependency injection system by providing the tokens directly.

:::note
When using the DI tokens directly, be aware of how resolution works:
- For components: Your provided map is taken "as is"
- For validators: Your provided validators are merged with defaults, with your values taking precedence for duplicate keys
- For global config: Your configuration is deeply merged with defaults
:::

#### Component Registration with Tokens

```ts title="component-registrations.provider.ts"
import { NGX_FW_COMPONENT_REGISTRATIONS } from 'ngx-formwork';
import { TextControlComponent } from './components/text-control.component';
import { GroupComponent } from './components/group.component';
import { InfoBlockComponent } from './components/info-block.component';

export const componentRegistrationsProvider = {
  provide: NGX_FW_COMPONENT_REGISTRATIONS,
  useValue: new Map([
    ['text-control', TextControlComponent],
    ['group', GroupComponent],
    ['info', InfoBlockComponent],
    // more registrations...
  ])
};
```

#### Validator Registration with Tokens

```ts title="validator-registrations.provider.ts"
import { NGX_FW_VALIDATOR_REGISTRATIONS, NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS } from 'ngx-formwork';
import { Validators } from '@angular/forms';
import { letterValidator, noDuplicateValuesValidator, forbiddenLetterAValidator } from './validators';
import { asyncValidator, asyncGroupValidator } from './async-validators';

// Synchronous validators
export const validatorRegistrationsProvider = {
  provide: NGX_FW_VALIDATOR_REGISTRATIONS,
  useValue: new Map([
    ['min-chars', [Validators.minLength(3)]],
    ['letter', [letterValidator]],
    ['combined', [Validators.minLength(3), Validators.required, letterValidator]],
    ['no-duplicates', [noDuplicateValuesValidator]],
    ['forbidden-letter-a', [forbiddenLetterAValidator]],
    // more registrations...
  ])
};

// Asynchronous validators
export const asyncValidatorRegistrationsProvider = {
  provide: NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS,
  useValue: new Map([
    ['async', [asyncValidator]],
    ['async-group', [asyncGroupValidator]],
    // more registrations...
  ])
};
```

In _app.config.ts_ use them like this:

```ts title="app.config.ts"
import { componentRegistrationsProvider } from './component-registrations.provider';
import { validatorRegistrationsProvider, asyncValidatorRegistrationsProvider } from './validator-registrations.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    // other providers
    provideFormwork(),
    // Custom providers MUST come after provideFormwork()
    componentRegistrationsProvider,
    validatorRegistrationsProvider,
    asyncValidatorRegistrationsProvider,
  ]
}; 
```

### Multiple Configurations with Injection Tokens

You can also provide multiple configuration objects that will be merged according to their resolution strategy:

```ts title="split-configurations.provider.ts"
import { NGX_FW_COMPONENT_REGISTRATIONS, NGX_FW_VALIDATOR_REGISTRATIONS, NGX_FW_CONFIG } from 'ngx-formwork';

// First set of components
export const baseComponentsProvider = {
  provide: NGX_FW_COMPONENT_REGISTRATIONS,
  useValue: new Map([
    ['text', TextComponent],
    ['number', NumberComponent],
  ])
};

// Additional components from a different module
export const extraComponentsProvider = {
  provide: NGX_FW_COMPONENT_REGISTRATIONS,
  useValue: new Map([
    ['date', DateComponent],
    ['select', SelectComponent],
  ])
};

// Multiple global configs will be deep merged
export const baseConfigProvider = {
  provide: NGX_FW_CONFIG,
  useValue: {
    testIdBuilderFn: (baseName, controlName) => `${baseName}-${controlName}`,
  }
};

export const moduleConfigProvider = {
  provide: NGX_FW_CONFIG,
  useValue: {
    extraSettings: {
      theme: 'dark',
    }
  }
};
```

:::note
When providing multiple maps with the same token:
- For components: Only the last provided map will be used
- For validators: All maps are collected in an array and merged, with later entries overriding earlier ones
- For global config: All configs are deeply merged, with nested object properties preserved
:::

### Traditional Code Splitting

For simpler scenarios, you can still split your registration files by type while using the `provideFormwork()` function.

#### Controls Registration

Create a file with the following content, at whatever location makes sense.

```ts title="controls.registerations.ts"
export const componentRegistrations: ComponentRegistrationConfig = {
  'text-control': TextControlComponent,
  group: GroupComponent,
  info: InfoBlockComponent,
  // more regsitrations...
};
```

In _app.config.ts_ use it like this

```ts title="app.config.ts"
import { componentRegistrations } from './controls.registerations.ts';

export const appConfig: ApplicationConfig = {
  providers: [
    // other providers
    provideFormwork({
      componentRegistrations
    })
  ]
};
```

In _formwork.config.ts_ use it like this

```ts title="app.config.ts"
import { componentRegistrations } from './controls.registerations.ts';

export const formworkConfig = defineFormworkConfig({
  // other providers
  componentRegistrations,
});
```

#### Validators Registration

Create a file with the following content, at whatever location makes sense. You can also further split the files between sync and async validators

```ts title="validators.registerations.ts"
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

```ts title="app.config.ts"
import { validatorRegistrations, asyncValidatorRegistrations } from './validators.registerations.ts';

export const appConfig: ApplicationConfig = {
  providers: [
    // other providers
    provideFormwork({
      validatorRegistrations,
      asyncValidatorRegistrations,
    })
  ],
};
```

In _formwork.config.ts_ use it like this

```ts title="formwork.config.ts"
import { componentRegistrations } from './controls.registerations.ts';

export const formworkConfig = defineFormworkConfig({
  // other providers
  componentRegistrations: {
    validatorRegistrations,
    asyncValidatorRegistrations,
  },
});
```

:::caution
Extracting the validator registrations means losing some of the type safety features. Specifically it won't be possible to get warnings when you misspell the key in a reference. It is therefore recommended to keep the validators directly in `defineFormworkConfig` or `provideFormwork` function call.

The following example shows the case where the reference to the `letter` validator is misspelled.
:::

```ts title="misspelled.validators.registerations.ts"
export const validatorRegistrations: ValidatorConfig<RegistrationRecord> = {
  letter: [letterValidator],
  // ⚠️ letter only spelled with one T. 
  // This will give an TS error in the provideFormwork function, but not in this case
  combined: [Validators.required, 'leter'], 
};
```

### Global Configuration with Injection Tokens

For advanced scenarios, you can provide global configuration options using the `NGX_FW_CONFIG` injection token.

```ts title="global-config.provider.ts"
import { NGX_FW_CONFIG } from 'ngx-formwork';
import { TestIdBuilderFn } from 'ngx-formwork';

// Example test ID builder function
const testIdBuilder: TestIdBuilderFn = (baseName, controlName) => {
  return `${baseName}-${controlName}`;
};

export const globalConfigProvider = {
  provide: NGX_FW_CONFIG,
  useValue: {
    testIdBuilderFn: testIdBuilder
  }
};
```

In _app.config.ts_ use it like this:

```ts title="app.config.ts"
import { globalConfigProvider } from './global-config.provider';

export const appConfig: ApplicationConfig = {
  providers: [
    // other providers
    provideFormwork(),
    globalConfigProvider
  ]
};
```
