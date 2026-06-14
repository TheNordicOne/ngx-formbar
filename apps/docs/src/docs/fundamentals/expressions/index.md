Expressions are JavaScript-like snippets provided as strings. They are parsed by an in-tree allow-list parser (adapted from [jsep](https://github.com/EricSmekens/jsep) under MIT license) and evaluated in a controlled environment against the form's value. Expressions have no access to globals, host code, or any function outside the supplied form context.

## Parsing and Caching

- **Parsing:**
  An expression string is parsed into an AST by an in-tree parser. The grammar is restricted to a small subset of JavaScript expressions; statements, declarations, control flow, classes, assignments, `this`, dynamic `import`, `await`, `yield`, `new`, tagged templates, and update operators (`++`/`--`) are all parse errors. Each evaluation must produce exactly one expression. Multi-statement and comma-sequence inputs are rejected.

- **Caching:**
  Parsed ASTs are cached in a bounded LRU. Repeated evaluations of the same expression source reuse the parsed AST. The cache evicts the least-recently-used entry when full, so unbounded dynamic expression strings cannot grow it without limit.

## Supported Node Types

The parser produces only the following AST node types:

- `Identifier`
- `Literal` (strings, numbers, booleans, `null`, regex literals)
- `ArrayExpression` (with optional spread elements)
- `UnaryExpression` (`-`, `+`, `!`, `~`, `typeof`, `void`)
- `BinaryExpression`
- `LogicalExpression` (`&&`, `||`, `??`)
- `MemberExpression` (static `a.b` and computed `a[b]`, both with optional chaining `?.`)
- `ConditionalExpression` (ternary)
- `ObjectExpression` (with optional spread)
- `TemplateLiteral` with `${expr}` placeholders (one expression per placeholder)
- `CallExpression` for safe method calls only (arguments may use spread, e.g. `s.concat(...rest)`)
- `ArrowFunctionExpression` for higher-order array methods (e.g. `items.map(x => x * 2)`)

`SequenceExpression`, `SpreadElement` (outside of containers), `ThisExpression`, `BlockStatement`, `AssignmentExpression`, `UpdateExpression`, `NewExpression`, `YieldExpression`, `AwaitExpression`, `ImportExpression`, `ClassExpression`, `FunctionExpression`, `TaggedTemplateExpression`, `PrivateIdentifier`, and `Super` are all rejected at parse time.

## Supported Operators

- **Arithmetic Operators:** `+`, `-`, `*`, `/`, `%`, `\*\*` (exponentiation, right-associative). Division and modulo by zero throw, diverging from JS which returns `Infinity`/`NaN`.
- **Comparison Operators:** `<`, `>`, `<=`, `>=` (both operands must be same primitive type, number or string).
- **Equality Operators:** `==`, `!=`, `===`, `!==`. **In this DSL, `==` is equivalent to `===` and `!=` to `!==`.** Loose-equality coercion (`0 == ""`, `null == undefined`, etc.) is intentionally rejected.
- **Bitwise Operators:** `|`, `&`, `^`, `<<`, `>>`, `>>>`
- **Logical Operations:** `&&`, `||`, `??` (short-circuit evaluation)
- **Membership:** `in` (left operand must be a string, right operand an object)
- **Unary Operators:** `-`, `+`, `!`, `~`, `typeof`, `void`
- **Safe Method Calls:** Method calls are gated by a per-type allow-list. Arrays admit only non-mutating methods (`map`, `filter`, `reduce`, `slice`, `concat`, `find`, `includes`, etc.). Strings, numbers, and booleans have a curated allow-list. Plain objects, `Date`, `Map`, `Set`, and `RegExp` instances expose **no** callable methods.

## Limitations

- **Pure expression language.** One expression per evaluation. `1; 2`, `1\n2`, and `(a, b)` are all parse errors. Multi-statement input is not supported.

- **No mutating operations.** Assignments and update operators are parse errors. Mutating method calls (e.g. `arr.sort()`, `arr.push(x)`, `date.setHours(12)`) are all rejected at runtime: the call gate's allow-list contains only non-mutating methods. The form context is never mutated through expressions.

- **Strict identifier scope.** Identifiers resolve from own properties of the form context (or arrow function parameters in arrow bodies). Prototype-chain members like `constructor`, `toString`, `hasOwnProperty` are not visible. Globals (`window`, `globalThis`, `Function`, `eval`) are not visible.

- **String member access is tight.** Only `.length` and canonical non-negative integer indices (`"abc"[0]`, `"abc"["1"]`) are readable. Non-canonical indices (`"abc"["  1  "]`, `"abc"["0x1"]`) and raw method extraction (`"abc".toUpperCase` as a value) throw. Method calls via the call form (`"abc".toUpperCase()`) still work.

- **Plain-object and function member access is hasOwn-only.** Reading a prototype-inherited property on a plain object returns `undefined`. Reading any property on a function value throws.

- **Cross-group `computedValue` references:**
  String expressions in `computedValue` that reference fields inside sibling groups (e.g., `'groupA.fieldA + groupB.fieldB'`) do not resolve on initial render ([#83](https://github.com/TheNordicOne/ngx-formbar/issues/83)). This affects only `computedValue`; other expression properties (`hidden`, `disabled`, `readonly`, `dynamicLabel`, `dynamicTitle`) work correctly with cross-group references. Use optional chaining as a workaround: `'groupA?.fieldA + " " + groupB?.fieldB'`.

## Threat Boundary

The sandbox protects **access** (no read of host state outside the supplied context) and **integrity** (no mutation of values passed in as context). Object literals and object spreads skip `__proto__` keys, so `{__proto__: x}` cannot reset the prototype of the returned object. It does **not** protect **availability**. A sufficiently pathological expression can hang the host tab. Examples include catastrophic-backtracking regex, deeply nested operations, and huge string allocations via `"x".repeat(1e9)`. Authors who supply expressions are responsible for not writing such code. Integrators who run expressions during server-side rendering must reject untrusted expression sources.

## Function-Based Expressions

In addition to string-based expressions, you can provide a JavaScript function directly for properties that support expressions (e.g., `hidden`, `disabled`, `readonly`, `computedValue`, `dynamicLabel`, `dynamicTitle`). This is type-safe and can use any TypeScript logic.

### Signature

These functions receive the current `formValue` (an object representing the entire form's data) as their single argument and return a value of the type appropriate for the property they control.

The general signature is:

```typescript
(formValue: FormContext) => T;
```

Where:

- `formValue: FormContext`: An object where keys are the ids of your form controls and values are their current values. FormContext is an alias for `Record<string, unknown>`.
- `T`: The expected return type, which varies depending on the property.
  - hidden: `boolean`
  - disabled: `boolean`
  - readonly: `boolean`
  - computedValue: `unknown` (it should return the same type of value as your control uses)
  - dynamicLabel: `string | null`
  - dynamicTitle: `string | null`

### Advantages

- Type Safety: When using TypeScript, function-based expressions provide better type checking for both the formValue and the return type.
- Complex Logic: You can implement more complex logic directly within the function, without the limitations of the string-based expression parser.
- No Parsing Overhead: Since it's already a function, there's no need for AST parsing.
- Access to Outer Scope: These functions can call any other function from your app.

### Disadvantages

- Non-Serializable: Function-based Expressions are not serializable to JSON and therefore should only be used if the form configuration is not stored in a database.
- Can be verbose: For very simple expressions (e.g.: `!termsAgreed`, `username === 'admin'`) using a function-based expression may be overkill and decrease readability.

### Example

```typescript name="example.form.ts"
// In your form configuration
{
  type: 'text',
  label: 'My Field',
  hidden: (formValue: FormContext): boolean => {
    return formValue['someOtherField'] === 'specificValue' && formValue['anotherField'] > 10;
  },
  defaultValue: ''
}
```

## Type-Safe formValue

{% include "../../shared/typed-form-value.md" %}
