A control can be whatever you need it to be. It can be as generic as a `TextControl`. be more specific like an `EMailControl`, just wrap existing controls like a `DateRangeControl` or have custom logic like a `SearchableDropdownControl`.

## Scaffolding via Schematics

Run the Angular schematic to scaffold a new control and register it:

```bash
ng generate @ngx-formbar/schematics:control --key <control-key> [--name <ComponentName>]
```

See the [Generators page](/fundamentals/generators) for more details.

## Manual Setup

> **Note**
> Checkout the [Helper Files guide](/reactive-forms/guides/helper-files) to see how to set up helpers.

Here is an example of a simple text control.

First create an interface for your control.

```typescript name="text-control.type.ts"
import { NgxFbControl } from '@ngx-formbar/core';

export interface TextControl extends NgxFbControl {
  // Unique Key of your control that is used for differentiating controls
  // This can be descriptive like "email-control"
  type: 'text-control';

  // Overwrite defaultValue with correct value type
  // the default value type is "unknown"
  defaultValue?: string;

  // Additional options only applicable to this control
  hint?: string;
}
```

Then implement the component.

> **Warning**
> Be sure to bind to `[formControlName]` on the actual input element

{% raw %}
```typescript group="text-control" name="text-control.component.ts" icon="angular"
import { Component, Signal, computed, inject } from '@angular/core';
import { ReactiveFormsModule, ControlContainer } from '@angular/forms';
import { NgxfbControlDirective } from '@ngx-formbar/reactive-forms';
import { TextControl } from './text-control.type';

@Component({
  selector: 'app-text-control',
  imports: [ReactiveFormsModule],
  templateUrl: './text-control.component.html',
  viewProviders: [
    {
      provide: ControlContainer,
      useFactory: () => inject(ControlContainer, { skipSelf: true }),
    }
  ],
  hostDirectives: [
    {
      directive: NgxfbControlDirective,
      inputs: ['content', 'name'],
    }
  ],
})
export class TextControlComponent {
  // Inject the Directive to gain access to all public properties
  // Make sure to pass the correct type parameter to get proper type information
  private readonly control = inject(NgxfbControlDirective<TextControl>);

  // Explicitly setting a type definition is not required, but some IDEs work better if they are present
  readonly content: Signal<TextControl> = this.control.content; // The configuration object of the control instance

  // We get proper type information when accessing this.content()
  readonly hint = computed(() => this.content().hint);
  readonly label = computed(() => this.content().label);
  readonly name: Signal<string> = this.control.name;
}
```

```html group="text-control" name="text-control.component.html"
<!-- Just an example -->
<label [htmlFor]="name()">{{ label() }}</label>
<input
  [id]="name()"
  [formControlName]="name()"
/>
<span>{{hint()}}</span>
```
{% endraw %}

Finally, register the control in _app.config.ts_

```typescript name="app.config.ts"
import { ApplicationConfig } from '@angular/core';
import { loadComponent } from '@ngx-formbar/core';
import { provideFormbar } from '@ngx-formbar/reactive-forms';

export const appConfig: ApplicationConfig = {
  providers: [
    // other providers
    provideFormbar({
      componentRegistrations: {
        text: loadComponent(() => import('./text-control.component').then(m => m.TextControlComponent))
      }
    })
  ],
};
```

## Configuration

Checkout the [Configuration guide](/fundamentals/configuration) for how to configure a control.

## Hidden

{% include "../../../shared/hidden-intro.md" %}

{% raw %}
```typescript group="hidden-control" name="text-control.component.ts" icon="angular"
import { Signal, inject } from '@angular/core';
import { NgxfbControlDirective } from '@ngx-formbar/reactive-forms';
import { TextControl } from './text-control.type';

@Component({
  // ...
})
export class TextControlComponent {
  private readonly control = inject(NgxfbControlDirective<TextControl>);
  // Really only should ever be a boolean return value, but an expression could also return a number, string or object
  readonly isHidden: Signal<unknown> = this.control.isHidden;
  readonly name: Signal<string> = this.control.name;

  // Manual visibility handling is configured in the component registration
}
```

```html group="hidden-control" name="text-control.component.html"
@if(isHidden()){
<span>Some placeholder you want to use</span>
} @if(!isHidden()){
<label [htmlFor]="name()">{{ label() }}</label>
<input [id]="name()" [formControlName]="name()" />
<span>{{hint()}}</span>
}
```
{% endraw %}

{% include "../../../shared/hide-strategy.md" %}

{% include "../../../shared/value-strategy.md" %}

## Disabled

{% include "../../../shared/disabled-intro.md" %}

{% raw %}
```typescript group="disabled-control" name="text-control.component.ts" icon="angular"
import { Signal, inject } from '@angular/core';
import { NgxfbControlDirective } from '@ngx-formbar/reactive-forms';
import { TextControl } from './text-control.type';

@Component({
  // ...
})
export class TextControlComponent {
  private readonly control = inject(NgxfbControlDirective<TextControl>);
  readonly disabled: Signal<boolean> = this.control.disabled;
  readonly name: Signal<string> = this.control.name;
}
```

```html group="disabled-control" name="text-control.component.html"
<label [htmlFor]="name()">{{ label() }}</label>
<input [id]="name()" [formControlName]="name()" />
<!-- Only show hint when control is disabled -->
@if(disabled()){
<span>{{hint()}}</span>
}
```
{% endraw %}

## Readonly

{% include "../../../shared/readonly-intro.md" %}

{% raw %}
```typescript group="readonly-control" name="text-control.component.ts" icon="angular"
import { Signal, inject } from '@angular/core';
import { NgxfbControlDirective } from '@ngx-formbar/reactive-forms';
import { TextControl } from './text-control.type';

@Component({
  // ...
})
export class TextControlComponent {
  private readonly control = inject(NgxfbControlDirective<TextControl>);
  readonly readonly: Signal<boolean> = this.control.readonly;
  readonly name: Signal<string> = this.control.name;
}
```

```html group="readonly-control" name="text-control.component.html"
<label [htmlFor]="name()">{{ label() }}</label>
<input
  [id]="name()"
  [formControlName]="name()"
  [attr.readonly]="readonly() || null"
/>
<span>{{hint()}}</span>
```
{% endraw %}

## Computed Values

In some cases it is desirable to (pre)-fill certain inputs with a value based on other controls. This can be done by utilizing the `computedValue` property. It will automatically set the value based on the provided expression. If the control can be edited by the user, it will only overwrite the value if a dependency changes. Usually you will want to make it readonly though.

See the [Expressions guide](/fundamentals/expressions) for details on how expressions work and the [Configuration guide](/fundamentals/configuration) for other configuration options.

> **Known issue:** String expressions that reference fields inside sibling groups do not resolve correctly on initial render ([#83](https://github.com/TheNordicOne/ngx-formbar/issues/83)). Use optional chaining as a workaround:
>
> ```typescript
> computedValue: 'groupA?.fieldA + " " + groupB?.fieldB'
> ```

## Dynamic Label

A control's label can be made responsive to other form data by using the `dynamicLabel` configuration property. You provide an expression string to dynamicLabel (e.g., 'Hello, ' + user.name), and the control's label text will then be computed based on this expression.

Your component can access this computed dynamic label via a signal (e.g., this.control.dynamicLabel). Typically, you'd use this dynamic label if it's available and evaluates to a meaningful string; otherwise, you might fall back to a statically configured label (e.g., this.control.label).

See the [Expressions guide](/fundamentals/expressions) for details on how expressions work and the [Configuration guide](/fundamentals/configuration) for other configuration options.

{% raw %}
```typescript group="dynamic-label" name="text-control.component.ts" icon="angular"
import { Signal, computed, inject } from '@angular/core';
import { NgxfbControlDirective } from '@ngx-formbar/reactive-forms';
import { TextControl } from './text-control.type';

@Component({
  // ...
})
export class TextControlComponent {
  private readonly control = inject(NgxfbControlDirective<TextControl>);

  // Access the computed dynamic label from the directive.
  // It will be `undefined` if no 'dynamicLabel' expression is set or if it doesn't resolve to a string.
  readonly dynamicLabel: Signal<string | undefined> = this.control.dynamicLabel;

  readonly staticConfigLabel = computed(() => this.content().label);
  readonly name: Signal<string> = this.control.name;

  readonly displayLabel = computed(() => {
    const dynamic = this.dynamicLabel();
    if (dynamic && dynamic.trim() !== '') {
      return dynamic;
    }

    return this.staticConfigLabel() || '';
  });
}
```

```html group="dynamic-label" name="text-control.component.html"
<label [htmlFor]="name()"> {{ displayLabel() }} </label>
<input [id]="name()" [formControlName]="name()" />
```
{% endraw %}

## Test ID

{% include "../../../shared/test-id.md" %}

{% raw %}
```typescript group="test-id-control" name="text-control.component.ts" icon="angular"
import { Signal, inject } from '@angular/core';
import { NgxfbControlDirective } from '@ngx-formbar/reactive-forms';
import { TextControl } from './text-control.type';

@Component({
  // ...
})
export class TextControlComponent {
  private readonly control = inject(NgxfbControlDirective<TextControl>);
  readonly testId: Signal<string> = this.control.testId;
  readonly name: Signal<string> = this.control.name;
}
```

```html group="test-id-control" name="text-control.component.html"
<label [htmlFor]="name()" [attr.data-testId]="testId() + '-label'"
  >{{ label() }}</label
>
<input
  [attr.data-testId]="testId() + '-input'"
  [id]="name()"
  [formControlName]="name()"
/>
```
{% endraw %}

## Showing Errors

Showing errors works pretty much the same as always. You get access to the form control and then access `hasError`.

In TypeScript set up a getter

```typescript name="text-control.component.ts" icon="angular"
import { inject } from '@angular/core';
import { NgxfbControlDirective } from '@ngx-formbar/reactive-forms';

// inject the instance of the directive
private readonly textControl = inject(NgxfbControlDirective<Control>);

// Get access to the underlying form textControl}
get formControl() {
  return this.textControl.formControl
}
```

Then, in your template you can do something like this

```html name="text-control.component.html"
@if(formControl?.hasError('required')) {
<span>Required</span>
}
```

## Directive Reference

The `NgxfbControlDirective<T>` exposes the following public properties and methods:

| Property / Method                 | Type                                     | Description                                                               |
|-----------------------------------|------------------------------------------|---------------------------------------------------------------------------|
| `content`                         | `InputSignal<T>`                         | The configuration object of the control instance.                         |
| `name`                            | `InputSignal<string>`                    | The control's name (the key used in the configuration).                   |
| `isHidden`                        | `Signal<boolean>`                        | Whether the control is currently hidden.                                  |
| `hiddenAttribute`                 | `Signal<string \| null>`                 | The hidden attribute value for DOM binding. Returns `'hidden'` or `null`. |
| `disabled`                        | `Signal<boolean>`                        | Whether the control is currently disabled.                                |
| `readonly`                        | `Signal<boolean>`                        | Whether the control is currently readonly.                                |
| `dynamicLabel`                    | `Signal<string \| undefined>`            | The computed dynamic label, if a `dynamicLabel` expression is configured. |
| `testId`                          | `Signal<string \| undefined>`            | The computed test ID for the control.                                     |
| `hideStrategy`                    | `Signal<string \| undefined>`            | The control's hide strategy (`'keep'` or `'remove'`).                     |
| `valueStrategy`                   | `Signal<ValueStrategy \| undefined>`     | The control's value strategy (`'last'`, `'default'`, or `'reset'`).       |
| `updateStrategy`                  | `Signal<'change' \| 'blur' \| 'submit'>` | The resolved update strategy for the control.                             |
| `formControl`                     | `FormControl \| null`                    | Getter for the underlying `FormControl` instance.                         |

### Advanced

| Property / Method               | Type                                 | Description                                                            |
|---------------------------------|--------------------------------------|------------------------------------------------------------------------|
| `parentFormGroup`               | `FormGroup \| null`                  | Getter for the parent `FormGroup` containing this control.             |
| `parentValueStrategy`           | `Signal<ValueStrategy \| undefined>` | The parent's value strategy, used for inheritance.                     |
| `setDisabledHandling(handling)` | `(StateHandling) => void`            | Sets disabled handling to `'auto'` or `'manual'`. Default is `'auto'`. |
