## Overview

Version 2.0.0 is a structural overhaul. The monolithic `@ngx-formbar/core` is split into four focused packages, component registrations move from a bare `Type<unknown>` to a `ComponentRegistrationEntry` shape, and the headline change is that consumer components stop applying library *directives* and instead *implement an interface*. You write a normal Angular component with `input()` signals matching one of the formbar contracts (`ReactiveFormbarControl`, `ReactiveFormbarGroup`, `FormbarBlock`); the library mounts the component dynamically and writes the inputs by name. There are no more `hostDirectives`, no more `inject(NgxfbControlDirective)`, and no `*ngxfbAbstractControl` template iteration in groups.

**New package structure:**

| Package                       | Purpose                                                                                 |
|-------------------------------|-----------------------------------------------------------------------------------------|
| `@ngx-formbar/core`           | Types, expression engine, DI tokens, services. **No `@angular/forms` peer dependency.** |
| `@ngx-formbar/reactive-forms` | Form component, provider setup, validators, composables, the interface contracts.       |
| `@ngx-formbar/schematics`     | `control` / `group` / `block` / `register` generators.                                  |
| `@ngx-formbar/setup`          | Internal helper for the schematics (installed automatically as a dep).                  |

## Prerequisites

- Angular 19.2.0 or higher

## Step 1: Install the new packages

Replace your single `@ngx-formbar/core` runtime dependency with the split packages.

```shell
npm install @ngx-formbar/core @ngx-formbar/reactive-forms
npm install -D @ngx-formbar/schematics
```

> **Note**
> `@ngx-formbar/schematics` is only required if you use the code generators. `@ngx-formbar/setup` is pulled in automatically as a transitive dependency of the schematics, so you do not install it directly.

## Step 2: Update the `ng add` command

The `ng add` target moved from core to reactive-forms.

```shell
# Before
ng add @ngx-formbar/core

# After
ng add @ngx-formbar/reactive-forms
```

## Step 3: Update generator commands

Code generators now live in `@ngx-formbar/schematics` and there is a new `register` generator.

```shell
# Before
ng generate @ngx-formbar/core:control
ng generate @ngx-formbar/core:group
ng generate @ngx-formbar/core:block

# After
ng generate @ngx-formbar/schematics:control
ng generate @ngx-formbar/schematics:group
ng generate @ngx-formbar/schematics:block
ng generate @ngx-formbar/schematics:register
```

The `--hostDirectiveHelperPath` option no longer exists. Generators emit interface-based components and have no host-directive scaffolding to point at.

## Step 4: Move runtime imports to `@ngx-formbar/reactive-forms`

The form component, `provideFormbar`, `defineFormbarConfig`, and validator types and tokens all moved out of core.

**Before:**

```typescript
import {
  NgxfbFormComponent,
  provideFormbar,
  defineFormbarConfig,
  ValidatorConfig,
  AsyncValidatorConfig,
  RegistrationRecord,
  NGX_FW_VALIDATOR_REGISTRATIONS,
  NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS,
  NGX_VALIDATOR_RESOLVER,
} from '@ngx-formbar/core';
```

**After:**

```typescript
import {
  NgxfbFormComponent,
  provideFormbar,
  defineFormbarConfig,
  ValidatorConfig,
  AsyncValidatorConfig,
  RegistrationRecord,
  NGX_FW_VALIDATOR_REGISTRATIONS,
  NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS,
  NGX_VALIDATOR_RESOLVER,
} from '@ngx-formbar/reactive-forms';
```

Pure type and token imports (`Expression`, `NgxFbControl`, `ExpressionService`, `NGX_FW_COMPONENT_REGISTRATIONS`, etc.) stay on `@ngx-formbar/core`. See [What stays in core](#what-stays-in-ngx-formbarcore).

## Step 5: Wrap component registrations as `ComponentRegistrationEntry`

A registration is no longer a bare component class. It is either a static entry (`{ component }`) or a lazy entry (`{ loadComponent }`), optionally with registration options. The `staticComponent()` and `loadComponent()` helpers from `@ngx-formbar/core` build them for you.

**Before:**

```typescript
import { provideFormbar } from '@ngx-formbar/core';
import { TextControlComponent } from './text-control.component';
import { GroupComponent } from './group.component';

provideFormbar({
  componentRegistrations: {
    text: TextControlComponent,
    group: GroupComponent,
  },
});
```

**After (recommended, using helpers):**

```typescript
import { staticComponent, loadComponent } from '@ngx-formbar/core';
import { provideFormbar } from '@ngx-formbar/reactive-forms';
import { TextControlComponent } from './text-control.component';

provideFormbar({
  componentRegistrations: {
    text: staticComponent(TextControlComponent),
    group: loadComponent(() =>
      import('./group.component').then((m) => m.GroupComponent),
    ),
  },
});
```

**After (without helpers):**

```typescript
provideFormbar({
  componentRegistrations: {
    text: { component: TextControlComponent },
    group: {
      loadComponent: () =>
        import('./group.component').then((m) => m.GroupComponent),
    },
  },
});
```

Static and lazy entries can be mixed freely. This shape applies everywhere registrations live: `provideFormbar()`, `defineFormbarConfig()`, standalone registration files, and any `Map`-based token registrations.

If you have a custom `ComponentResolver`, change its `registrations` signal type from `Signal<ReadonlyMap<string, Type<unknown>>>` to `Signal<ReadonlyMap<string, ComponentRegistrationEntry>>` (`ComponentRegistrationEntry` is exported from `@ngx-formbar/core`).

## Step 6: Refactor consumer components to the interface contract

This is the biggest change. In v1 your components attached library directives via `hostDirectives` and pulled state out by injecting them. In v2 your component declares signal inputs and *implements* one of the formbar contracts. The library writes those inputs when it mounts the component.

The three contracts live in `@ngx-formbar/reactive-forms`:

| Contract                      | Use for                                | `T extends`        |
|-------------------------------|----------------------------------------|--------------------|
| `ReactiveFormbarControl<T>`   | Leaf form controls (input, select, …)  | `NgxFbControl`     |
| `ReactiveFormbarGroup<T>`     | Container nodes that hold children     | `NgxFbFormGroup`   |
| `FormbarBlock<T>`             | Non-control content (notes, dividers)  | `NgxFbBlock`       |

Custom properties on `T` beyond the base interface automatically become required signal inputs on the component contract.

### 6a. Refactor a control

**Before (v1, host directive plus inject):**

```typescript
import { Component, inject, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxfbControlDirective } from '@ngx-formbar/core';

@Component({
  selector: 'app-text-control',
  imports: [ReactiveFormsModule],
  hostDirectives: [
    {
      directive: NgxfbControlDirective,
      inputs: ['content', 'name'],
    },
  ],
  template: `
    <label [htmlFor]="name()">{{ control.label() }}</label>
    <input
      type="text"
      [id]="name()"
      [formControlName]="name()"
      [placeholder]="control.content().placeholder ?? ''"
    />
  `,
})
export class TextControlComponent {
  protected readonly control = inject(NgxfbControlDirective);
  readonly name = input.required<string>();
}
```

**After (v2, implements `ReactiveFormbarControl<T>`):**

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { ReactiveFormbarControl } from '@ngx-formbar/reactive-forms';
import { NgxFbControl, Expression } from '@ngx-formbar/core';

interface TextControl extends NgxFbControl {
  placeholder?: Expression<string>;
}

@Component({
  selector: 'app-text-control',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label [htmlFor]="name()">{{ labelText() }}</label>
    <input
      type="text"
      [id]="name()"
      [formControlName]="name()"
      [placeholder]="placeholder() ?? ''"
      [attr.readonly]="isReadonly() || null"
    />
  `,
})
export class TextControlComponent implements ReactiveFormbarControl<TextControl> {
  readonly name = input.required<string>();
  readonly isDisabled = input(false);
  readonly isReadonly = input(false);
  readonly isHidden = input(false);
  readonly labelText = input<string | undefined>('');
  readonly dynamicLabel = input<string>();
  readonly testId = input('');
  readonly placeholder = input<string>();
  readonly errors = input<ValidationErrors | null>(null);
  readonly isDirty = input(false);
}
```

There are no `hostDirectives`, no `inject(NgxfbControlDirective)`, and the schema field (`placeholder`) is just an input declared on the component.

### 6b. Refactor a group

Groups receive their children through `<ngxfb-control-outlet />` (component `NgxfbControlOutlet` from `@ngx-formbar/reactive-forms`). The outlet picks up the registered child entries automatically via injection. You no longer iterate `content` with `*ngxfbAbstractControl`.

**Before:**

```typescript
import { Component, inject, input } from '@angular/core';
import { NgxfbAbstractControlDirective, NgxfbGroupDirective } from '@ngx-formbar/core';

@Component({
  selector: 'app-group',
  imports: [NgxfbAbstractControlDirective],
  hostDirectives: [
    {
      directive: NgxfbGroupDirective,
      inputs: ['content', 'name'],
    },
  ],
  template: `
    <fieldset [formGroupName]="name()">
      <legend>{{ group.title() }}</legend>
      @for (content of group.content().controls; track content.id) {
        <ng-template *ngxfbAbstractControl="content" />
      }
    </fieldset>
  `,
})
export class GroupComponent {
  protected readonly group = inject(NgxfbGroupDirective);
  readonly name = input.required<string>();
}
```

**After:**

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  NgxfbControlOutlet,
  ReactiveFormbarGroup,
} from '@ngx-formbar/reactive-forms';

@Component({
  selector: 'app-group',
  imports: [ReactiveFormsModule, NgxfbControlOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fieldset [formGroupName]="name()" [attr.data-testid]="testId()">
      <legend>{{ titleText() }}</legend>
      <ngxfb-control-outlet />
    </fieldset>
  `,
})
export class GroupComponent implements ReactiveFormbarGroup {
  readonly name = input.required<string>();
  readonly isDisabled = input(false);
  readonly isReadonly = input(false);
  readonly isHidden = input(false);
  readonly titleText = input<string | undefined>('');
  readonly dynamicTitle = input<string>();
  readonly testId = input('');
}
```

### 6c. Refactor a block

Blocks have no `FormControl`. They never receive `isDisabled` or `isReadonly`, only `isHidden`, `testId`, and the schema-defined inputs.

**Before:**

```typescript
import { Component, inject, input } from '@angular/core';
import { NgxfbBlockDirective } from '@ngx-formbar/core';

@Component({
  selector: 'app-note',
  hostDirectives: [
    {
      directive: NgxfbBlockDirective,
      inputs: ['content', 'name'],
    },
  ],
  template: `<p>{{ block.content().message }}</p>`,
})
export class NoteComponent {
  protected readonly block = inject(NgxfbBlockDirective);
  readonly name = input.required<string>();
}
```

**After:**

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormbarBlock } from '@ngx-formbar/reactive-forms';
import { NgxFbBlock, Expression } from '@ngx-formbar/core';

interface NoteBlock extends NgxFbBlock {
  message: Expression<string>;
  severity?: Expression<'info' | 'warn' | 'danger'>;
}

@Component({
  selector: 'app-note',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>{{ message() }}</p>`,
})
export class NoteComponent implements FormbarBlock<NoteBlock> {
  readonly isHidden = input(false);
  readonly testId = input('');
  readonly message = input.required<string>();
  readonly severity = input<'info' | 'warn' | 'danger'>();
}
```

## Step 7: Remove host-directive helpers and related setup

If your codebase has any of the following, delete it. None of it has any meaning in v2:

- `hostDirectives: [{ directive: NgxfbControlDirective, inputs: [...] }]` (and the group/block variants) on consumer components.
- `inject(NgxfbControlDirective)`, `inject(NgxfbGroupDirective)`, `inject(NgxfbBlockDirective)` from inside consumer components.
- Any local "host directive helper" file your generator emitted in v1 that re-exported a configured `hostDirectives` entry.
- A `hostDirectiveHelperPath` setting in your `angular.json` schematic options.

The library's directives still exist as **internal mounting infrastructure**, but they are no longer the public consumer-facing surface. Your components do not reference them.

## Step 8: Configure registration options instead of in-component handling

Two registration options replace any in-component lifecycle wiring you may have done in v1:

| Option                | Values               | Default  | Effect                                                                                                                                                                                                                                                                                                                                  |
|-----------------------|----------------------|----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `keepValueWhenHidden` | `'auto' \| 'manual'` | `'auto'` | `'auto'`: the library destroys the consumer component when the resolved hidden state becomes true and recreates it when shown again, then runs the configured `valueStrategy`. `'manual'`: the library only forwards the resolved `isHidden` signal. The component stays mounted and is responsible for its own DOM and value handling. |
| `disabledHandling`    | `'auto' \| 'manual'` | `'auto'` | `'auto'`: the library calls `enable()`/`disable()` on the form control as the resolved disabled signal changes. `'manual'`: the library does not touch the form control. The component reads `isDisabled` and applies it itself.                                                                                                        |

Pass them as the second argument to `staticComponent()` / `loadComponent()`, or inline on the entry object.

```typescript
import { staticComponent, loadComponent } from '@ngx-formbar/core';
import { provideFormbar } from '@ngx-formbar/reactive-forms';

provideFormbar({
  componentRegistrations: {
    customDateRange: staticComponent(DateRangeComponent, {
      keepValueWhenHidden: 'manual',
      disabledHandling: 'manual',
    }),
    lazyChart: loadComponent(
      () => import('./chart.component').then((m) => m.ChartComponent),
      { keepValueWhenHidden: 'manual' },
    ),
  },
});
```

The defaults match v1's behavior, so most registrations need no options at all.

## Step 9: Audit `hideStrategy` behavior

The two `hideStrategy` values keep their meaning, but the way the library implements them in v2 is uniform. With `keepValueWhenHidden: 'auto'` (the default), the consumer component is destroyed when the resolved hidden state becomes true and recreated when it becomes false again, regardless of `hideStrategy`. The strategies still differ in what happens to the form control:

- `'keep'` (default): the form control stays attached to the parent group while the component is hidden. The configured `valueStrategy` is applied to the existing form control.
- `'remove'`: the form control is removed from the parent group on hide and reattached on show. On reattach, the value is determined by the `valueStrategy` (with `'last'` restored from the form-level lifecycle cache).

If your v1 code relied on the keep strategy keeping the component itself mounted (for example to preserve an internal component-only state across hide/show cycles), move that state into the form model or wrap the relevant subtree in your own `@if`.

## What stays in `@ngx-formbar/core`

The following remain in `@ngx-formbar/core` and need no path change:

**Types:** `Expression`, `FormContext`, `NgxFbForm`, `NgxFbContent`, `NgxFbBaseContent`, `NgxFbControl`, `NgxFbFormGroup`, `NgxFbBlock`, `ComponentResolver`, `ComponentRegistrationConfig`, `ComponentRegistrationEntry`, `ComponentRegistrationOptions`, `StaticRegistration`, `LazyRegistration`, `LoadComponentFn`, `NgxFbGlobalConfiguration`, `UpdateStrategy`, `StateHandling`, `SignalInput`, `ToSignalInputs`.

**Helpers:** `staticComponent`, `loadComponent`.

**DI tokens:** `NGX_FW_COMPONENT_REGISTRATIONS`, `NGX_FW_COMPONENT_RESOLVER`, `NGX_FW_DEFAULT_UPDATE_STRATEGY`, `NGX_FW_CONFIG`.

**Services:** `ExpressionService`, `ComponentRegistrationService`, `NgxFbConfigurationService`.

If your code only imports types and tokens from `@ngx-formbar/core`, those imports are unchanged.

## Quick reference

| Symbol                                                           | v1                               | v2.0.0                                                          |
|------------------------------------------------------------------|----------------------------------|-----------------------------------------------------------------|
| `NgxfbFormComponent`                                             | `@ngx-formbar/core`              | `@ngx-formbar/reactive-forms`                                   |
| `provideFormbar`                                                 | `@ngx-formbar/core`              | `@ngx-formbar/reactive-forms`                                   |
| `defineFormbarConfig`, `FormbarConfig`                           | `@ngx-formbar/core`              | `@ngx-formbar/reactive-forms`                                   |
| `ValidatorConfig`, `AsyncValidatorConfig`                        | `@ngx-formbar/core`              | `@ngx-formbar/reactive-forms`                                   |
| `NGX_FW_VALIDATOR_REGISTRATIONS`                                 | `@ngx-formbar/core`              | `@ngx-formbar/reactive-forms`                                   |
| `NGX_FW_ASYNC_VALIDATOR_REGISTRATIONS`                           | `@ngx-formbar/core`              | `@ngx-formbar/reactive-forms`                                   |
| `NGX_VALIDATOR_RESOLVER`                                         | `@ngx-formbar/core`              | `@ngx-formbar/reactive-forms`                                   |
| `ReactiveFormbarControl`, `ReactiveFormbarGroup`, `FormbarBlock` | *did not exist*                  | `@ngx-formbar/reactive-forms`                                   |
| `NgxfbControlOutlet`                                             | *did not exist*                  | `@ngx-formbar/reactive-forms`                                   |
| `staticComponent`, `loadComponent`, `ComponentRegistrationEntry` | *did not exist*                  | `@ngx-formbar/core`                                             |
| `Expression`, `NgxFbForm`, `NgxFbControl`, etc.                  | `@ngx-formbar/core`              | `@ngx-formbar/core` (unchanged)                                 |
| `ExpressionService`, `NGX_FW_COMPONENT_REGISTRATIONS`            | `@ngx-formbar/core`              | `@ngx-formbar/core` (unchanged)                                 |
| Component registration shape                                     | `Type<unknown>`                  | `ComponentRegistrationEntry`                                    |
| Consumer component contract                                      | `hostDirectives` + `inject(...)` | `implements ReactiveFormbarControl` / `…Group` / `FormbarBlock` |
| Group child template                                             | `*ngxfbAbstractControl`          | `<ngxfb-control-outlet />`                                      |
| `ng add`                                                         | `@ngx-formbar/core`              | `@ngx-formbar/reactive-forms`                                   |
| Code generators                                                  | `@ngx-formbar/core:*`            | `@ngx-formbar/schematics:*`                                     |
