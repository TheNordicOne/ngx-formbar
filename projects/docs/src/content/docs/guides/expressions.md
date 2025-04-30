---
title: Expressions
keyword: ExpressionsPage
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
