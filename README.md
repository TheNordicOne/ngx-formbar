# Formwork

![NPM Version](https://img.shields.io/npm/v/ngx-formwork?logo=npm&label=NPM%20Version)
![NPM Downloads](https://img.shields.io/npm/dw/ngx-formwork?label=Downloads)

[![Test and Lint](https://github.com/TheNordicOne/ngx-formwork/actions/workflows/lint-and-test.yml/badge.svg?branch=main)](https://github.com/TheNordicOne/ngx-formwork/actions/workflows/lint-and-test.yml)


A highly flexible framework for generating declarative reactive forms, based on a configuration.

This package provides a framework for creating Angular Reactive Forms, based on a configuration. This configuration can come from a server in the form of JSON or directly from an object written in TypeScript. It is as close to Angular as possible, to give you the most flexibility, while still taking care of the heavy lifting. 

## Current State

> [!WARNING]
> This project is still in the making and not ready to be used in production!

## Compatibility

At this time this package is only compatible with Angular 19.2.1 or above.

## Expressions

This documentation explains how expressions are parsed, evaluated, and what features are supported.

### Overview

Expressions are JavaScript snippets provided as strings. They are parsed into an Abstract Syntax Tree (AST) using the Acorn parser. The AST is then evaluated in a controlled environment against the forms value (onValueChange).

### Parsing and Caching

- **Parsing:**  
  An expression string is parsed to generate an AST. The parser uses a modern ECMAScript version (2022) to support recent JavaScript syntax.

- **Caching:**  
  Parsed ASTs are cached to avoid re-parsing the same expression multiple times. This improves performance when evaluating expressions repeatedly.

### Evaluation Process

1. **Supported Node Types:**
   - The evaluator supports a range of node types including:
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

2. **Evaluation of Operators:**
  - **Arithmetic Operators:** `+`, `-`, `*`, `/`, `%`, `**`
  - **Comparison Operators:** `<`, `>`, `<=`, `>=`
  - **Equality Operators:** `==`, `!=`, `===`, `!==` (follow JavaScript behavior)
  - **Bitwise Operators:** `|`, `&`, `^`, `<<`, `>>`, `>>>`
  - **Logical Operations:** `&&`, `||`, `??`
  - **Safe Method Calls:** When calling methods on objects, the evaluator checks against a whitelist of safe methods (provided for strings, numbers, booleans, and arrays). This ensures that only approved operations are executed.

### Limitations

- **Restricted Syntax:**  
  Complex function bodies or block statements in arrow functions are not supported. Only simple expression-based arrow functions are allowed.

- **Restricted Node Types:**  
  Some JavaScript features are not supported to maintain security and simplicity, such as update expressions, assignments, and using `this` or `super`.

- **Controlled Context:**  
  The evaluation runs only in the context of the form object, avoiding global access and potential security vulnerabilities.


## Rendering a form

Now that everything is set up, you can now render the form.

You build the form as usual. This gives you full access to the underlying form, and you can do everything you normally can too.

```ts
@Component({
  selector: 'app-some-form',
  imports: [ReactiveFormsModule, NgxFwFormComponent],
  templateUrl: './form-integration-host.component.html'
})
export class FormIntegrationHostComponent {
  // Construct the reactive form as usual
  private readonly formBuilder = inject(FormBuilder);
  
  // This is our form configuration. It doesn't have to be passed as an input. You could also have a service that gets this or just import it from a file.
  readonly formContent = input.required<NgxFwContent[]>();
  
  // Building a form with an empty group. All controls and groups are self-registering
  // You can also add additional hardcoded control if you want
  form = this.formBuilder.group({});

  // We have normal access to all properties of the form
  reset() {
    this.form.reset();
  }

  patchValue() {
    // Setting the value of the form is done the same way as you normally would
    this.form.patchValue({
    //  Whatever value we want to patch
    });
  }
}
```

```html
<!-- Just normal form binding -->
<form [formGroup]="form" (ngSubmit)="onSubmit()">
  
  <!-- This component renders your form  -->
  <ngxfw-form [formContent]="formContent()" />
  
  <!-- normal submit button -->
  <button type="submit">Submit</button>
</form>

<button type="button" (click)="reset()">Reset</button>
```


