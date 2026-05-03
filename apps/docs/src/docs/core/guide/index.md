The `@ngx-formbar/core` package provides the foundation for building your own form integration. It contains the expression engine, composable functions, DI tokens, and services that `@ngx-formbar/reactive-forms` is built on. You can use it directly to create integrations for other form approaches.

## What the core package provides

**Composables** resolve form configuration into reactive signals. They handle expression parsing, state inheritance from parent groups, and update strategy resolution.

**Services** provide expression evaluation and component registration lookups.

**Tokens** wire everything together via Angular's dependency injection.

## Composables

Composables are functions that return signals. They are designed to be called inside an injection context (e.g. in a directive's constructor).

### resolveExpression

Resolves an `Expression<T>` into a computed signal. String expressions are parsed and evaluated against the form context. Functions are called with the form context. Static values are returned as-is.

```typescript
const label = resolveExpression(
  labelOption,     // Signal<Expression<string> | string | undefined>
  formContext,     // Signal<FormContext>
  expressionService,
);
// label() returns the resolved string or undefined
```

### resolveInheritableExpression

Like `resolveExpression`, but falls back to a parent state when the option is undefined. Use this for states that should inherit from parent groups, like `disabled` and `readonly`.

```typescript
const disabled = resolveInheritableExpression(
  disabledOption,  // Signal<Expression<boolean> | boolean | undefined>
  formContext,
  expressionService,
  parentDisabled,  // Signal<boolean>
);
// If disabledOption is undefined, inherits parentDisabled
```

### resolveHiddenState

Resolves hidden state with parent combination logic. Unlike other inheritable states, string expressions are combined with the parent using OR logic: a control is hidden if its own expression evaluates to true **or** if its parent is hidden.

```typescript
const hidden = resolveHiddenState(
  hiddenOption,
  formContext,
  expressionService,
  parentHidden,
);
```

### resolveUpdateStrategy

Resolves the update strategy using a priority chain: control value > parent group > application default.

```typescript
const updateOn = resolveUpdateStrategy(
  controlUpdateOn,  // Signal<UpdateStrategy | undefined>
  parentStrategy,   // Signal<UpdateStrategy | undefined>
  defaultStrategy,  // UpdateStrategy (injected via NGX_FW_DEFAULT_UPDATE_STRATEGY)
);
```

### resolveTestId

Generates hierarchical test IDs using a configurable builder function.

```typescript
const testId = resolveTestId(
  content,            // Signal<NgxFbBaseContent>
  name,               // Signal<string>
  localTestIdBuilder, // Signal<TestIdBuilderFn | undefined>
  globalTestIdBuilder,
  parentTestId,       // Signal<string | undefined>
);
// Default output: "parentTestId-name"
```

### resolveHiddenAttribute

Returns `true` or `null` for binding to the HTML `hidden` attribute. Respects `StateHandling`: when `handleVisibility` resolves to `false` (the consumer manages visibility itself), always returns `null`.

```typescript
const hiddenAttr = resolveHiddenAttribute({
  hiddenSignal: hidden,
  handleVisibility,    // Signal<boolean>: true when the library handles visibility
});
// Use in template: [attr.hidden]="hiddenAttr()"
```

### withBase

Splits a directive's `FormConfigEntry` input into its constituent signals and resolves the matching component registration. Returns the inner config, the bound name, the registration entry (or `null`), and the loaded component class. Must run in an injection context because it reads `NGX_FW_COMPONENT_RESOLVER`.

```typescript
const { controlConfig, controlName, registrationEntry, component } =
  withBase(this.config); // Signal<FormConfigEntry<T>>
```

### withComponentHost

Manages a host for a dynamically created component. Returns `{ mount, clear }`; the component is destroyed automatically when the directive is torn down. Inputs declared on the mounted component but absent from `signalMap` fall back to values on `controlConfig`.

```typescript
const host = withComponentHost({
  signalMap,        // Map<string, Signal<unknown>>
  controlConfig,    // Signal<object>
  additionalProviders, // optional Provider[] exposed via a child injector
});

host.mount(SomeComponent);
host.clear();
```

### withInheritedValue

Reads a field from the directive's own config and falls back to a parent group's signal for the same field when the own value is `undefined`. Useful for inheritable settings like `hideStrategy` or `valueStrategy`.

```typescript
const hideStrategy = withInheritedValue(
  controlConfig,                     // Signal<T>
  'hideStrategy',                    // K extends keyof T
  parentGroup?.hideStrategy,         // Signal<T[K]> | undefined
);
```

### withLoadedComponent

Resolves a `ComponentRegistrationEntry` to its component class as a signal. Static registrations resolve synchronously; lazy registrations resolve when the dynamic import settles. Emits `null` until a class is available or when the entry is `null`.

```typescript
const component = withLoadedComponent(registrationEntry);
// component(): Type<unknown> | null
```

### withDynamicLabel / withDynamicTitle / withComputedValue

Each wraps `resolveExpression` and reads the form value from `NGX_FW_FORM_VALUE`. Returns a signal of the evaluated result, or `undefined` when the corresponding field is not configured.

```typescript
const dynamicLabel = withDynamicLabel(content);   // Signal<NgxFbControl>
const dynamicTitle = withDynamicTitle(content);   // Signal<NgxFbFormGroup>
const computedValue = withComputedValue<number>(content); // Signal<NgxFbAbstractControl>
```

### withHiddenState

Resolves the local `hidden` expression and OR-combines it with the parent group's hidden state read from `NGX_FW_PARENT_CONTEXT`. A hidden parent forces the child to hidden regardless of the child's local expression.

```typescript
const isHidden = withHiddenState(content); // Signal<boolean>
```

### withDisabledState / withReadonlyState

Wrap `resolveInheritableExpression`. The child's `disabled` / `readonly` field, if defined, takes precedence; otherwise, the value is inherited from the parent group via `NGX_FW_PARENT_CONTEXT`.

```typescript
const isDisabled = withDisabledState(content);
const isReadonly = withReadonlyState(content);
```

### withTestId

Builds a hierarchical test id using `NgxFbConfigurationService.testIdBuilder`, scoped under the parent group's resolved test id when present.

```typescript
const testId = withTestId(content, name); // Signal<string>
```

### withUpdateStrategy

Resolves the update strategy in the priority chain *own > parent > application default*, reading the parent from `NGX_FW_PARENT_CONTEXT` and the default from `NGX_FW_DEFAULT_UPDATE_STRATEGY`.

```typescript
const updateOn = withUpdateStrategy(content); // Signal<UpdateStrategy>
```

## Services

### ExpressionService

Parses and evaluates JavaScript expressions within a form context. Uses the acorn parser and supports a safe subset of JavaScript:

- Member access, optional chaining, binary/logical/unary operators
- Ternary expressions, template literals, array/object literals
- Arrow functions (expression bodies only)
- Safe method calls on strings, numbers, and arrays

Assignments, `new`, `this`, `super`, and `import` are intentionally unsupported for security.

```typescript
const expressionService = inject(ExpressionService);
const ast = expressionService.parseExpressionToAst('user.age > 18');
const result = expressionService.evaluateExpression(ast, { user: { age: 25 } });
// result === true
```

### ComponentRegistrationService

Provides access to the component type mapping as a read-only signal.

```typescript
const registrationService = inject(ComponentRegistrationService);
const entry = registrationService.registrations().get('text');
// Returns the ComponentRegistrationEntry registered for 'text'
```

### NgxFbConfigurationService

Provides access to the resolved global configuration, such as the `testIdBuilderFn`.

## Tokens

| Token                          | Default       | Purpose                                                                              |
|--------------------------------|---------------|--------------------------------------------------------------------------------------|
| NGX_FW_COMPONENT_REGISTRATIONS | Empty Map     | Maps type strings to `ComponentRegistrationEntry`                                    |
| NGX_FW_COMPONENT_RESOLVER      | -             | Provides access to the component registration map                                    |
| NGX_FW_DEFAULT_UPDATE_STRATEGY | `'change'`    | Application-wide default update strategy                                             |
| NGX_FW_DEFAULT_CONFIG          | `{}`          | Base global configuration                                                            |
| NGX_FW_CONFIG                  | `[]`          | Additional configuration partials to merge                                           |
| NGX_FW_CONFIG_RESOLVED         | Merged result | Final resolved configuration                                                         |
| NGX_FW_FORM_VALUE              | -             | `Signal<FormContext>` of the current form value. Provided per form by integrations   |
| NGX_FW_PARENT_CONTEXT          | -             | `NgxFwParentContext` of the enclosing group. Provided by group directives themselves |

## Building an integration

`@ngx-formbar/core` is form-agnostic. It owns the configuration model, the expression engine, the registration system, dynamic component mounting, and all state-resolution logic — but it has no opinion about where form values live or how the form model gets updated. An integration package wires those two ends together.

`@ngx-formbar/reactive-forms` is one such integration, built on top of `@angular/forms`. The same shape applies if you want to build an integration on signal-forms, template-driven forms, or pure local state.

### Three layers

Think of a complete formbar setup as three layers stacked vertically:

1. **Core (provided).** Configuration types, expression evaluation, component registrations, dynamic mounting, and state resolution (`with*` and `resolve*`).
2. **Integration tokens (you provide).** Two DI tokens that bridge core to your form-state source.
3. **Form-model glue (you build).** Effects and lifecycles that mutate your form model — applying disabled state, writing computed values, attaching/removing controls on hide, validation, and so on.

Core only requires the middle layer to function. Once those tokens are provided, every `with*` composable in core works inside any directive or component that runs in an injection context with access to them.

### The two tokens you must provide

**`NGX_FW_FORM_VALUE: InjectionToken<Signal<FormContext>>`** — the current form value as a signal. Composables that evaluate expressions (`withDynamicLabel`, `withHiddenState`, `withComputedValue`, etc.) read from this token. Provide it once per form, sourced from wherever your integration holds form state.

**`NGX_FW_PARENT_CONTEXT: InjectionToken<NgxFwParentContext>`** — the enclosing group's state and inheritable directive options. Whatever construct represents a group in your integration (a directive, a component, a service) implements `NgxFwParentContext` and provides itself as this token.

The interface specifies seven signals that a parent must expose:

```typescript
interface NgxFwParentContext {
  readonly isHidden: Signal<boolean>;
  readonly isDisabled: Signal<boolean>;
  readonly isReadonly: Signal<boolean>;
  readonly testId: Signal<string>;
  readonly hideStrategy: Signal<HideStrategy | undefined>;
  readonly valueStrategy: Signal<ValueStrategy | undefined>;
  readonly updateStrategy: Signal<UpdateStrategy>;
}
```

If your integration has no concept for a particular field, return a sentinel: `false` for booleans, `''` for `testId`, `undefined` for the optional strategies. Composables that read parent context use `inject(NGX_FW_PARENT_CONTEXT, { optional: true, skipSelf: true })`, so top-level entries (no enclosing group) get `null` and behave correctly. The `skipSelf` matters because a group directive that provides itself must look up the parent above its own provided context.

### Provider pattern

How `@ngx-formbar/reactive-forms` wires the two tokens:

```typescript
// The form root provides NGX_FW_FORM_VALUE.
@Component({
  selector: 'ngxfb-form',
  // ...
  providers: [
    FormService,
    {
      provide: NGX_FW_FORM_VALUE,
      useFactory: () => inject(FormService).formValue,
    },
  ],
})
export class NgxfbFormComponent { /* ... */ }

// A group directive implements NgxFwParentContext and provides itself.
@Directive({
  selector: '[ngxfbGroup]',
  providers: [
    { provide: NGX_FW_PARENT_CONTEXT, useExisting: NgxFbGroupDirective },
  ],
})
export class NgxFbGroupDirective implements NgxFwParentContext {
  readonly isHidden = withHiddenState(this.controlConfig);
  readonly isDisabled = /* ... */;
  readonly isReadonly = withReadonlyState(this.controlConfig);
  readonly testId = withTestId(this.controlConfig, this.controlName);
  readonly hideStrategy = withInheritedValue(/* ... */);
  readonly valueStrategy = withInheritedValue(/* ... */);
  readonly updateStrategy = withUpdateStrategy(this.controlConfig);
  // ...
}
```

A pure-state integration (no `@angular/forms`) might look like this instead:

```typescript
// Form-state source: a single writable signal.
@Component({
  // ...
  providers: [
    {
      provide: NGX_FW_FORM_VALUE,
      useFactory: () => inject(MyFormStateService).value,
    },
  ],
})
export class MyFormComponent { /* ... */ }
```

### What you still have to build

Core does not own the form-model side. Your integration is responsible for:

- **Where form values actually live** and how user input writes back to that store. Core only reads — it never writes form values.
- **Applying state.** When the resolved `isDisabled` flips to `true`, *something* in your integration has to disable the underlying input. Same for readonly, hidden DOM presence, value strategy on hide/show.
- **Validation.** Core evaluates `validators: string[]` keys from the configuration into your validator type, but you decide how to register and run validators.
- **Form lifecycle.** Reset behaviour, dirty tracking, error surfacing — all integration-specific.

`@ngx-formbar/reactive-forms` handles these via a thin layer of effects (`disabledEffect`, `setComputedValueEffect`, `hiddenEffects`) wrapped around the core composables, plus its own `withControlState`/`withFormParent` helpers. The pattern is reusable as a template.

### Minimal integration sketch

A directive that uses the configuration to resolve hidden/disabled state, mounts the registered component, and lets your form-state source handle everything else:

```typescript
@Directive({ selector: '[myControl]' })
export class MyControlDirective {
  readonly config = input.required<FormConfigEntry<NgxFbControl>>({
    alias: 'myControl',
  });

  private readonly base = withBase(this.config);
  private readonly controlConfig = this.base.controlConfig;
  private readonly controlName = this.base.controlName;

  readonly isHidden = withHiddenState(this.controlConfig);
  readonly isDisabled = withDisabledState(this.controlConfig);
  readonly testId = withTestId(this.controlConfig, this.controlName);

  private readonly signalMap = toSignalMap<MyControlContract>({
    name: this.controlName,
    isHidden: this.isHidden,
    isDisabled: this.isDisabled,
    testId: this.testId,
  });

  private readonly host = withComponentHost({
    signalMap: this.signalMap,
    controlConfig: this.controlConfig,
  });

  constructor() {
    afterRenderEffect(() => {
      const component = this.base.component();
      this.host.clear();
      if (component && !this.isHidden()) {
        this.host.mount(component);
      }
    });
  }
}
```

That's enough to render configured components reactively. Add your form-model effects on top to write values, apply disabled state to the underlying input, and run validators.
