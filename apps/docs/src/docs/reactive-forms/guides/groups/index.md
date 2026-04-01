A group is used to group controls together. It results in an Angular `FormGroup` instance.

Most of the time you will only need one or two different group types. Where they really are handy though, is if you need different behaviors. For example one that does not do anything special visually and one that is collapsible.


## Scaffolding via Schematics

Run the Angular schematic to scaffold a new group and register it:

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
  // Unique Key of your group that is used for differentiating groups
  type: 'group';

  // Additional options only applicable to this group if you want
}
```

Then implement the component.

> **Warning**
> Be sure to bind to `[formGroupName]` on an element (e.g. div, ng-container)

```typescript group="group-component" name="group.component.ts" icon="angular"
import { Component, Signal, inject } from '@angular/core';
import { ReactiveFormsModule, ControlContainer } from '@angular/forms';
import { NgxFbContent } from '@ngx-formbar/core';
import { NgxfbAbstractControlDirective, NgxfbGroupDirective } from '@ngx-formbar/reactive-forms';
import { Group } from './group.type';

@Component({
  selector: 'ngxfb-group',
  imports: [NgxfbAbstractControlDirective, ReactiveFormsModule],
  templateUrl: './group.component.html',
  viewProviders: [
    {
      provide: ControlContainer,
      useFactory: () => inject(ControlContainer, { skipSelf: true }),
    },
  ],
  hostDirectives: [
    {
      directive: NgxfbGroupDirective,
      inputs: ['content', 'name'],
    }
  ],
})
export class GroupComponent {
  // Inject the Directive to gain access to all public properties
  // Make sure to pass the correct type parameter to get proper type information
  private readonly control = inject(NgxfbGroupDirective<Group>);

  // Explicitly setting a type definition is not required, but some IDEs work better if they are present
  readonly content: Signal<Group> = this.control.content;  // The configuration object of the group instance
  readonly name: Signal<string> = this.control.name;
  readonly controls: Signal<[string, NgxFbContent][]> = this.control.controls;
}
```

```html group="group-component" name="group.component.html"
<!-- Just an example -->
<div [formGroupName]="name()">
  @for (content of controls(); track content[0]) {
    <ng-template *ngxfbAbstractControl="content" />
  }
</div>
```

Finally, register the group in _app.config.ts_

```typescript name="app.config.ts"
import { ApplicationConfig } from '@angular/core';
import { provideFormbar } from '@ngx-formbar/reactive-forms';

export const appConfig: ApplicationConfig = {
  providers: [
    // other providers
    provideFormbar({
      componentRegistrations: {
        group: () => import('./group.component').then(m => m.GroupComponent)
      }
    })
  ],
};
```

## Configuration

Checkout the [Configuration guide](/fundamentals/configuration) for how to configure a group.

## Hidden

{% include "../../../shared/hidden-intro.md" %}

```typescript group="hidden-group" name="group.component.ts" icon="angular"
import { Signal, inject } from '@angular/core';
import { NgxfbGroupDirective } from '@ngx-formbar/reactive-forms';
import { Group } from './group.type';

@Component({
  // ...
})
export class GroupComponent {
  private readonly control = inject(NgxfbGroupDirective<Group>);
  // Really only should ever be a boolean return value, but an expression could also return a number, string or object
  readonly isHidden: Signal<unknown> = this.control.isHidden;
  readonly name: Signal<string> = this.control.name;

  constructor() {
    // Let formbar know, that you take care of handling visibility
    this.control.setVisibilityHandling('manual')
  }
}
```

```html group="hidden-group" name="group.component.html"
@if(isHidden()){
  <span>Some placeholder you want to use</span>
}
@if(!isHidden()){
  <div [formGroupName]="name()">
    @for (content of controls(); track content[0]) {
      <ng-template *ngxfbAbstractControl="content" />
    }
  </div>
}
```

{% include "../../../shared/hide-strategy.md" %}

{% include "../../../shared/value-strategy.md" %}

## Disabled

{% include "../../../shared/disabled-intro.md" %}

```typescript group="disabled-group" name="group.component.ts" icon="angular"
import { Signal, inject } from '@angular/core';
import { NgxfbGroupDirective } from '@ngx-formbar/reactive-forms';
import { Group } from './group.type';

@Component({
  // ...
})
export class GroupComponent {
  private readonly control = inject(NgxfbGroupDirective<Group>);
  readonly disabled: Signal<boolean> = this.control.disabled;
  readonly name: Signal<string> = this.control.name;
}
```

```html group="disabled-group" name="group.component.html"
<div [formGroupName]="name()">
  @for (content of controls(); track content[0]) {
    <ng-template *ngxfbAbstractControl="content" />
  }
</div>
<!-- Only show hint when group is disabled -->
@if(disabled()){
  <span>This is no longer relevant</span>
}
```

## Readonly

{% include "../../../shared/readonly-intro.md" %}

```typescript group="readonly-group" name="group.component.ts" icon="angular"
import { Signal, inject } from '@angular/core';
import { NgxfbGroupDirective } from '@ngx-formbar/reactive-forms';
import { Group } from './group.type';

@Component({
  // ...
})
export class GroupComponent {
  private readonly control = inject(NgxfbGroupDirective<Group>);
  readonly readonly: Signal<boolean> = this.control.readonly;
  readonly name: Signal<string> = this.control.name;
}
```

```html group="readonly-group" name="group.component.html"
<div [formGroupName]="name()">
  @for (content of controls(); track content[0]) {
    <ng-template *ngxfbAbstractControl="content" />
  }
</div>
@if(readonly()){
  <span>This cannot be edited</span>
}
```

## Dynamic Title

A group's title can be made responsive to other form data by using the `dynamicTitle` configuration property. You provide an expression string to dynamicTitle (e.g., 'Hello, ' + user.name), and the control's title text will then be computed based on this expression.

Your component can access this computed dynamic title via a signal (e.g., this.control.dynamicTitle). Typically, you'd use this dynamic title if it's available and evaluates to a meaningful string; otherwise, you might fall back to a statically configured title (e.g., this.control.title).

See the [Expressions guide](/fundamentals/expressions) for details on how expressions work and the [Configuration guide](/fundamentals/configuration) for other configuration options.

{% raw %}
```typescript group="dynamic-title" name="group.component.ts" icon="angular"
import { Signal, computed, inject } from '@angular/core';
import { NgxfbGroupDirective } from '@ngx-formbar/reactive-forms';
import { Group } from './group.type';

@Component({
  // ...
})
export class GroupComponent {
  private readonly control = inject(NgxfbGroupDirective<Group>);

  // Access the computed dynamic title from the directive.
  // It will be `undefined` if no 'dynamicTitle' expression is set or if it doesn't resolve to a string.
  readonly dynamicTitle: Signal<string | undefined> = this.control.dynamicTitle;

  readonly staticConfigTitle: Signal<string | undefined> = this.control.title;

  readonly displayTitle = computed(() => {
    const dynamic = this.dynamicTitle();
    if (dynamic && dynamic.trim() !== '') {
      return dynamic;
    }

    return this.staticConfigTitle() || '';
  });
}
```

```html group="dynamic-title" name="group.component.html"
<span> {{ displayTitle() }} </span>
```
{% endraw %}

## Test ID

{% include "../../../shared/test-id.md" %}

```typescript group="test-id-group" name="group.component.ts" icon="angular"
import { Signal, inject } from '@angular/core';
import { NgxfbGroupDirective } from '@ngx-formbar/reactive-forms';
import { Group } from './group.type';

@Component({
  // ...
})
export class GroupComponent {
  private readonly control = inject(NgxfbGroupDirective<Group>);
  readonly testId: Signal<string> = this.control.testId;
  readonly name: Signal<string> = this.control.name;
}
```

```html group="test-id-group" name="group.component.html"
<div [formGroupName]="name()"  [attr.data-testId]="testId() + '-wrapper'">
  @for (content of controls(); track content[0]) {
    <ng-template *ngxfbAbstractControl="content" />
  }
</div>
```

## Showing Errors

Showing errors works pretty much the same as always. You get access to the form control and then access `hasError`.

In TypeScript set up a getter

```typescript name="group.component.ts" icon="angular"
import { inject } from '@angular/core';
import { NgxfbGroupDirective } from '@ngx-formbar/reactive-forms';
import { Group } from './group.type';

// inject the instance of the directive
private readonly groupDirective = inject(NgxfbGroupDirective<Group>);

// Get access to the underlying form group
get formGroup() {
  return this.groupDirective.formGroup
}
```

Then, in your template you can do something like this

```html name="group.component.html"
@if(formGroup?.hasError('required')) {
  <span>Required</span>
}
```

## Directive Reference

The `NgxfbGroupDirective<T>` exposes the following public properties and methods:

| Property / Method                 | Type                                     | Description                                                               |
|-----------------------------------|------------------------------------------|---------------------------------------------------------------------------|
| `content`                         | `InputSignal<T>`                         | The configuration object of the group instance.                           |
| `name`                            | `InputSignal<string>`                    | The group's name (the key used in the configuration).                     |
| `controls`                        | `Signal<[string, NgxFbContent][]>`       | The child controls as key-value pairs from the group's `controls` config. |
| `isHidden`                        | `Signal<boolean>`                        | Whether the group is currently hidden.                                    |
| `hiddenAttribute`                 | `Signal<string \| null>`                 | The hidden attribute value for DOM binding. Returns `'hidden'` or `null`. |
| `disabled`                        | `Signal<boolean>`                        | Whether the group is currently disabled.                                  |
| `readonly`                        | `Signal<boolean>`                        | Whether the group is currently readonly.                                  |
| `title`                           | `Signal<string \| undefined>`            | The static title from the group's configuration.                          |
| `dynamicTitle`                    | `Signal<string \| undefined>`            | The computed dynamic title, if a `dynamicTitle` expression is configured. |
| `testId`                          | `Signal<string \| undefined>`            | The computed test ID for the group.                                       |
| `hideStrategy`                    | `Signal<string \| undefined>`            | The group's hide strategy (`'keep'` or `'remove'`).                       |
| `valueStrategy`                   | `Signal<ValueStrategy \| undefined>`     | The group's value strategy (`'last'`, `'default'`, or `'reset'`).         |
| `updateStrategy`                  | `Signal<'change' \| 'blur' \| 'submit'>` | The resolved update strategy for the group.                               |
| `formGroup`                       | `FormGroup \| null`                      | Getter for the underlying `FormGroup` instance.                           |
| `setVisibilityHandling(handling)` | `(StateHandling) => void`                | Sets visibility handling to `'auto'` or `'manual'`.                       |

### Advanced

| Property / Method               | Type                                     | Description                                                            |
|---------------------------------|------------------------------------------|------------------------------------------------------------------------|
| `parentFormGroup`               | `FormGroup \| null`                      | Getter for the parent `FormGroup` containing this group.               |
| `parentValueStrategy`           | `Signal<ValueStrategy \| undefined>`     | The parent's value strategy, used for inheritance.                     |
| `setDisabledHandling(handling)` | `(StateHandling) => void`                | Sets disabled handling to `'auto'` or `'manual'`. Default is `'auto'`. |
| `setTestIdBuilderFn(fn)`        | `(TestIdBuilderFn \| undefined) => void` | Overrides the test ID builder function for this group only.            |
