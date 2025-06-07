---
title: Improvements & DRY Code
keyword: HelperPage
---

## Helper

To reduce the amount of boilerplate needed with each component and to improve maintainability, you can set up a few helper objects. This way, should anything change, you only need to update one file.

The exact naming of each helper really is up to you.

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
  inputs: ['content'],
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
  inputs: ['content'],
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

## Code Splitting

Registering all controls. validators, etc. directly in the `app.config.ts` is not ideal. Setup dedicated files for your registrations.

Before you continue, it is recommended to set up the union type.

### Controls Registration

Create a file with the following content, at whatever location makes sense.

```ts title="controls.registerations.ts"
export const componentRegistrations: ComponentRegistrationConfig = {
  'text-control': TextControlComponent,
  group: GroupComponent,
  info: InfoBlockComponent,
  // more regsitrations...
};
```

In `app.config.ts` use it like this

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

### Validators Registration

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

In `app.config.ts` use it like this

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

:::caution
Extracting the validator registrations means losing some of the type safety features. Specifically it won't be possible to get warnings when you misspell the key in a reference. It is therefore recommended to keep the validators directly in the `provideFormwork` function call.

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
