{% import "../../../shared/scaffolds.njk" as scaffold %}

A group is used to group controls together. It results in an Angular `FormGroup` instance.

Most of the time you only need one or two different group types. They become really handy when you need different behaviors. For example, one group that does nothing special visually and one that is collapsible.

Starting with v2.0.0 of `@ngx-formbar/reactive-forms`, groups are plain Angular components that implement the `ReactiveFormbarGroup<T>` contract. The library writes its state into your component through signal inputs, so you only declare the inputs you actually care about. There is no host directive, no injection, and no manual signal forwarding.

## Scaffolding via Schematics

Run the Angular schematic to scaffold a new group and register it. The schematic produces an interface-based component that already implements `ReactiveFormbarGroup<T>`:

```bash
ng generate @ngx-formbar/schematics:group --key <group-key> [--name <ComponentName>]
```

See the [Generators page](/fundamentals/generators) for more details.

## Manual Setup

> **Note**
> Checkout the [Helper Files guide](/reactive-forms/guides/helper-files) to see how to set up helpers.

Here is an example of a simple group. Most likely you will only set up one or two group components, if at all.

First create an interface for your group.

```typescript name="group.type.ts"
import { NgxFbFormGroup } from '@ngx-formbar/core';

export interface Group extends NgxFbFormGroup {
  // Unique key of your group that is used for differentiating groups
  type: 'group';

  // Additional options only applicable to this group if you want
}
```

Then implement the component.

> **Warning**
> Be sure to bind to `[formGroupName]` on an element (e.g. `div`, `ng-container`) and place `<ngxfb-control-outlet />` where the child controls should appear.

{% raw %}

```typescript group="group-component" name="group.component.ts" icon="angular"
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { NgxfbControlOutlet, ReactiveFormbarGroup } from '@ngx-formbar/reactive-forms';
import { Group } from './group.type';
import { controlContainerViewProviders } from './control-container.view-provider';

@Component({
    selector: 'app-group',
    imports: [ReactiveFormsModule, NgxfbControlOutlet],
    templateUrl: './group.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    viewProviders: controlContainerViewProviders,
})
export class GroupComponent implements ReactiveFormbarGroup<Group> {
    // Required. The library always provides this
    readonly name = input.required<string>();

    // Optional contract inputs. Declare only the ones you use
    readonly isDisabled = input(false);
    readonly isReadonly = input(false);
    readonly isHidden = input(false);
    readonly titleText = input<string | undefined>('');
    readonly dynamicTitle = input<string | null>();
    readonly testId = input('');
    readonly errors = input<ValidationErrors | null>(null);
    readonly isDirty = input(false);

    // Custom inputs from Group beyond NgxFbFormGroup go here
}
```

```html group="group-component" name="group.component.html"
<ng-container [formGroupName]="name()">
  <fieldset>
    <ngxfb-control-outlet />
    <ng-content />
  </fieldset>
</ng-container>
```

{% endraw %}

The `<ngxfb-control-outlet />` element marks the slot where the library projects the child controls registered for this group. You do not iterate the children yourself. The outlet picks them up automatically via injection. The optional `<ng-content />` lets consumers project additional template content alongside the children.

Finally, register the group in _app.config.ts_

```typescript name="app.config.ts"
import { ApplicationConfig } from '@angular/core';
import { loadComponent, staticComponent } from '@ngx-formbar/core';
import { provideFormbar } from '@ngx-formbar/reactive-forms';
import { GroupComponent } from './group.component';

export const appConfig: ApplicationConfig = {
  providers: [
    // other providers
    provideFormbar({
      componentRegistrations: {
        // Eager registration
        group: staticComponent(GroupComponent),

        // Or lazy registration
        // group: loadComponent(() =>
        //   import('./group.component').then((m) => m.GroupComponent),
        // ),
      },
    }),
  ],
};
```

> **Note**
> `staticComponent` and `loadComponent` come from `@ngx-formbar/core`. `provideFormbar` comes from `@ngx-formbar/reactive-forms`.

## Reusability

A formbar component is input-driven, so the same component works whether formbar drives it from config or you place it in a plain reactive form yourself. The one thing that differs for a group is how the children get rendered. With formbar, `<ngxfb-control-outlet />` renders the children from the configuration. Without formbar there is no configuration feeding the outlet, so the reusable group also projects children through `<ng-content />`.

**Formbar only**

```typescript group="group-formbar-only" name="formbar-group-control.component.ts" file="../../../../../../../libs/examples/reactive-forms/src/lib/components/formbar-group/formbar-group-control.component.ts"
```

```html group="group-formbar-only" name="formbar-group-control.component.html" file="../../../../../../../libs/examples/reactive-forms/src/lib/components/formbar-group/formbar-group-control.component.html"
```

**Reusable**

```typescript group="group-reusable" name="group-control.component.ts" file="../../../../../../../libs/examples/reactive-forms/src/lib/components/group/group-control.component.ts"
```

```html group="group-reusable" name="group-control.component.html" file="../../../../../../../libs/examples/reactive-forms/src/lib/components/group/group-control.component.html"
```

The reusable group is the same component plus a single `<ng-content />`. That projection slot is the only addition needed to also use the group in a plain reactive form, where you wire the nested `FormGroup` yourself.

Used directly in a plain reactive form, with no formbar config. You bind the nested `FormGroup` with `formGroupName` and project the children through `<ng-content />`:

{% raw %}

```html name="standalone.component.html"
<form [formGroup]="form">
  <ngxfb-examples-group-control name="requester" titleText="Requester" legend="Requester">
    <ng-container formGroupName="requester">
      <ngxfb-examples-text-control name="fullName" labelText="Full Name" />
      <ngxfb-examples-text-control name="email" labelText="Email" />
    </ng-container>
  </ngxfb-examples-group-control>
</form>
```

{% endraw %}

## Configuration

Checkout the [Configuration guide](/fundamentals/configuration) for how to configure a group.

## Hidden

{% include "../../../shared/hidden-intro.md" %}

The `isHidden` input on the contract reflects the resolved hidden state for this group instance. Declare the input and use it in your template:

> **Note**
> `<ngxfb-control-outlet />` always projects the children registered in this group, regardless of the resolved `isHidden` value. With `hiddenHandling: 'auto'` (the default), the library handles the hidden lifecycle for you by destroying the group component when it becomes hidden. With `hiddenHandling: 'manual'`, you stay mounted and decide what to render based on `isHidden()` yourself.

{{ scaffold.groupTs("hidden-group", "    readonly isHidden = input(false);") }}

{% raw %}

```html group="hidden-group" name="group.component.html"
@if (isHidden()) {
  <span>Some placeholder you want to use</span>
} @else {
  <ng-container [formGroupName]="name()">
    <fieldset>
      <ngxfb-control-outlet />
    </fieldset>
  </ng-container>
}
```

{% endraw %}

To opt out of the library's automatic visibility behavior (for example, to keep the host mounted but show a placeholder), set `hiddenHandling: 'manual'` in the registration. The library still resolves and supplies the `isHidden` signal. It will not destroy the component or apply the value strategy. The component stays mounted at all times, and your template decides what to render.

```typescript name="app.config.ts"
provideFormbar({
  componentRegistrations: {
    group: staticComponent(GroupComponent, { hiddenHandling: 'manual' }),
  },
});
```

{% include "../../../shared/hide-strategy.md" %}

{% include "../../../shared/value-strategy.md" %}

## Disabled

{% include "../../../shared/disabled-intro.md" %}

Declare the `isDisabled` input and use it in your template:

{{ scaffold.groupTs("disabled-group", "    readonly isDisabled = input(false);") }}

{% raw %}

```html group="disabled-group" name="group.component.html"
<ng-container [formGroupName]="name()">
  <fieldset>
    <ngxfb-control-outlet />
  </fieldset>
</ng-container>

<!-- Only show hint when group is disabled -->
@if (isDisabled()) {
  <span>This is no longer relevant</span>
}
```

{% endraw %}

By default, the library calls `enable()`/`disable()` on the underlying `FormGroup` whenever the resolved disabled state changes. To manage disabled state yourself, set `disabledHandling: 'manual'` in the registration. The library then only forwards the `isDisabled` signal and leaves the `FormGroup` alone.

```typescript name="app.config.ts"
provideFormbar({
  componentRegistrations: {
    group: staticComponent(GroupComponent, { disabledHandling: 'manual' }),
  },
});
```

## Readonly

{% include "../../../shared/readonly-intro.md" %}

Declare the `isReadonly` input and use it in your template:

{{ scaffold.groupTs("readonly-group", "    readonly isReadonly = input(false);") }}

{% raw %}

```html group="readonly-group" name="group.component.html"
<ng-container [formGroupName]="name()">
  <fieldset>
    <ngxfb-control-outlet />
  </fieldset>
</ng-container>

@if (isReadonly()) {
  <span>This cannot be edited</span>
}
```

{% endraw %}

## Dynamic Title

To make a group's title respond to other form data, use the `dynamicTitle` configuration property. You provide an expression (e.g. `'Hello, ' + user.name`). The library evaluates it and forwards the result through the `dynamicTitle` signal input.

Declare both `titleText` (the static value from the configuration) and `dynamicTitle`, then derive a `displayTitle` that prefers the dynamic value when it resolves to something meaningful:

See the [Expressions guide](/fundamentals/expressions) for details on how expressions work and the [Configuration guide](/fundamentals/configuration) for other configuration options.

{{ scaffold.groupTs("dynamic-title", "    readonly titleText = input<string | undefined>('');
    readonly dynamicTitle = input<string | null>();

    readonly displayTitle = computed(() => {
        const dynamic = this.dynamicTitle();
        if (dynamic && dynamic.trim() !== '') {
            return dynamic;
        }
        return this.titleText() ?? '';
    });", core="Component, computed, input") }}

{% raw %}

```html group="dynamic-title" name="group.component.html"
<ng-container [formGroupName]="name()">
  <fieldset>
    <legend>{{ displayTitle() }}</legend>
    <ngxfb-control-outlet />
  </fieldset>
</ng-container>
```

{% endraw %}

## Test ID

{% include "../../../shared/test-id.md" %}

{{ scaffold.groupTs("test-id-group", "    readonly testId = input('');") }}

{% raw %}

```html group="test-id-group" name="group.component.html"
<ng-container [formGroupName]="name()">
  <fieldset [attr.data-testid]="testId() + '-wrapper'">
    <ngxfb-control-outlet />
  </fieldset>
</ng-container>
```

{% endraw %}

## Showing Errors

The contract exposes the resolved validation errors through the `errors` signal input and the touched/dirty status through `isDirty`. This is the recommended way to show errors. There is no need to reach into the underlying form group.

{{ scaffold.groupTs("errors-group", "    readonly errors = input<ValidationErrors | null>(null);
    readonly isDirty = input(false);", forms="ValidationErrors") }}

{% raw %}

```html group="errors-group" name="group.component.html"
<ng-container [formGroupName]="name()">
  <fieldset>
    <ngxfb-control-outlet />
  </fieldset>
</ng-container>

@if (isDirty() && errors()?.['required']) {
  <span>Required</span>
}
```

{% endraw %}

For advanced cases that genuinely need the underlying `FormGroup` (for example calling `markAsPristine()` or reading `pending`), you can declare the optional `groupInstance` input. The library writes the resolved `FormGroup` into it:

```typescript name="group.component.ts" icon="angular"
import { Component, input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ReactiveFormbarGroup } from '@ngx-formbar/reactive-forms';
import { Group } from './group.type';

@Component({
    // ...
})
export class GroupComponent implements ReactiveFormbarGroup<Group> {
    readonly name = input.required<string>();
    readonly groupInstance = input<FormGroup>();
}
```

## Component Contract Reference

The `ReactiveFormbarGroup<T>` contract is implemented by your component. The library detects which inputs you declared (by name) and writes its resolved values into them, so every input below is optional except `name`. Any property you add to `T` beyond `NgxFbFormGroup` becomes an additional signal input on the contract. Required properties on `T` must be declared on the component; optional properties (`?`) can be omitted.

| Input           | Type                                      | Description                                                                                      |
|-----------------|-------------------------------------------|--------------------------------------------------------------------------------------------------|
| `name`          | `SignalInput<string>` (**required**)      | The group's name (the key used in the configuration).                                            |
| `isDisabled`    | `SignalInput<boolean>`                    | Whether the group is currently disabled.                                                         |
| `isReadonly`    | `SignalInput<boolean>`                    | Whether the group is currently readonly.                                                         |
| `isHidden`      | `SignalInput<boolean>`                    | Whether the group is currently hidden (already accounts for parent inheritance).                 |
| `testId`        | `SignalInput<string>`                     | The computed test ID for the group.                                                              |
| `hideStrategy`  | `SignalInput<HideStrategy \| undefined>`  | The group's hide strategy (`'keep'` or `'remove'`).                                              |
| `valueStrategy` | `SignalInput<ValueStrategy \| undefined>` | The group's value strategy (`'last'`, `'default'`, or `'reset'`).                                |
| `errors`        | `SignalInput<ValidationErrors \| null>`   | Validation errors of the underlying form group.                                                  |
| `isDirty`       | `SignalInput<boolean>`                    | Whether the underlying form group is dirty.                                                      |
| `titleText`     | `SignalInput<string \| undefined>`        | The static `title` value from the group configuration.                                           |
| `dynamicTitle`  | `SignalInput<string \| null \| undefined>` | The computed dynamic title, if a `dynamicTitle` expression is configured. The expression engine can yield `null` (for example from `'maybeProp ?? null'`), so the type widens accordingly. Treat `null` and `undefined` the same way in your template. |
| `groupInstance` | `SignalInput<FormGroup>`                  | The underlying `FormGroup` instance. Only declare this when you need direct access to the group. |
