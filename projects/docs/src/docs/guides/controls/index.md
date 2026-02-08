{% raw %}
A control can be whatever you need it to be. It can be as generic as a `TextControl`. be more specific like an `EMailControl`, just wrap existing controls like a `DateRangeControl` or have custom logic like a `SearchableDropdownControl`.

## Scaffolding via Schematics

Run the Angular schematic to scaffold a new control and register it:

```bash
ng generate @ngx-formbar/core:control --key <control-key> [--name <ComponentName>]
```

See the Generators page for more details.

## Manual Setup

> **Note**
> Checkout the Helper Files guide to see how to set up helpers.

Here is an example of a simple text control.

First create an interface for your control.

```typescript name="text-control.type.ts"
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

```typescript group="text-control" name="text-control.component.ts" icon="angular"
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

Finally, register the control in _app.config.ts_

```typescript name="app.config.ts"
export const appConfig: ApplicationConfig = {
  providers: [
    // other providers
    provideFormbar({
      componentRegistrations: {
        text: TextControlComponent
      }
    })
  ],
};
```

## Configuration

Checkout the Configuration guide for how to configure a control.

## Hidden

By default, the visibility is handled by **formbar**. It will set the `hidden` attribute on your component, if a control or group should not be visible.

You have the option to handle this by yourself, but can only be configured on a component level.
It can be useful for when you want to work with `@if` to actually create and destroy components used in the template, or you want to show some placeholder instead.

The hidden state is determined using the following priority (`content` could be any of your controls or groups):
1. If `content.hidden` is an expression string, it's evaluated against the current form values
2. If no `hidden` expression is defined, the control inherits the hidden state from its parent group
3. Both conditions can be combined - a control is hidden if either its own condition evaluates to true **OR** its parent group is hidden

```typescript group="hidden-control" name="text-control.component.ts" icon="angular"
@Component({
  // ...
})
export class TextControlComponent {
  private readonly control = inject(NgxfbControlDirective<TextControl>);
  // Really only should ever be a boolean return value, but an expression could also return a number, string or object
  readonly isHidden: Signal<unknown> = this.control.isHidden;
  readonly name: Signal<string> = this.control.name;

  constructor() {
    // Let formbar know, that you take care of handling visibility
    this.control.setVisibilityHandling('manual');
  }
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

```typescript group="disabled-control" name="text-control.component.ts" icon="angular"
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

## Readonly

**formbar** does not mark a control as `readonly`, because there is no useful API for reactive forms to achieve this. But you can provide an expression, which will be evaluated, and then use that value in your template.

The readonly state is determined using the following priority (`content` could be any of your controls or groups):
1. If `content.readonly` is a boolean, that value is used directly
2. If `content.readonly` is an expression string, it's evaluated against the current form values
3. If no `readonly` property is defined, the control inherits the readonly state from its parent group

This hierarchical inheritance ensures that child controls are automatically
set to readonly when their parent group is readonly, unless explicitly overridden.

```typescript group="readonly-control" name="text-control.component.ts" icon="angular"
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

## Computed Values

In some cases it is desirable to (pre)-fill certain inputs with a value based on other controls. This can be done by utilizing the `computedValue` property. It will automatically set the value based on the provided expression. If the control can be edited by the user, it will only overwrite the value if a dependency changes. Usually you will want to make it readonly though.

See the Expressions guide for details on how expressions work and the Configuration guide for other configuration options.

## Dynamic Label

A control's label can be made responsive to other form data by using the `dynamicLabel` configuration property. You provide an expression string to dynamicLabel (e.g., 'Hello, ' + user.name), and the control's label text will then be computed based on this expression.

Your component can access this computed dynamic label via a signal (e.g., this.control.dynamicLabel). Typically, you'd use this dynamic label if it's available and evaluates to a meaningful string; otherwise, you might fall back to a statically configured label (e.g., this.control.label).

See the Expressions guide for details on how expressions work and the Configuration guide for other configuration options.

```typescript group="dynamic-label" name="text-control.component.ts" icon="angular"
@Component({
  // ...
})
export class TextControlComponent {
  private readonly control = inject(NgxfbControlDirective<TextControl>);

  // Access the computed dynamic label from the directive.
  // It will be `undefined` if no 'dynamicLabel' expression is set or if it doesn't resolve to a string.
  readonly dynamicLabel: Signal<string | undefined> = this.control.dynamicLabel;

  readonly staticConfigLabel: Signal<string> = this.control.label;
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

## Test ID

To make testing easier, a base test id will always be generated for you.

### Default Behavior

By default, the test id is just equal to the control's `id`, prepended with its parent's test id if it's part of a group. For example, a control with `id: 'firstName'` inside a group with `testId: 'user-details'` would have a final test id of `'user-details-firstName'`. If the control is at the root level, its test id would simply be `'firstName'`.

### Customizing Test IDs

You can customize how test IDs are generated by providing a `testIdBuilderFn`. This function receives the control's content and its parent's test ID (if any) and should return the desired test ID string.

There are two ways to provide a custom `testIdBuilderFn`:

#### Global Configuration

You can define a global `testIdBuilderFn` when you set up Formbar using `provideFormbar`. This function will be used for all controls unless overridden at the component level.

```typescript name="app.config.ts"
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

```typescript name="text-control.component.ts" icon="angular"
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

```typescript group="test-id-control" name="text-control.component.ts" icon="angular"
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

## Showing Errors

Showing errors works pretty much the same as always. You get access to the form control and then access `hasError`.

In TypeScript set up a getter

```typescript name="text-control.component.ts" icon="angular"
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

{% endraw %}
