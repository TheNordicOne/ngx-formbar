---
title: Expressions
keyword: ExpressionsPage
sidebar:
  order: 6
---

Expressions are JavaScript snippets provided as strings. They are parsed into an Abstract Syntax Tree (AST) using [Acorn](https://www.npmjs.com/package/acorn). The AST is then evaluated in a controlled environment against the forms value (onValueChange).

## Parsing and Caching

- **Parsing:**  
  An expression string is parsed to generate an AST.

- **Caching:**  
  Parsed ASTs are cached to avoid reparsing the same expression multiple times. This improves performance when evaluating expressions repeatedly.

## Supported Node Types

The evaluator supports a range of node types:

- `Identifier`
- `Literal`
- `ArrayExpression`
- `UnaryExpression`
- `BinaryExpression`
- `LogicalExpression` (supports `&&`, `||`, and nullish coalescing `??`)
- `MemberExpression` (property access with safety checks for null or undefined objects)
- `ConditionalExpression` (ternary operator)
- `ObjectExpression`
- `SequenceExpression`
- `TemplateLiteral`
- `CallExpression` for invoking safe methods
- `ArrowFunctionExpression` for simple arrow functions with expression bodies

## Supported Operators
- **Arithmetic Operators:** `+`, `-`, `*`, `/`, `%`
- **Comparison Operators:** `<`, `>`, `<=`, `>=`
- **Equality Operators:** `==`, `!=`, `===`, `!==` (follow JavaScript behavior)
- **Bitwise Operators:** `|`, `&`, `^`, `<<`, `>>`, `>>>`
- **Logical Operations:** `&&`, `||`, `??`
- **Safe Method Calls:** When calling methods on objects, the evaluator checks against a whitelist of safe methods (provided for strings, numbers, booleans, and arrays). This ensures that only approved operations are executed.

## Limitations

- **Restricted Syntax:**  
  Complex function bodies or block statements in arrow functions are not supported. Only simple expression-based arrow functions are allowed.

- **Restricted Node Types:**  
  Some JavaScript features are not supported to maintain security and simplicity, such as update expressions, assignments, and using `this` or `super`.

- **Controlled Context:**  
  The evaluation runs only in the context of the form object, avoiding global access and potential security vulnerabilities.

## Function-based Expressions

In addition to string-based expressions, you can also provide a JavaScript function directly for properties that support expressions (e.g., `hidden`, `disabled`, `readonly`, `computedValue`, `dynamicLabel`). This offers a more powerful and type-safe way to define dynamic behavior.

### Signature

These functions receive the current `formValue` (an object representing the entire form's data) as their single argument and are expected to return a value of the type appropriate for the property they are controlling.

The general signature is:

```typescript
(formValue: FormContext) => T
```

Where:
- `formValue: FormContext`: An object where keys are the ids of your form controls and values are their current values. FormContext is an alias for `Record<string, unknown>`.
- `T`: The expected return type, which varies depending on the property.
  - hidden: `boolean`
  - disabled: `boolean`
  - readonly: `boolean`
  - computedValue: `unknow` (it should return the same type of value as your control uses)
  - dynamicLabel: `string`


### Advantages
- Type Safety: When using TypeScript, function-based expressions provide better type checking for both the formValue and the return type.
- Complex Logic: You can implement more complex logic directly within the function, without the limitations of the string-based expression parser.
- No Parsing Overhead: Since it's already a function, there's no need for AST parsing.
- Access to Outer Scope: These functions can use any other function from your app, allowing for more flexible and reusable logic.

### Disadvantages
- Non-Serializable: Function-based Expressions are not serializable to JSON and therefore should only be used if the form configuration is not stored in a database.
- Can be verbose: For very simple expressions (e.g.: `!termsAgreed`, `username === 'admin'`) using a function-based expression may be overkill and decrease readability.


### Example

```ts
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
