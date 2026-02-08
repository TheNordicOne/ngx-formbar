{% raw %}
A group is used to group controls together. It results in an Angular `FormGroup` instance.

Most of the time you will only need one or two different group types. Where they really are handy though, is if you need different behaviors. For example one that does not do anything special visually and one that is collapsible.


## Scaffolding via Schematics

Run the Angular schematic to scaffold a new group and register it:

```bash
ng generate @ngx-formbar/core:group --key <group-key> [--name <ComponentName>]
```

See the Generators page for more details.


## Manual Setup

> **Note**
> Checkout the Helper Files guide to see how to set up helpers.

Here is an example of a simple group. Most likely you will only set up one or two group components, if at all.

First create an interface for your group.

```ts
// group.type.ts
export interface Group extends NgxFbFormGroup {
  // Unique Key of your group that is used for differentiating groups
  type: 'group';

  // Additional options only applicable to this group if you want
}
```

Then implement the component.

> **Warning**
> Be sure to bind to `[formGroupName]` on an element (e.g. div, ng-container)

```ts
// group.component.ts
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

```html
<!-- group.component.html -->
<!-- Just an example -->
<div [formGroupName]="name()">
  @for (content of controls(); track content[0]) {
    <ng-template *ngxfbAbstractControl="content" />
  }
</div>
```

Finally, register the group in _app.config.ts_

```ts
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    // other providers
    provideFormbar({
      componentRegistrations: {
        group: GroupComponent
      }
    })
  ],
};
```

## Configuration

Checkout the Configuration guide for how to configure a group.

## Hidden

By default, the visibility is handled by **formbar**. It will set the `hidden` attribute on your component, if a control or group should not be visible.

You have the option to handle this by yourself, but can only be configured on a component level.
It can be useful for when you want to work with `@if` to actually create and destroy components used in the template, or you want to show some placeholder instead.

The hidden state is determined using the following priority (`content` could be any of your controls or groups):
1. If `content.hidden` is an expression string, it's evaluated against the current form values
2. If no `hidden` expression is defined, the control inherits the hidden state from its parent group
3. Both conditions can be combined - a control is hidden if either its own condition evaluates to true **OR** its parent group is hidden

```ts
// group.component.ts
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

```html
<!-- group.component.html -->
@if(isHidden()){
  <span>Some placeholder you want to use</span>
}
@if(!isHidden()){
  <div [formGroupName]="name()">
    @for (control of controls(); track control.id) {
      <ng-template *ngxfbAbstractControl="control" />
    }
  </div>
}
```

### Hide Strategy

Besides visually hiding a control or group, the hidden state can have different effects depending on how this is handled in code.

This is relevant for when you have a hidden control, but still want to access its value through `this.form.value` or `this.form.getRawValue()`.

The following strategies are available:

| Strategy         | Effect                                                 |
|------------------|--------------------------------------------------------|
| `keep` (default) | The control remains in the form model even when hidden |
| `remove`         | The control is removed from the form model when hidden |

> **Alert**
> If you use the `remove` strategy you **must** ensure that your component does not try to render elements with a binding to `[formGroupName]` or `[formControlName]`!
>
> This is true even if you use the `auto` visibility state management! This is currently a limitation, for which I have not found a reasonable solution.
>
> Checkout the [GitHub Issue](https://github.com/TheNordicOne/ngx-formbar/issues/64) for more details.

### Value Strategy

There are different strategies for handling values during visibility changes. This allows you to control exactly what should happen with the values, if their control or group is being hidden.

The following strategies are available:

| Strategy            | Effect                                        |
|---------------------|-----------------------------------------------|
| `default` (default) | Sets the specified default value              |
| `last`              | Preserves the last input value                |
| `reset`             | Resets the value using the reactive forms api |

## Disabled

**formbar** will use Angulars reactive forms API to disable and enable a control or group. You can get access to the disabled state and use it in your template for whatever makes sense.

The disabled state is determined using the following priority (`content` could be any of your controls or groups):
1. If `content.disabled` is a boolean, that value is used directly
2. If `content.disabled` is an expression string, it's evaluated against the current form values
3. If no `disabled` property is defined, the control inherits the disabled state from its parent group

This hierarchical inheritance ensures that child controls are automatically
disabled when their parent group is disabled, unless explicitly overridden.

```ts
// group.component.ts
@Component({
  // ...
})
export class GroupComponent {
  private readonly control = inject(NgxfbGroupDirective<Group>);
  readonly disabled: Signal<boolean> = this.control.disabled;
  readonly name: Signal<string> = this.control.name;
}
```

```html
<!-- group.component.html -->
<div [formGroupName]="name()">
  @for (control of controls(); track control.id) {
    <ng-template *ngxfbAbstractControl="control" />
  }
</div>
<!-- Only show hint when group is disabled -->
@if(disabled()){
  <span>This is no longer relevant</span>
}
```

## Readonly

**formbar** does not mark a control as `readonly`, because there is no useful API for reactive forms to achieve this. But you can provide an expression, which will be evaluated, and then use that value in your template.

The readonly state is determined using the following priority (`content` could be any of your controls or groups):
1. If `content.readonly` is a boolean, that value is used directly
2. If `content.readonly` is an expression string, it's evaluated against the current form values
3. If no `readonly` property is defined, the control inherits the readonly state from its parent group

This hierarchical inheritance ensures that child controls are automatically
set to readonly when their parent group is readonly, unless explicitly overridden.

```ts
// group.component.ts
@Component({
  // ...
})
export class GroupComponent {
  private readonly control = inject(NgxfbGroupDirective<Group>);
  readonly readonly: Signal<boolean> = this.control.readonly;
  readonly name: Signal<string> = this.control.name;
}
```

```html
<!-- group.component.html -->
<div [formGroupName]="name()">
  @for (control of controls(); track control.id) {
    <ng-template *ngxfbAbstractControl="control" />
  }
</div>
@if(readonly()){
  <span>This cannot be edited</span>
}
```

## Dynamic Title

A group's title can be made responsive to other form data by using the `dynamicTitle` configuration property. You provide an expression string to dynamicTitle (e.g., 'Hello, ' + user.name), and the control's title text will then be computed based on this expression.

Your component can access this computed dynamic title via a signal (e.g., this.control.dynamicTitle). Typically, you'd use this dynamic title if it's available and evaluates to a meaningful string; otherwise, you might fall back to a statically configured title (e.g., this.control.title).

See the Expressions guide for details on how expressions work and the Configuration guide for other configuration options.

```ts
// group.component.ts
@Component({
  // ...
})
export class TextControlComponent {
  private readonly control = inject(NgxfbGroupDirective<Group>);

  // Access the computed dynamic title from the directive.
  // It will be `undefined` if no 'dynamicTitle' expression is set or if it doesn't resolve to a string.
  readonly dynamicTitle: Signal<string | undefined> = this.control.dynamicTitle;

  readonly staticConfigTitle: Signal<string> = this.control.title;

  readonly displayTitle = computed(() => {
    const dynamic = this.dynamicTitle();
    if (dynamic && dynamic.trim() !== '') {
      return dynamic;
    }

    return this.staticConfigTitle() || '';
  });
}
```

```html
<!-- group.component.html -->
<span> {{ displayTitle() }} </span>
```

## Test ID

To make testing easier, a base test id will always be generated for you.

### Default Behavior

By default, the test id is just equal to the control's `id`, prepended with its parent's test id if it's part of a group. For example, a control with `id: 'firstName'` inside a group with `testId: 'user-details'` would have a final test id of `'user-details-firstName'`. If the control is at the root level, its test id would simply be `'firstName'`.

### Customizing Test IDs

You can customize how test IDs are generated by providing a `testIdBuilderFn`. This function receives the control's content and its parent's test ID (if any) and should return the desired test ID string.

There are two ways to provide a custom `testIdBuilderFn`:

#### Global Configuration

You can define a global `testIdBuilderFn` when you set up Formbar using `provideFormbar`. This function will be used for all controls unless overridden at the component level.

```ts
provideFormbar({
  // ...
  globalConfig: {
    testIdBuilderFn: (content, parentTestId) => {
      return `${parentTestId ? parentTestId + '_' : ''}${content.type}-${content.id}`;
    },
  },
});
```

#### Control-Specific Configuration

Individual components can also define their own testIdBuilderFn. This is done within the component's logic by calling `setTestIdBuilderFn` on the injected `NgxfbControlDirective`. This allows for fine-grained control over how test IDs are generated for specific components

This example demonstrate how to do this for a Control, but it works exactly the same for Groups and Blocks.

```ts
// text-control.component.ts
@Component({
  // ...
})
export class TextControlComponent {
  private readonly control = inject(NgxfbControlDirective<TextControl>);

  constructor() {
      this.control.setTestIdBuilderFn(simpleTestIdBuilder);
  }
}
```

#### Precedence
The test ID generation follows this order of precedence:

1. Control-Specific testIdBuilderFn: If a function is set directly on the control instance.
2. Global testIdBuilderFn: If defined in the provideFormbar configuration.
3. Default Behavior: If no custom builder function is provided.

This system provides flexibility, allowing you to set a general rule for test IDs across your application while still being able to override it for specific cases.

Here is an example of how to access the test ID.

```ts
// group.component.ts
@Component({
  // ...
})
export class GroupComponent {
  private readonly control = inject(NgxfbGroupDirective<Group>);
  readonly testId: Signal<string> = this.control.testId;
  readonly name: Signal<string> = this.control.name;
}
```

```html
<!-- group.component.html -->
<div [formGroupName]="name()"  [attr.data-testId]="testId() + '-wrapper'">
  @for (control of controls(); track control.id) {
    <ng-template *ngxfbAbstractControl="control" />
  }
</div>
```

## Showing Errors

Showing errors works pretty much the same as always. You get access to the form control and then access `hasError`.

In TypeScript set up a getter

```ts
// inject the instance of the directive
private readonly group = inject(NgxfbGroupDirective<Group>);

// Get access to the underlying form group}
get group() {
  return this.group.formControl
}
```

Then, in your template you can do something like this

```html
@if(group?.hasError('required')) {
  <span>Required</span>
}
```

{% endraw %}
