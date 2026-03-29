Sometimes you need additional information or functionality within a form. This could be the case for example if you need to add an information block, images or anything that does not contribute to the form's value.

## Scaffolding via Schematics

Run the Angular schematic to scaffold a new block and register it:

```bash
ng generate @ngx-formbar/schematics:block --key <block-key> [--name <ComponentName>]
```

See the [Generators page](/fundamentals/generators) for more details.


## Manual Setup

Here is an example of a simple information block.

First create an interface for your block by extending `NgxFbBlock`.

> **Warning**
> `NgxFbBlock` has a required property `isControl` which typed to always be `false`. This is necessary to allow TypeScript to properly narrow the types.

```typescript name="info-block.type.ts"
import { NgxFbBlock } from '@ngx-formbar/core';

export interface InfoBlock extends NgxFbBlock {
  type: 'info-block';
  message: string;
}
```

Then implement the component.

{% raw %}
```typescript group="info-block" name="info-block.component.ts" icon="angular"
import { Component, Signal, computed, inject } from '@angular/core';
import { ControlContainer } from '@angular/forms';
import { NgxfbBlockDirective } from '@ngx-formbar/reactive-forms';
import { InfoBlock } from './info-block.type';

@Component({
  selector: 'app-info-block',
  imports: [],
  templateUrl: './info-block.component.html',
  viewProviders: [
    {
      provide: ControlContainer,
      useFactory: () => inject(ControlContainer, { skipSelf: true }),
    },
  ],
  hostDirectives: [
    {
      directive: NgxfbBlockDirective,
      inputs: ['content', 'name'],
    },
  ],
})
export class InfoBlockComponent {
  // Inject the Directive to gain access to all public properties
  // Make sure to pass the correct type parameter to get proper type information
  private readonly blockDirective = inject(NgxfbBlockDirective<InfoBlock>);

  // Explicitly setting a type definition is not required, but some IDEs work better if they are present
  readonly content: Signal<InfoBlock> = this.blockDirective.content;

  // You also have access to the underlying form
  readonly rootForm = this.blockDirective.rootForm;

  // We get proper type information when accessing this.content()
  readonly message = computed(() => this.content().message); // <- This is the custom property for your block
}
```

```html group="info-block" name="info-block.component.html"
<p>{{ message() }}</p>
```
{% endraw %}

Finally, register the block in app.config.ts

```typescript name="app.config.ts"
import { ApplicationConfig } from '@angular/core';
import { provideFormbar } from '@ngx-formbar/reactive-forms';
import { InfoBlockComponent } from './info-block.component';

export const appConfig: ApplicationConfig = {
  providers: [
    // other providers
    provideFormbar({
      componentRegistrations: {
        info: InfoBlockComponent,
      },
    }),
  ],
};
```

## Configuration

Checkout the [Configuration guide](/fundamentals/configuration) for how to configure a Block. A Block only has access to the base properties.

## Hidden

{% include "../../../shared/hidden-intro.md" %}

{% raw %}
```typescript group="hidden-block" name="info-block.component.ts" icon="angular"
import { Signal, computed, inject } from '@angular/core';
import { NgxfbBlockDirective } from '@ngx-formbar/reactive-forms';
import { InfoBlock } from './info-block.type';

@Component({
  // ...
})
export class InfoBlockComponent {
  private readonly blockDirective = inject(NgxfbBlockDirective<InfoBlock>);

  readonly content: Signal<InfoBlock> = this.blockDirective.content;
  readonly message = computed(() => this.content().message);

  // Really only should ever be a boolean return value, but an expression could also return a number, string or object
  readonly isHidden: Signal<unknown> = this.blockDirective.isHidden;

  constructor() {
    // Let formbar know, that you take care of handling visibility
    this.blockDirective.setVisibilityHandling('manual');
  }
}
```

```html group="hidden-block" name="info-block.component.html"
@if(!isHidden()){
<p>{{ message() }}</p>
}
```
{% endraw %}

## Test ID

{% include "../../../shared/test-id.md" %}

{% raw %}
```typescript group="test-id-block" name="info-block.component.ts" icon="angular"
import { Component, Signal, computed, inject } from '@angular/core';
import { ControlContainer } from '@angular/forms';
import { NgxfbBlockDirective } from '@ngx-formbar/reactive-forms';
import { InfoBlock } from './info-block.type';

@Component({
  selector: 'app-info-block',
  imports: [],
  templateUrl: './info-block.component.html',
  viewProviders: [
    {
      provide: ControlContainer,
      useFactory: () => inject(ControlContainer, { skipSelf: true }),
    },
  ],
  hostDirectives: [
    {
      directive: NgxfbBlockDirective,
      inputs: ['content', 'name'],
    },
  ],
})
export class InfoBlockComponent {
  private readonly blockDirective = inject(NgxfbBlockDirective<InfoBlock>);
  readonly content: Signal<InfoBlock> = this.blockDirective.content;
  readonly testId: Signal<string> = this.blockDirective.testId;
  readonly message = computed(() => this.content().message);
}
```

```html group="test-id-block" name="info-block.component.html"
<p [attr.data-testId]="testId()">{{ message() }}</p>
```
{% endraw %}

## Directive Reference

The `NgxfbBlockDirective<T>` exposes the following public properties and methods:

| Property / Method                 | Type                          | Description                                                               |
|-----------------------------------|-------------------------------|---------------------------------------------------------------------------|
| `content`                         | `InputSignal<T>`              | The configuration object of the block instance.                           |
| `name`                            | `InputSignal<string>`         | The block's name (the key used in the configuration).                     |
| `isHidden`                        | `Signal<boolean>`             | Whether the block is currently hidden.                                    |
| `hiddenAttribute`                 | `Signal<string \| null>`      | The hidden attribute value for DOM binding. Returns `'hidden'` or `null`. |
| `testId`                          | `Signal<string \| undefined>` | The computed test ID for the block.                                       |
| `rootForm`                        | `ControlContainer`            | Getter for the parent form container.                                     |
| `setVisibilityHandling(handling)` | `(StateHandling) => void`     | Sets visibility handling to `'auto'` or `'manual'`.                       |

### Advanced

| Property / Method | Type | Description |
|---|---|---|
| `setTestIdBuilderFn(fn)` | `(TestIdBuilderFn \| undefined) => void` | Overrides the test ID builder function for this block only. |
