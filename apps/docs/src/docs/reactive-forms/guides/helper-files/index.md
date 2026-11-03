To reduce boilerplate per component and improve maintainability, you can set up a few helper objects. This way, should anything change, you only need to update one file.

## Manual Helper File Integration

`ng add` normally creates the helper files and points the generators at them.

If you write them yourself, you can place them in any folder in your project. Point the generators at your file with `viewProviderHelperPath`. See [Notes for the View Provider Path Option](/fundamentals/generators#notes-for-the-view-provider-path-option).

## Control Container View Providers

`ControlContainer` is required for all controls and groups used within ngx-formbar. Injecting the control container lets components use reactive forms functionality without passing the form group through inputs or wrapping the template in extra tags. For a more detailed explanation, see this YouTube video: [How to Make Forms in Angular REUSABLE (Advanced, 2023)](https://www.youtube.com/watch?v=o74WSoJxGPI).

```typescript group="view-provider" name="control-container.view-provider.ts"
import { inject } from '@angular/core';
import { ControlContainer } from '@angular/forms';

export const controlContainerViewProviders = [
  {
    provide: ControlContainer,
    useFactory: () => inject(ControlContainer, { skipSelf: true }),
  },
];
```

```typescript group="view-provider" name="Usage in component" icon="angular"
@Component({
  // Other component decorator options
  viewProviders: controlContainerViewProviders,
})
```

To have the generators use this file, set `viewProviderHelperPath` to `app/shared/helper/control-container.view-provider.ts#controlContainerViewProviders`.

## Union Types

For official documentation of Union Types check out the [official docs](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types).

Set up a union type for your own controls for stronger type safety when writing your forms in TypeScript.

```typescript name="app-controls.type.ts"
export type MyAppControls = TestTextControl | TestGroup | InfoBlock;
```
