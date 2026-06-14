{% import "../../../shared/scaffolds.njk" as scaffold %}

A control can be whatever you need it to be. It can be as generic as a `TextControl`, be more specific like an `EMailControl`, just wrap existing controls like a `DateRangeControl` or have custom logic like a `SearchableDropdownControl`.

Starting with v2.0.0 of `@ngx-formbar/reactive-forms`, controls are plain Angular components that implement the `ReactiveFormbarControl<T>` contract. The library writes its state into your component through signal inputs, so you only declare the inputs you actually care about. There is no host directive, no injection, and no manual signal forwarding.

## Scaffolding via Schematics

Run the Angular schematic to scaffold a new control and register it. The schematic produces an interface-based component that already implements `ReactiveFormbarControl<T>`:

```bash
ng generate @ngx-formbar/schematics:control --key <control-key> [--name <ComponentName>]
```

See the [Generators page](/fundamentals/generators) for more details.

## Manual Setup

{% include "../../../shared/helper-files-note.md" %}

Here is an example of a text control.

First create an interface for your control.

```typescript name="text-control.type.ts"
import { NgxFbControl } from '@ngx-formbar/core';

export interface TextControl extends NgxFbControl {
  // Unique key of your control that is used for differentiating controls.
  // This can be descriptive like "email-control"
  type: 'text-control';

  // Overwrite defaultValue with the correct value type.
  // The default value type is "unknown"
  defaultValue?: string;

  // Additional options only applicable to this control
  hint?: string;
  placeHolder?: string;
}
```

Then implement the component.

> **Warning**
> Be sure to bind to `[formControlName]` on the actual input element

{% raw %}

```typescript group="text-control" name="text-control.component.ts" icon="angular"
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { ReactiveFormbarControl } from '@ngx-formbar/reactive-forms';
import { TextControl } from './text-control.type';
import { controlContainerViewProviders } from './control-container.view-provider';

@Component({
  selector: 'app-text-control',
  imports: [ReactiveFormsModule],
  templateUrl: './text-control.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: controlContainerViewProviders,
})
export class TextControlComponent implements ReactiveFormbarControl<TextControl> {
  // Required. The library always provides this
  readonly name = input.required<string>();

  // Optional contract inputs. Declare only the ones you use
  readonly isDisabled = input(false);
  readonly isReadonly = input(false);
  readonly isHidden = input(false);
  readonly labelText = input<string | undefined>('');
  readonly dynamicLabel = input<string | null>();
  readonly testId = input('');
  readonly errors = input<ValidationErrors | null>(null);
  readonly isDirty = input(false);

  // Custom inputs from TextControl beyond NgxFbControl
  readonly hint = input<string>();
  readonly placeHolder = input<string>();
}
```

```html group="text-control" name="text-control.component.html"
<label [htmlFor]="name()">{{ labelText() }}</label>
<input [id]="name()" [placeholder]="placeHolder() ?? ''" [formControlName]="name()" />
<span>{{ hint() }}</span>
```

{% endraw %}

Finally, register the control in _app.config.ts_

```typescript name="app.config.ts"
import { ApplicationConfig } from '@angular/core';
import { loadComponent, staticComponent } from '@ngx-formbar/core';
import { provideFormbar } from '@ngx-formbar/reactive-forms';
import { TextControlComponent } from './text-control.component';

export const appConfig: ApplicationConfig = {
  providers: [
    // other providers
    provideFormbar({
      componentRegistrations: {
        // Eager registration
        text: staticComponent(TextControlComponent),

        // Or lazy registration
        // text: loadComponent(() =>
        //   import('./text-control.component').then((m) => m.TextControlComponent),
        // ),
      },
    }),
  ],
};
```

{% include "../../../shared/component-helper-origins.md" %}

## Reusability

A formbar component is input-driven, so the same component works whether formbar drives it from config or you use it directly in a plain reactive form.

**ngx-formbar only**

```typescript group="control-formbar-only" name="text-control.component.ts" file="../../../../../../../libs/examples/reactive-forms/src/lib/components/text/text-control.component.ts"

```

```html group="control-formbar-only" name="text-control.component.html" file="../../../../../../../libs/examples/reactive-forms/src/lib/components/text/text-control.component.html"

```

**Reusable**

```typescript group="control-reusable" name="text-control.component.ts" file="../../../../../../../libs/examples/reactive-forms/src/lib/components/text/text-control.component.ts"

```

```html group="control-reusable" name="text-control.component.html" file="../../../../../../../libs/examples/reactive-forms/src/lib/components/text/text-control.component.html"

```

The two are identical. A control binds itself to the form with `[formControlName]="name()"`, which works the same with or without formbar, so a control needs nothing extra to be reusable.

Used directly in a plain reactive form, with no formbar config:

{% raw %}

```html name="standalone.component.html"
<form [formGroup]="form">
  <ngxfb-examples-text-control name="fullName" labelText="Full Name" />
</form>
```

{% endraw %}

## Configuration

Check out the [Configuration guide](/fundamentals/configuration) for how to configure a control.

## Hidden

{% include "../../../shared/hidden-intro.md" %}

The `isHidden` input on the contract is the resolved hidden state for this control. The resolution rules above already account for parent inheritance. Reading `isHidden()` in your template is enough; you do not need to walk up the configuration yourself.

Declare the input and use it directly in your template:

{{ scaffold.controlTs("hidden-control", "    readonly labelText = input<string | undefined>('');
    readonly isHidden = input(false);
    readonly hint = input<string>();") }}

{% raw %}

```html group="hidden-control" name="text-control.component.html"
@if (isHidden()) {
<span>Some placeholder you want to use</span>
} @else {
<label [htmlFor]="name()">{{ labelText() }}</label>
<input [id]="name()" [formControlName]="name()" />
<span>{{ hint() }}</span>
}
```

{% endraw %}

To opt out of the library's automatic visibility behavior (for example, to keep the host mounted but swap in a placeholder), set `hiddenHandling: 'manual'` in the registration. The library still resolves and supplies the `isHidden` signal. It will not destroy the component or apply the value strategy. The component stays mounted at all times, and your template decides what to render.

```typescript name="app.config.ts"
provideFormbar({
  componentRegistrations: {
    text: staticComponent(TextControlComponent, { hiddenHandling: 'manual' }),
  },
});
```

{% include "../../../shared/hide-strategy.md" %}

{% include "../../../shared/value-strategy.md" %}

## Disabled

{% include "../../../shared/disabled-intro.md" %}

Declare the `isDisabled` input and use it in your template:

{{ scaffold.controlTs("disabled-control", "    readonly labelText = input<string | undefined>('');
    readonly isDisabled = input(false);
    readonly hint = input<string>();") }}

{% raw %}

```html group="disabled-control" name="text-control.component.html"
<label [htmlFor]="name()">{{ labelText() }}</label>
<input [id]="name()" [formControlName]="name()" />

<!-- Only show hint when control is disabled -->
@if (isDisabled()) {
<span>{{ hint() }}</span>
}
```

{% endraw %}

By default, the library calls `enable()`/`disable()` on the underlying form control whenever the resolved disabled state changes. To manage disabled state yourself (for example, to apply it to a custom widget instead of the form control), set `disabledHandling: 'manual'` in the registration. The library then only forwards the `isDisabled` signal and leaves the form control alone.

```typescript name="app.config.ts"
provideFormbar({
  componentRegistrations: {
    text: staticComponent(TextControlComponent, { disabledHandling: 'manual' }),
  },
});
```

## Readonly

{% include "../../../shared/readonly-intro.md" %}

Declare the `isReadonly` input and reflect it onto the input element:

{{ scaffold.controlTs("readonly-control", "    readonly labelText = input<string | undefined>('');
    readonly isReadonly = input(false);
    readonly hint = input<string>();") }}

{% raw %}

```html group="readonly-control" name="text-control.component.html"
<label [htmlFor]="name()">{{ labelText() }}</label>
<input [id]="name()" [formControlName]="name()" [attr.readonly]="isReadonly() || null" />
<span>{{ hint() }}</span>
```

{% endraw %}

## Computed Values

To pre-fill an input with a value derived from other controls, use the `computedValue` property on the control configuration. The library sets the value based on the provided expression. If the control is editable, the value is only overwritten when a dependency changes. Usually you will want to make the control readonly.

The result is reflected through Angular's reactive form value, so your component does not need a special input for it. `[formControlName]` already shows the up-to-date value.

See the [Expressions guide](/fundamentals/expressions) for details on how expressions work and the [Configuration guide](/fundamentals/configuration) for other configuration options.

> **Known issue:** String expressions that reference fields inside sibling groups do not resolve correctly on initial display ([#83](https://github.com/TheNordicOne/ngx-formbar/issues/83)). Use optional chaining as a workaround:
>
> ```typescript
> computedValue: 'groupA?.fieldA + " " + groupB?.fieldB';
> ```

## Dynamic Label

To make a control's label respond to other form data, use the `dynamicLabel` configuration property. You provide an expression (e.g. `'Hello, ' + user.name`); the library evaluates it and forwards the result through the `dynamicLabel` signal input.

Declare both `labelText` (the static value from the configuration) and `dynamicLabel`, then derive a `displayLabel` that prefers the dynamic value when it resolves to something meaningful:

See the [Expressions guide](/fundamentals/expressions) for details on how expressions work and the [Configuration guide](/fundamentals/configuration) for other configuration options.

{{ scaffold.controlTs("dynamic-label", " readonly labelText = input<string | undefined>('');
readonly dynamicLabel = input<string | null>();

    readonly displayLabel = computed(() => {
        const dynamic = this.dynamicLabel();
        if (dynamic && dynamic.trim() !== '') {
            return dynamic;
        }
        return this.labelText();
    });", core="Component, computed, input") }}

{% raw %}

```html group="dynamic-label" name="text-control.component.html"
<label [htmlFor]="name()">{{ displayLabel() }}</label> <input [id]="name()" [formControlName]="name()" />
```

{% endraw %}

## Test ID

{% include "../../../shared/test-id.md" %}

{{ scaffold.controlTs("test-id-control", "    readonly labelText = input<string | undefined>('');
    readonly testId = input('');") }}

{% raw %}

```html group="test-id-control" name="text-control.component.html"
<label [htmlFor]="name()" [attr.data-testid]="testId() + '-label'">{{ labelText() }}</label> <input [attr.data-testid]="testId() + '-input'" [id]="name()" [formControlName]="name()" />
```

{% endraw %}

## Showing Errors

The contract exposes the resolved validation errors through the `errors` signal input and the touched/dirty status through `isDirty`. This is the recommended way to show errors. There is no need to reach into the underlying form control.

{{ scaffold.controlTs("errors-control", "    readonly errors = input<ValidationErrors | null>(null);
    readonly isDirty = input(false);", forms="ValidationErrors") }}

{% raw %}

```html group="errors-control" name="text-control.component.html"
<input [id]="name()" [formControlName]="name()" />

@if (isDirty() && errors()?.['required']) {
<span>Required</span>
}
```

{% endraw %}

For advanced cases that genuinely need the underlying `FormControl` (for example calling `markAsPristine()` or reading `pending`), declare the optional `controlInstance` input. The library writes the resolved `FormControl` into it:

```typescript name="text-control.component.ts" icon="angular"
import { Component, input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ReactiveFormbarControl } from '@ngx-formbar/reactive-forms';
import { TextControl } from './text-control.type';

@Component({
  // ...
})
export class TextControlComponent implements ReactiveFormbarControl<TextControl> {
  readonly name = input.required<string>();
  readonly controlInstance = input<FormControl>();
}
```

## Component Contract Reference

The `ReactiveFormbarControl<T>` contract is implemented by your component. The library detects which inputs you declared (by name) and writes its resolved values into them, so every input below is optional except `name`. Any property you add to `T` beyond `NgxFbControl` becomes an additional signal input on the contract. Required properties on `T` must be declared on the component; optional properties (`?`) can be omitted.

| Input             | Type                                       | Description                                                                                                                                                                                                                                            |
| ----------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `name`            | `SignalInput<string>` (**required**)       | The control's name (the key used in the configuration).                                                                                                                                                                                                |
| `isDisabled`      | `SignalInput<boolean>`                     | Whether the control is currently disabled.                                                                                                                                                                                                             |
| `isReadonly`      | `SignalInput<boolean>`                     | Whether the control is currently readonly.                                                                                                                                                                                                             |
| `isHidden`        | `SignalInput<boolean>`                     | Whether the control is currently hidden (already accounts for parent inheritance).                                                                                                                                                                     |
| `testId`          | `SignalInput<string>`                      | The computed test ID for the control.                                                                                                                                                                                                                  |
| `hideStrategy`    | `SignalInput<HideStrategy \| undefined>`   | The control's hide strategy (`'keep'` or `'remove'`).                                                                                                                                                                                                  |
| `valueStrategy`   | `SignalInput<ValueStrategy \| undefined>`  | The control's value strategy (`'last'`, `'default'`, or `'reset'`).                                                                                                                                                                                    |
| `errors`          | `SignalInput<ValidationErrors \| null>`    | Validation errors of the underlying form control.                                                                                                                                                                                                      |
| `isDirty`         | `SignalInput<boolean>`                     | Whether the underlying form control is dirty.                                                                                                                                                                                                          |
| `labelText`       | `SignalInput<string \| undefined>`         | The static `label` value from the control configuration.                                                                                                                                                                                               |
| `dynamicLabel`    | `SignalInput<string \| null \| undefined>` | The computed dynamic label, if a `dynamicLabel` expression is configured. The expression engine can yield `null` (for example from `'maybeProp ?? null'`), so the type widens accordingly. Treat `null` and `undefined` the same way in your template. |
| `controlInstance` | `SignalInput<FormControl>`                 | The underlying `FormControl` instance. Only declare this when you need direct access to the control.                                                                                                                                                   |
