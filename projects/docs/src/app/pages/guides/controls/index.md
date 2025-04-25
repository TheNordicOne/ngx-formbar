---
keyword: ControlsPage
---
{% import "../../../shared/showing-errors.md" as showingErrors %}

A control can be whatever you need it to be. It can be as generic as a `TextControl`. be more specific like an `EMailControl`, just wrap existing controls like a `DateRangeControl` or have custom logic like a `SearchableDropdownControl`.

## Minimal Setup
> **Note**
> Checkout `*HelperPage` to see how to set up helpers.

{% include "../../../shared/control-setup.md" %}

## Base Configuration

{% include "../../../shared/base-configuration.md" %} 

The following configurations options are only applicable to controls.

| Name         | Type      | Required | Description                                                                                              |
|--------------|-----------|----------|----------------------------------------------------------------------------------------------------------|
| label        | `string`  | Yes      | Specifies the label for the control                                                                      |
| defaultValue | `unkown`  | No       | Should be overwritten with the proper value type of the control                                          |
| nonNullable  | `boolean` | No       | Whether this control can have a null value. Used to set the same property through the reactive forms API |


## Hidden

{% include "../../../shared/hidden-explanation.md" %}

```ts name="text-control.component.ts" group="visibility"
@Component({
  // ...
})
export class TextControlComponent {
  private readonly control = inject(NgxfwControlDirective<TextControl>);
  // Really only should ever be a boolean return value, but an expression could also return a number, string or object
  readonly isHidden: Signal<unknown> = this.control.isHidden; 
  
  constructor() {
    // Let formwork know, that you take care of handling visibility
    this.control.setVisibilityHandling('manual')
  }
}
```

```html name="text-control.component.html" group="visibility"
{% raw %}@if(isHidden()){
  <span>Some placeholder you want to use</span>
}
@if(!isHidden()){
  <label [htmlFor]="id()">{{ label() }}</label>
  <input
    [id]="id()"
    [formControlName]="id()"
  />
  <span>{{hint()}}</span>
}{% endraw %}
```

### Hide Strategy

{% include "../../../shared/hide-strategy-explanation.md" %}


### Value Strategy

{% include "../../../shared/value-strategy-explanation.md" %}


## Disabled

{% include "../../../shared/disabled-explanation.md" %}

```ts name="text-control.component.ts" group="disabled"
@Component({
  // ...
})
export class TextControlComponent {
  private readonly control = inject(NgxfwControlDirective<TextControl>);
  readonly disabled: Signal<boolean> = this.control.disabled;
}
```

```html name="text-control.component.html" group="disabled"
{% raw %}<label [htmlFor]="id()">{{ label() }}</label>
<input
  [id]="id()"
  [formControlName]="id()"
/>
<!-- Only show hint when control is disabled -->
@if(disabled()){
  <span>{{hint()}}</span>
}{% endraw %}
```

## Readonly

{% include "../../../shared/readonly-explanation.md" %}

```ts name="text-control.component.ts" group="readonly"
@Component({
  // ...
})
export class TextControlComponent {
  private readonly control = inject(NgxfwControlDirective<TextControl>);
  readonly readonly: Signal<boolean> = this.control.readonly;
}
```

```html name="text-control.component.html" group="readonly"
{% raw %}<label [htmlFor]="id()">{{ label() }}</label>
<input
  [id]="id()"
  [formControlName]="id()"
  [attr.readonly]="readonly() || null"
/>
<span>{{hint()}}</span>{% endraw %}
```

## Test ID

{% include "../../../shared/test-id.md" %}

```ts name="text-control.component.ts" group="testid"
@Component({
  // ...
})
export class TextControlComponent {
  private readonly control = inject(NgxfwControlDirective<TextControl>);
  readonly testId: Signal<string> = this.control.testId;
}
```

```html name="text-control.component.html" group="testid"
{% raw %}
<label [htmlFor]="id()" [attr.data-testId]="testId() + '-label'">{{ label() }}</label>
<input
  [attr.data-testId]="testId() + '-input'"
  [id]="id()"
  [formControlName]="id()"
/>{% endraw %}
```

## Showing Errors
{{ showingErrors.withDirective("TextControl", "Control") }} 
 
