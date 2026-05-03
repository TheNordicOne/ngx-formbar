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

| Token                          | Default       | Purpose                                           |
|--------------------------------|---------------|---------------------------------------------------|
| NGX_FW_COMPONENT_REGISTRATIONS | Empty Map     | Maps type strings to `ComponentRegistrationEntry` |
| NGX_FW_COMPONENT_RESOLVER      | -             | Provides access to the component registration map |
| NGX_FW_DEFAULT_UPDATE_STRATEGY | `'change'`    | Application-wide default update strategy          |
| NGX_FW_DEFAULT_CONFIG          | `{}`          | Base global configuration                         |
| NGX_FW_CONFIG                  | `[]`          | Additional configuration partials to merge        |
| NGX_FW_CONFIG_RESOLVED         | Merged result | Final resolved configuration                      |
