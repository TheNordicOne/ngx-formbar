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

### resolveDisabledEffect

Creates an Angular effect that calls enable/disable functions based on a disabled signal. When `StateHandling` is `'auto'`, it manages state automatically. When `'manual'`, the component handles it.

```typescript
resolveDisabledEffect({
  disabledSignal: disabled,
  disabledHandlingSignal: stateHandling,
  enableFunction: () => control.enable(),
  disableFunction: () => control.disable(),
});
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

Returns `true` or `null` for binding to the HTML `hidden` attribute. Respects `StateHandling` — when set to `'manual'`, always returns `null`.

```typescript
const hiddenAttr = resolveHiddenAttribute({
  hiddenSignal: hidden,
  hiddenHandlingSignal: stateHandling,
});
// Use in template: [attr.hidden]="hiddenAttr()"
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
const loadComponent = registrationService.registrations().get('text');
// Returns the LoadComponentFn (lazy loader) registered for 'text'
```

### NgxFbConfigurationService

Provides access to the resolved global configuration, such as the `testIdBuilderFn`.

## Tokens

| Token                          | Default       | Purpose                                           |
|--------------------------------|---------------|---------------------------------------------------|
| NGX_FW_COMPONENT_REGISTRATIONS | Empty Map     | Maps type strings to `LoadComponentFn` loaders    |
| NGX_FW_COMPONENT_RESOLVER      | -             | Provides access to the component registration map |
| NGX_FW_DEFAULT_UPDATE_STRATEGY | `'change'`    | Application-wide default update strategy          |
| NGX_FW_DEFAULT_CONFIG          | `{}`          | Base global configuration                         |
| NGX_FW_CONFIG                  | `[]`          | Additional configuration partials to merge        |
| NGX_FW_CONFIG_RESOLVED         | Merged result | Final resolved configuration                      |
