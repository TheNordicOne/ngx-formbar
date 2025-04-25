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


## How to set up

Registering controls and validators is easy and declarative. Below are examples for creation and registration.

_ngx-formwork_ comes with no pre-built components by design. This gives all flexibility of what framework to use and how to structure the markup. Furthermore, it uses the [Directive Composition API](https://angular.dev/guide/directives/directive-composition-api) instead of inheritance. While this may seem to make some things a little more verbose, it is the better approach to encapsulate the core logic.

### Helper

For an easier setup and maintenance of controls and groups, it is highly recommended to set up the following helpers. Using the helpers provides you with a singular place to edit, in case anything changes. The rest of the guide assumes that you did this. The exact naming of each helper really is up to you.

#### Control Container View Providers

`ControlContainer` is required for all controls and groups that will be used within _ngx-formwork_. To avoid repetition, set up and use this helper. Injection the control container allows the components to use reactive forms stuff, without needing to pass the form group through inputs and wrapping the template into additional tags. See this YouTube Video for more detailed explanation: [How to Make Forms in Angular REUSABLE (Advanced, 2023)](https://www.youtube.com/watch?v=o74WSoJxGPI)

```ts
export const controlContainerViewProviders = [
  {
    provide: ControlContainer,
    useFactory: () => inject(ControlContainer, { skipSelf: true }),
  },
];
```

#### Control Host Directive

This is a convenience helper to apply the `NgxfwControlDirective`.
```ts
export const ngxfwControlHostDirective = {
  directive: NgxfwControlDirective,
  inputs: ['content'],
};
```

####  Group Host Directive
This is a convenience helper to apply the `NgxfwGroupDirective`.
```ts
export const ngxfwGroupHostDirective = {
  directive: NgxfwGroupDirective,
  inputs: ['content'],
};
```

#### Showing Errors (Control)

Showing errors works pretty much the same as always. You get access to the form control and then access `hasError`.

In TypeScript set up a getter
```ts
// inject the instance of the directive
private readonly control = inject(NgxfwControlDirective<TestTextControl>);

// Get access to the underlying form control
get formControl() {
  return this.control.formControl;
}
```

Then, in your template you can do something like this

```html
@if (formControl?.hasError('required')) {
  <span>Required</span>
}
```


#### Showing Errors (Group)

Showing errors works pretty much the same as always. You get access to the form control and then access `hasError`.

In TypeScript set up a getter
```ts
// inject the instance of the directive
private readonly control = inject(NgxfwGroupDirective<TestGroup>);

// Get access to the underlying form group
get formGroup() {
  return this.control.formGroup;
}
```

Then, in your template you can do something like this
```html
@if (formGroup?.hasError('duplicates')) {
  <span>No duplicate values</span>
}
```


### Validation

It is possible to create custom validators and combine them. 

> [!IMPORTANT]  
> You can not combine synchronous validators with async ones!
> Angular itself differentiates between those, so we aim to be consistent with it 

#### Default Validators

For convenience some static validators, that are built into Angular, are registered by default. Built-in functions that return a validator, like `Validators.minLength` cannot be provided by default, as they require an argument.

The following validators are registered by default:
- Validators.required 
- Validators.requiredTrue 
- Validators.email 
- Validators.nullValidator

#### Adding custom validator

_ngx-formwork_ uses the standard Angular validator functions. That means that writing your own is exactly the same as in Angular itself. Checkout ["Defining a custom validator" on the official docs](https://angular.dev/guide/forms/form-validation#defining-custom-validators).

This example uses a forbidden letter validator, that ensure the letter "A" is not used.

```ts
export function forbiddenLetterAValidator(
  control: AbstractControl<unknown>,
): ValidationErrors | null {
  const value = control.value;
  if (!value) {
    return null;
  }
  if (typeof value !== 'object') {
    const includesA = containsText(value, 'a');
    return includesA ? { forbiddenLetterA: { value } } : null;
  }

  const values = Object.values(value);
  const someValueIncludesA = values.some((v) => containsText(v, 'a'));
  return someValueIncludesA ? { forbiddenLetterA: { value } } : null;
}
```

You can then register this validator under any name you want.
```ts
validatorRegistrations: {
  'forbidden-letter-a': [forbiddenLetterAValidator]
}
```

#### Adding custom async validator

Async validators work pretty much the same as synchronous ones.

This example uses a validator, that ensure the text contains the word "async".

> [!NOTE]  
> Async validators usually do some checks on the server.
> For this example we only pretend to do so by creating a dummy observable

```ts
export function asyncValidator(
  control: AbstractControl<string | undefined | null>,
): Observable<ValidationErrors | null> {
  const value = control.value;
  if (containsText(value, 'async')) {
    return of(null);
  }
  return of({ async: { value } });
}

```

You can then register this validator under any name you want
```ts
asyncValidatorRegistrations: {
  async: [asyncValidator]
}
```

#### Validators with arguments

Functions that return validators based on arguments can be registered as well.

```ts
validatorRegistrations: {
  'min-chars': [Validators.minLength(3)]
}
```

#### Combining Validators

Combining validators is as easy as adding them in the same array.

```ts
validatorRegistrations: {
  'min-chars': [Validators.minLength(3)],
  letter: [letterValidator],
  combined: ['min-chars', Validators.required, 'letter'],
}
```

## Configuring a form

Once you've registered controls and optionally validators, you write a configuration for a form. You can either do this directly in JSON or in TypeScript, for better typing information.

This example is written in TypeScript 
```ts
import { NgxFwContent } from '../../lib';

export const exampleForm: NgxFwContent[] = [
  // Simple fields with no additional configuration
  {
    type: 'text',
    id: 'name',
    label: 'First and Lastname',
  },
  {
    type: 'text',
    id: 'company',
    label: 'Name of Company',
    hint: 'If applicable',
  },
  {
    type: 'numeric',
    id: 'licenses',
    label: 'Amount of Licenses',
    max: 3,
  },
  // Example how a configuration for a radio button group could look like
  {
    type: 'radio',
    id: 'plan',
    label: 'Price Plan',
    options: [
      {
        id: 'plan-123',
        label: 'Free',
        value: 'p123',
      },
      {
        id: 'plan-456',
        label: 'Medium',
        value: 'p456',
      },
      {
        id: 'plan-789',
        label: 'Large',
        value: 'p789',
      },
    ],
  },
  {
    type: 'checkbox',
    id: 'termsAccepted',
    label: 'I Accept Terms',
  },
  {
    type: 'group',
    id: 'repo',
    controls: [
      {
        type: 'text',
        id: 'username',
        label: 'Username',
        default: 'UsernameSuggestion123',
        validators: ['min5Characters'],
        asyncValidators: ['usernameIsFreeValidator'],
      },
      {
        type: 'numeric',
        id: 'repositories',
        label: 'Repositories to create',
        default: 1,
      },
      // Example how a configuration for a dropdown could look like
      {
        type: 'dropdown',
        id: 'repoTemplate',
        label: 'Template',
        default: 'none',
        options: [
          {
            id: 'template-1',
            label: 'None',
            value: 'none',
          },
          {
            id: 'template-2',
            label: 'Monorepo',
            value: 'mono',
          },
          {
            id: 'template-3',
            label: 'Documentation',
            value: 'doc',
          },
          {
            id: 'template-3',
            label: 'Note Management',
            value: 'note',
          },
        ],
      },
      {
        type: 'checkbox',
        id: 'sendConfirmation',
        label: 'Send confirmation mail',
        default: true,
      },
      {
        type: 'email',
        id: 'confirmationMailTarget',
        label: 'E-Mail',
        hidden: '!repo.sendConfirmation',
        hideStrategy: 'remove',
        valueStrategy: 'reset',
      },
      {
        type: 'checkbox',
        id: 'editProjectId',
        label: 'Edit Project ID',
        default: false,
      },
      {
        type: 'text',
        id: 'projectId',
        label: 'Project ID',
        default: '123456789',
        hidden: '!repo.editProjectId',
        hideStrategy: 'keep',
        valueStrategy: 'reset',
      },
    ],
  },
  {
    type: 'group',
    id: 'docs',
    controls: [
      {
        type: 'numeric',
        id: 'docAmount',
        label: 'Documents to store',
      },
      {
        type: 'checkbox',
        id: 'acceptedLimits',
        label: 'I accept the limits for large volumes of documents',
        hidden: 'docs.docAmount > 1000',
      },
      {
        type: 'dropdown',
        id: 'updateFrequency',
        label: 'Documentation Update Frequency',
        options: [
          {
            id: 'on-the-fly',
            label: 'On the fly',
            value: 'otf',
          },
          {
            id: 'sprint',
            label: 'Sprint',
            value: 'spr',
          },
          {
            id: 'cycle',
            label: 'Cycle',
            value: 'cyc',
          },
          {
            id: 'planned',
            label: 'Planned',
            value: 'pla',
          },
        ],
      },
      {
        type: 'numeric',
        id: 'frequency',
        label: 'Frequency (Sprint / Cycle Duration)',
        hidden: 'docs.docAmount > 2000 && (docs.updateFrequency === "spr" || docs.updateFrequency === "cyc")',
        hideStrategy: 'remove',
        valueStrategy: 'last',
      },
    ],
  },
];

```

As you can see the configuration is just an array of controls and/or groups. Every item in that array will be registered on the top-level of the form.


### Create helper type

For better type safety, when writing a form configuration in TypeScript, _ngx-formwork_ provides a helper type *OneOf*.
With this you can construct a union type like this.

```ts
export type MyAppControls = OneOf<[TestTextControl, TestGroup]>;
```
and use it like this
```ts
export const exampleForm: MyAppControls[] = [ ... ]
```

### Basic Options

The `NgxFwBaseContent` interface is the foundation for all form controls and groups. It defines a common set of options that control registration, validation, visibility, and behavior of the form elements.

- **type** (`string`)
  - Specifies the kind of the form control. It determines what control is used and what additional properties may be available.

- **id** (`string`)
  - Unique identifier for the control. This is used to link configuration with runtime behavior and maintain state consistency.

- **validators** (`string[]` - optional)
  - An array of strings representing the names of synchronous validators that apply to the control.
  - Validators can be registered globally with a validator registration object. (see [Adding Custom Validators](#adding-custom-validator))

- **asyncValidators** (`string[]` - optional)
  - Similar to `validators`, but for asynchronous validation logic. (see [Adding Custom Async Validators](#adding-custom-async-validator))

- **hidden** (`string` - optional)
  - A string expression that determines when the control should be hidden.
  - This condition is evaluated at runtime to control the visibility of the control.
  - The expression is evaluated against the whole form object.

- **hideStrategy** (`'keep'` \| `'remove'` - optional)
  - Specifies the strategy for handling the control when the `hidden` expression evaluates to true.
    - `keep`: The control remains part of the form model (its value and state are retained), despite being hidden.
    - `remove`: The control is removed from the form model. This is useful when a hidden value should not be submitted or processed further.

- **valueStrategy** (`'last'` \| `'default'` \| `'reset'` - optional)
  - Determines how the control’s value is handled when its visibility changes.
    - `last`: Preserves the last entered value when the control is hidden and shown again.
    - `default`: Reverts the control to its default value upon re-display.
    - `reset`: Clears the control's value when it becomes visible.

- **disabled** (`string` \| `boolean` - optional)
  - Defines whether the control should be disabled.
  - Can be a boolean value or a string expression that resolves to a boolean at runtime.
  - The expression is evaluated against the whole form object.

- **readonly** (`string` \| `boolean` - optional)
  - Indicates if the control is read-only, meaning the value is displayed but cannot be modified.
  - Accepts either a boolean value or a string expression for dynamic evaluation.
  - The expression is evaluated against the whole form object.

- **updateOn** (`'change'` \| `'blur'` \| `'submit'` \| `undefined` - optional)
  - Specifies the event that triggers an update to the control’s value.
    - `change`: Updates the value as the user types (default behavior).
    - `blur`: Updates the value when the control loses focus.
    - `submit`: Defers the update until the form is submitted.
  - If not specified, the default is typically `change`.


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


