{% import "../../../shared/scaffolds.njk" as scaffold %}

An array renders a repeating row from a single row definition. It results in an Angular `FormArray` instance. Each row is built from the array's `rowControl`, which can be a control, a group, or another array.

The `FormArray` is the source of truth for the rows. You own the template: the row loop, the markup, and the add and remove buttons. The library builds and inserts row controls for you and renders a single row's controls through `<ngxfb-form-array-outlet [index]>`. You add and remove rows through the array context the library provides, and the form value follows.

Arrays are plain Angular components that implement the `ReactiveFormbarArray<T>` contract, the same way controls and groups work. The library writes its state into your component through signal inputs.

## Configuration

An array node sets `type` to your registered key and a `rowControl` describing one row:

```typescript name="array config"
{
  type: 'array',
  label: 'Tags',
  rowControl: {
    type: 'text',
    label: 'Tag',
  },
}
```

A row can be a group, which makes each row a sub-form:

```typescript name="group rows"
{
  type: 'array',
  label: 'Contacts',
  rowControl: {
    type: 'group',
    controls: {
      name: { type: 'text', label: 'Name' },
      email: { type: 'text', label: 'Email' },
    },
  },
}
```

## Manual Setup

{% include "../../../shared/helper-files-note.md" %}

First create an interface for your array.

```typescript name="array.type.ts"
import { NgxFbArray } from '@ngx-formbar/core';

export interface Array extends NgxFbArray {
  // Unique key of your array that is used for differentiating arrays
  type: 'array';

  // Additional options only applicable to this array if you want
  addLabel?: string;
}
```

Then implement the component. Bind the `FormArray` as the container with `[formArrayName]`, iterate the rows from the array context, and place `<ngxfb-form-array-outlet [index]="$index" />` inside the loop where each row's controls should appear. The outlet renders the controls for that one row and binds them to its index. You own the loop and the add and remove buttons; use the injected array context for the operations.

> **Warning**
> Be sure to bind to `[formArrayName]` on an element (e.g. `div`, `ng-container`) and give each `<ngxfb-form-array-outlet [index]>` the row's index.

{% raw %}

```typescript group="array-component" name="array.component.ts" icon="angular"
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxFbFormArrayOutlet, NGXFB_ARRAY_CONTROL, ReactiveFormbarArray } from '@ngx-formbar/reactive-forms';
import { Array } from './array.type';
import { controlContainerViewProviders } from './control-container.view-provider';

@Component({
    selector: 'app-array',
    imports: [ReactiveFormsModule, NgxFbFormArrayOutlet],
    templateUrl: './array.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    viewProviders: controlContainerViewProviders,
})
export class ArrayComponent implements ReactiveFormbarArray<Array> {
    // Required. The library always provides this
    readonly name = input.required<string>();

    // The library provides the array context: live rows plus add/insert/remove
    protected readonly array = inject(NGXFB_ARRAY_CONTROL);

    // Optional contract inputs. Declare only the ones you use
    readonly labelText = input<string | undefined>('');
    readonly testId = input('');

    // Custom inputs from Array beyond NgxFbArray go here
    readonly addLabel = input<string>();
}
```

```html group="array-component" name="array.component.html"
<fieldset>
  <legend>{{ labelText() }}</legend>

  <div [formArrayName]="name()">
    @for (row of array.rows(); track row) {
      <div class="row">
        <ngxfb-form-array-outlet [index]="$index" />
        <button type="button" (click)="array.removeAt($index)">Remove</button>
      </div>
    }
  </div>

  <button type="button" (click)="array.add()">{{ addLabel() ?? 'Add' }}</button>
</fieldset>
```

{% endraw %}

You own the row loop. Iterate `array.rows()` (the live row controls) and place one `<ngxfb-form-array-outlet [index]="$index" />` per row. The outlet renders that row's controls and keeps them bound to the index. Track by the control identity so insert and remove re-key the surviving rows correctly. Put add and remove buttons wherever the design calls for them; the library renders no buttons of its own.

Finally, register the array in _app.config.ts_

```typescript name="app.config.ts"
import { ApplicationConfig } from '@angular/core';
import { loadComponent, staticComponent } from '@ngx-formbar/core';
import { provideFormbar } from '@ngx-formbar/reactive-forms';
import { ArrayComponent } from './array.component';

export const appConfig: ApplicationConfig = {
  providers: [
    // other providers
    provideFormbar({
      componentRegistrations: {
        array: staticComponent(ArrayComponent),
      },
    }),
  ],
};
```

## Reusability

A formbar component is input-driven, so the same component works whether formbar drives it from config or you place it in a plain reactive form yourself. For an array the difference is how rows are built and rendered. With formbar, the injected array context supplies the rows plus the add and remove operations, and `<ngxfb-form-array-outlet>` renders each row. Without formbar there is no array context, so the reusable array also accepts an `itemFactory` to build rows and a `<ng-template #item>` to render them.

**Formbar only**

```typescript group="array-formbar-only" name="formbar-array-control.component.ts" file="../../../../../../../libs/examples/reactive-forms/src/lib/components/formbar-array/formbar-array-control.component.ts"
```

```html group="array-formbar-only" name="formbar-array-control.component.html" file="../../../../../../../libs/examples/reactive-forms/src/lib/components/formbar-array/formbar-array-control.component.html"
```

**Reusable**

```typescript group="array-reusable" name="array-control.component.ts" file="../../../../../../../libs/examples/reactive-forms/src/lib/components/array/array-control.component.ts"
```

```html group="array-reusable" name="array-control.component.html" file="../../../../../../../libs/examples/reactive-forms/src/lib/components/array/array-control.component.html"
```

The reusable array is the same component plus the standalone row path: it makes the array context optional, falls back to the raw `FormArray`, and renders a consumer `<ng-template #item>` built from an `itemFactory`. That extra logic is what lets the same component grow and render rows without formbar.

Used directly in a plain reactive form, with no formbar config. There is no array context, so you provide an `itemFactory` to build new rows and a `<ng-template #item>` to render each one:

{% raw %}

```html name="standalone.component.html"
<form [formGroup]="form">
  <ngxfb-examples-array-control name="tags" labelText="Tags" [itemFactory]="newTag">
    <ng-template #item let-i="index" let-removeAt="removeAt">
      <div class="tag-row">
        <input type="text" placeholder="Tag" [formControlName]="i" />
        <button type="button" (click)="removeAt(i)">Remove</button>
      </div>
    </ng-template>
  </ngxfb-examples-array-control>
</form>
```

{% endraw %}

## The Array Context

The library provides `NGXFB_ARRAY_CONTROL`, an injectable context for the array component:

| Member       | Type                              | Description                                                       |
|--------------|-----------------------------------|-------------------------------------------------------------------|
| `rowControl` | `Signal<NgxFbItem>`               | The configured row definition.                                    |
| `rows`       | `Signal<AbstractControl[]>`        | The live row controls. Updates when rows are added or removed.    |
| `add`        | `() => void`                      | Appends a new row, built from `rowControl`.                       |
| `insertAt`   | `(index: number) => void`         | Inserts a new row at the given index.                            |
| `removeAt`   | `(index: number) => void`         | Removes the row at the given index.                              |
| `move`       | `(from: number, to: number) => void` | Moves a row to a new index, shifting the rows in between. The row keeps its identity and cached value. |

Add, insert, and remove build and place row controls for you; `move` re-inserts an existing row rather than building one. You never construct a row control yourself.

## Row Controls

The library builds each row from `rowControl` with the `RowFactoryService`. A scalar row becomes a `FormControl`, a group row becomes a `FormGroup` with all of its children, and a nested array row becomes an empty `FormArray`. Validators, `nonNullable`, and default values from the row definition are applied at build time. `updateOn` is applied only when the row sets it; when omitted, the row inherits the array's `updateOn` (and ultimately the application default) through Angular's native parent chain, exactly as a control inherits its group's `updateOn` outside an array.

A group row renders its children with the standard `<ngxfb-control-outlet />`, exactly like a top-level group. Build a group component as described in the [Groups guide](/reactive-forms/guides/groups) and reference it from `rowControl`.

## Loading Values

Angular's `patchValue` and `setValue` do not grow a `FormArray`. Patching an array value into an empty `FormArray` silently keeps it empty, and `setValue` throws on a length mismatch. To load data that includes array rows, use the `load` method on `<ngxfb-form>`. It sizes every configured array to match the incoming data (growing or shrinking), then patches.

Get a reference to the form component and call `load`:

```typescript name="host.component.ts" icon="angular"
import { Component, viewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { NgxFbFormComponent } from '@ngx-formbar/reactive-forms';

@Component({
    // ...
})
export class HostComponent {
    readonly formRef = viewChild.required(NgxFbFormComponent);
    readonly form = new FormGroup({ /* ... */ });

    loadExisting(data: Record<string, unknown>): void {
        this.formRef().load(data);
    }
}
```

Scalar and group values follow `patchValue` semantics, so partial data is fine. Arrays are different: each one is first sized to match the incoming data, so a key absent from the data empties its array (every row is removed), while extra keys are ignored.

### Loading Without the Helper

If you grow the arrays yourself, you can patch the form directly. Inject the `RowFactoryService` to build rows from your row definition, push enough rows to match your data, then patch:

```typescript name="manual load" icon="angular"
import { inject } from '@angular/core';
import { FormArray } from '@angular/forms';
import { RowFactoryService } from '@ngx-formbar/reactive-forms';

const rowFactory = inject(RowFactoryService);
const tags = form.get('tags') as FormArray;

while (tags.length < data.tags.length) {
  tags.push(rowFactory.build(tagRowControl));
}
form.patchValue(data);
```

## Hidden

{% include "../../../shared/hidden-intro.md" %}

The array as a whole supports `hidden` like any other control. Controls inside a row support `hidden` as well, including `hideStrategy: 'remove'`, because a hidden row child detaches and re-attaches by name within its row and does not affect the other rows.

Declare the `isHidden` input and use it in your template:

{{ scaffold.arrayTs("hidden-array", "    readonly isHidden = input(false);") }}

{% raw %}

```html group="hidden-array" name="array.component.html"
@if (isHidden()) {
  <span>Some placeholder you want to use</span>
} @else {
  <fieldset>
    <div [formArrayName]="name()">
      @for (row of array.rows(); track row) {
        <ngxfb-form-array-outlet [index]="$index" />
      }
    </div>
  </fieldset>
}
```

{% endraw %}

> **Note**
> The row's top control may not use `hideStrategy: 'remove'`. The array renders its rows from the `FormArray`, so a removed row top would have nothing left to evaluate its hidden expression and could never be restored. Rows are therefore always kept. This is the one intentional divergence from a non-array control: it is a compile-time error on `rowControl` and is also rejected at runtime. Use `add`, `insertAt`, and `removeAt` to change which rows exist.

{% include "../../../shared/value-strategy.md" %}

`valueStrategy: 'last'` is supported for controls inside rows. The remembered value is tied to the row's identity, so it follows the row across insert, remove, and reorder rather than sticking to a fixed index.

## Disabled

{% include "../../../shared/disabled-intro.md" %}

Disabling the array disables its rows, since `FormArray.disable()` cascades.

Declare the `isDisabled` input and use it in your template:

{{ scaffold.arrayTs("disabled-array", "    readonly isDisabled = input(false);") }}

{% raw %}

```html group="disabled-array" name="array.component.html"
<fieldset>
  <div [formArrayName]="name()">
    @for (row of array.rows(); track row) {
      <ngxfb-form-array-outlet [index]="$index" />
    }
  </div>
</fieldset>

@if (isDisabled()) {
  <span>This is no longer relevant</span>
}
```

{% endraw %}

## Readonly

{% include "../../../shared/readonly-intro.md" %}

Declare the `isReadonly` input and use it in your template:

{{ scaffold.arrayTs("readonly-array", "    readonly isReadonly = input(false);") }}

{% raw %}

```html group="readonly-array" name="array.component.html"
<fieldset>
  <div [formArrayName]="name()">
    @for (row of array.rows(); track row) {
      <ngxfb-form-array-outlet [index]="$index" />
    }
  </div>
</fieldset>

@if (isReadonly()) {
  <span>This cannot be edited</span>
}
```

{% endraw %}

## Dynamic Label

To make an array's label respond to other form data, use the `dynamicLabel` configuration property. You provide an expression (e.g. `'Tags for ' + user.name`); the library evaluates it and forwards the result through the `dynamicLabel` signal input.

Declare both `labelText` (the static value from the configuration) and `dynamicLabel`, then derive a `displayLabel` that prefers the dynamic value when it resolves to something meaningful:

See the [Expressions guide](/fundamentals/expressions) for details on how expressions work and the [Configuration guide](/fundamentals/configuration) for other configuration options.

{{ scaffold.arrayTs("dynamic-label-array", "    readonly labelText = input<string | undefined>('');
    readonly dynamicLabel = input<string | null>();

    readonly displayLabel = computed(() => {
        const dynamic = this.dynamicLabel();
        if (dynamic && dynamic.trim() !== '') {
            return dynamic;
        }
        return this.labelText();
    });", core="Component, computed, inject, input") }}

{% raw %}

```html group="dynamic-label-array" name="array.component.html"
<fieldset>
  <legend>{{ displayLabel() }}</legend>
  <div [formArrayName]="name()">
    @for (row of array.rows(); track row) {
      <ngxfb-form-array-outlet [index]="$index" />
    }
  </div>
</fieldset>
```

{% endraw %}

## Test ID

{% include "../../../shared/test-id.md" %}

{{ scaffold.arrayTs("test-id-array", "    readonly testId = input('');") }}

{% raw %}

```html group="test-id-array" name="array.component.html"
<fieldset [attr.data-testid]="testId() + '-wrapper'">
  <div [formArrayName]="name()">
    @for (row of array.rows(); track row) {
      <ngxfb-form-array-outlet [index]="$index" />
    }
  </div>
</fieldset>
```

{% endraw %}

## Showing Errors

The contract exposes the resolved validation errors through the `errors` signal input and the dirty status through `isDirty`, the same as controls and groups.

{{ scaffold.arrayTs("errors-array", "    readonly errors = input<ValidationErrors | null>(null);
    readonly isDirty = input(false);", forms="ValidationErrors") }}

{% raw %}

```html group="errors-array" name="array.component.html"
<fieldset>
  <div [formArrayName]="name()">
    @for (row of array.rows(); track row) {
      <ngxfb-form-array-outlet [index]="$index" />
    }
  </div>
</fieldset>

@if (isDirty() && errors()?.['required']) {
  <span>Required</span>
}
```

{% endraw %}

For advanced cases that need the underlying `FormArray` (for example reading `pending`), declare the optional `arrayInstance` input. The library writes the resolved `FormArray` into it.

## Component Contract Reference

The `ReactiveFormbarArray<T>` contract is implemented by your component. The library detects which inputs you declared (by name) and writes its resolved values into them, so every input below is optional except `name`. Any property you add to `T` beyond `NgxFbArray` becomes an additional signal input on the contract.

| Input           | Type                                       | Description                                                                       |
|-----------------|--------------------------------------------|-----------------------------------------------------------------------------------|
| `name`          | `SignalInput<string>` (**required**)       | The array's name (the key used in the configuration).                             |
| `isDisabled`    | `SignalInput<boolean>`                     | Whether the array is currently disabled.                                          |
| `isReadonly`    | `SignalInput<boolean>`                     | Whether the array is currently readonly.                                          |
| `isHidden`      | `SignalInput<boolean>`                     | Whether the array is currently hidden (already accounts for parent inheritance).  |
| `testId`        | `SignalInput<string>`                      | The computed test ID for the array.                                               |
| `hideStrategy`  | `SignalInput<HideStrategy \| undefined>`   | The array's hide strategy (`'keep'` or `'remove'`).                               |
| `valueStrategy` | `SignalInput<ValueStrategy \| undefined>`  | The array's value strategy.                                                       |
| `errors`        | `SignalInput<ValidationErrors \| null>`    | Validation errors of the underlying form array.                                   |
| `isDirty`       | `SignalInput<boolean>`                     | Whether the underlying form array is dirty.                                       |
| `labelText`     | `SignalInput<string \| undefined>`         | The static `label` value from the array configuration.                            |
| `dynamicLabel`  | `SignalInput<string \| null \| undefined>` | The computed dynamic label, if a `dynamicLabel` expression is configured.         |
| `arrayInstance` | `SignalInput<FormArray>`                   | The underlying `FormArray` instance. Only declare this when you need direct access. |
