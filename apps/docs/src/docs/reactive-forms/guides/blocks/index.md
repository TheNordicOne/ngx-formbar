Sometimes you need additional information or functionality within a form. For example, you might want to add an information block, images, or anything else that does not contribute to the form's value.

Blocks are non-control elements: they have no `FormControl`, are never disabled or readonly, and contribute nothing to the form's value.

## Scaffolding via Schematics

Run the Angular schematic to scaffold a new block and register it:

```bash
ng generate @ngx-formbar/schematics:block --key <block-key> [--name <ComponentName>]
```

The schematic generates an interface extending `NgxFbBlock` and a component implementing `FormbarBlock<T>` with the appropriate signal inputs already declared.

See the [Generators page](/fundamentals/generators) for more details.

## Manual Setup

Here is an example of a simple information block.

First create an interface for your block by extending `NgxFbBlock`.

> **Warning**
> `NgxFbBlock` has a required property `isControl` which is typed to always be `false`. This is necessary to allow TypeScript to properly narrow the types and route configuration entries to block components.

```typescript name="info-block.type.ts"
import { NgxFbBlock } from '@ngx-formbar/core';

export interface InfoBlock extends NgxFbBlock {
  type: 'info-block';
  isControl: false;
  message: string;
}
```

Then implement the component.

The component implements the `FormbarBlock<T>` contract. The contract type accepts your block interface as its type parameter and exposes every custom property on it as an additional signal input. You declare the inputs yourself using `input()` or `input.required()`. Angular wires the configuration values into them at runtime.

{% raw %}
```typescript group="info-block" name="info-block.component.ts" icon="angular"
import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { FormbarBlock } from '@ngx-formbar/reactive-forms';
import { InfoBlock } from './info-block.type';

@Component({
  selector: 'app-info-block',
  imports: [],
  templateUrl: './info-block.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoBlockComponent implements FormbarBlock<InfoBlock> {
  // Inputs from the abstract block contract. Both are optional.
  readonly isHidden = input(false);
  readonly testId = input('');

  // Custom inputs declared on InfoBlock become required signal inputs.
  readonly message = input.required<string>();
}
```

```html group="info-block" name="info-block.component.html"
<p>{{ message() }}</p>
```
{% endraw %}

> **Note**
> Block components do not need `viewProviders` for `ControlContainer` and do not use any host directives. They are not form controls, so they sit outside the reactive forms tree entirely.

Finally, register the block in _app.config.ts_. Use `staticComponent` for eagerly imported components or `loadComponent` for lazy loading.

```typescript name="app.config.ts"
import { ApplicationConfig } from '@angular/core';
import { loadComponent, staticComponent } from '@ngx-formbar/core';
import { provideFormbar } from '@ngx-formbar/reactive-forms';
import { InfoBlockComponent } from './info-block.component';

export const appConfig: ApplicationConfig = {
  providers: [
    // other providers
    provideFormbar({
      componentRegistrations: {
        // Eagerly imported
        info: staticComponent(InfoBlockComponent),
        // Or lazily loaded
        infoLazy: loadComponent(() =>
          import('./info-block.component').then((m) => m.InfoBlockComponent),
        ),
      },
    }),
  ],
};
```

## Configuration

Check out the [Configuration guide](/fundamentals/configuration) for how to configure a block. A block only has access to the base properties from `NgxFbBlock`. There is no `name`, no `isDisabled`, no `isReadonly`, and no value strategies, because blocks have no form value.

## Hidden

{% include "../../../shared/hidden-intro.md" %}

> **Note**
> Blocks have no value, so the `valueStrategy` does not apply. Only the `hideStrategy` (`keep` vs. `remove`) and the visibility handling mode are relevant.

To take over visibility yourself, register the block with `hiddenHandling: 'manual'` and read the `isHidden` signal in your template.

{% raw %}
```typescript group="hidden-block" name="info-block.component.ts" icon="angular"
import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { FormbarBlock } from '@ngx-formbar/reactive-forms';
import { InfoBlock } from './info-block.type';

@Component({
  selector: 'app-info-block',
  imports: [],
  templateUrl: './info-block.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoBlockComponent implements FormbarBlock<InfoBlock> {
  readonly isHidden = input(false);
  readonly testId = input('');
  readonly message = input.required<string>();
}
```

```html group="hidden-block" name="info-block.component.html"
@if (!isHidden()) {
  <p>{{ message() }}</p>
}
```
{% endraw %}

```typescript name="app.config.ts"
provideFormbar({
  componentRegistrations: {
    info: staticComponent(InfoBlockComponent, { hiddenHandling: 'manual' }),
  },
});
```

## Test ID

{% include "../../../shared/test-id.md" %}

{% raw %}
```typescript group="test-id-block" name="info-block.component.ts" icon="angular"
import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { FormbarBlock } from '@ngx-formbar/reactive-forms';
import { InfoBlock } from './info-block.type';

@Component({
  selector: 'app-info-block',
  imports: [],
  templateUrl: './info-block.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoBlockComponent implements FormbarBlock<InfoBlock> {
  readonly isHidden = input(false);
  readonly testId = input('');
  readonly message = input.required<string>();
}
```

```html group="test-id-block" name="info-block.component.html"
<p [attr.data-testId]="testId()">{{ message() }}</p>
```
{% endraw %}

## Component Contract Reference

The `FormbarBlock<T>` contract type accepts your block interface as its type parameter and combines a small set of base inputs with the custom properties declared on `T`.

| Input      | Type                   | Description                                                                                  |
|------------|------------------------|----------------------------------------------------------------------------------------------|
| `isHidden` | `SignalInput<boolean>` | The resolved hidden state for the block. Optional on the contract; declare when you need it. |
| `testId`   | `SignalInput<string>`  | The computed test ID for the block. Optional on the contract; declare when you need it.      |

In addition to these base inputs, every custom property declared on your block interface (anything beyond the keys of `NgxFbBlock`) becomes an additional signal input on the contract. The contract uses `ToSignalInputs<ExtendedBlockInputs<T>>` to derive those input declarations from `T`. Required properties on the interface must have a matching `input()` on the component; optional properties (`?`) can be omitted.

> **Note**
> Blocks intentionally have no `name`, `isDisabled`, `isReadonly`, `errors`, `isDirty`, `hideStrategy`, or `valueStrategy` inputs. Those belong to controls and groups, which participate in the reactive forms tree.
