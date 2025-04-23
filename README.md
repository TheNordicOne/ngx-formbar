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

## Feature Overview

- All form configurations are fully compatible with JSON 
  - Configurations can easily be stored in a database
- Create your own form controls
  - No extra packages for rendering with UI Library X or CSS Framework Y
  - Controls are fully typed
  - Add whatever options you need for your controls
- Automatic e2e-Id generation
- Hide controls based on an expression and the form state
  - Decide how the value of hidden controls behave (keep last, reset, default)
- Disable controls based on an expression and the form state or set it statically
- Compute a controls readonly based on an expression and the form state or set it statically
- Mark a control as required or add other validators
- Combine commonly used validator combinations into a single key
- Expression syntax is like JavaScript
  - Expressions only run against the form value


### Open Feature Ideas

The following are some ideas that are interesting. There is no guarantee that they will be implemented. Let me know if you feel like one of those ideas can be very useful.

- Configure how the e2e-Id looks like
- Configure the attribute name used for the e2e-Id
- Schematics for quickly scaffolding a new compatible control
- UI for creating valid configurations in JSON
- Support for non-control blocks (e.g. info texts, terms and conditions)
- Derived values for readonly or hidden controls
- Support for full TypeScript only definition (meaning an expression could also be written with an arrow function)
- Use expressions for dynamic labels


## Usage notes

A few things to know about when using _ngx-formwork_

- The `readonly` property itself only provides you with the (dynamic) value. How and if this is handled has to be implemented in the component
- Sometimes when writing a form configuration, TS will throw errors about properties not being compatible. If that happens double check precisely the property names. 
  - For example: A group can have a title property and a control a label. Adding a label property to a group will confuse TypeScript and it throws Errors about unrelated properties not matching.
- In some cases, when configuring a group in TS, it helps to cast the controls property like so `controls: <NgxFwContent[]>[...]` or `controls: <MyAppControls[]>[...]` if you use the `OneOf` type helper

## Getting started

Install _ngx-formwork_

```shell
npm i ngx-formwork
```

_ngx-formwork_ is provided and configured in _app.config.ts_.

```ts
export const appConfig: ApplicationConfig = {
  providers: [
    // other providers
    provideFormwork({
      componentRegistrations: {
        // Component registrations go here
      },
      
      // validatorRegistrations are optional
      validatorRegistrations: {
        // Validator registrations go here
        // Following Angular validators are registered by default
        // Validators.required
        // Validators.requiredTrue
        // Validators.email
        // Validators.nullValidator
      },
      
      // asyncValidatorRegistrations are optional
      asyncValidatorRegistrations: {
        // Async Validator registrations go here
      },
    })
  ]
};
```

To avoid bloating your config, put your registrations in a separate file

**Component Registrations**
```ts
export const componentRegistrations: ComponentRegistrationConfig = {
  // Component registrations go here
}
```

**Validator Registrations**
```ts
export const validatorRegistrations: ValidatorConfig<RegistrationRecord> = {
  // Validator registrations go here
}
```

**Async Validator Registrations**
```ts
export const asyncValidatorRegistrations: AsyncValidatorConfig<RegistrationRecord> = {
  // Async Validator registrations go here
}
```

**App Config**
```ts
provideFormwork({
  componentRegistrations,
  validatorRegistrations,
  asyncValidatorRegistrations
})
```

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

### Controls

Here is an example of a simple text control.

First create an interface for your control

```ts
export interface TestTextControl extends NgxFwControl {
  // Unique Key of your control that is used for differentiating controls
  // This can be descriptive like "email-control"
  type: 'test-text-control';

  // Overwrite defaultValue with correct value type
  // the default value type is "unknown"
  defaultValue?: string;

  // Additional options only applicable to this control
  hint?: string;
}
```

Then implement the component. See [Helper](#helper) for how to set up `controlContainerViewProviders` and `ngxfwControlHostDirective`.

> [!IMPORTANT]  
> Be sure to bind to `[formControlName]` on the actual input element

```ts
@Component({
  selector: 'app-test-text-control',
  imports: [ReactiveFormsModule],
  templateUrl: './test-text-control.component.html',
  // Important: You always need view providers
  viewProviders: controlContainerViewProviders,
  hostDirectives: [
    // Convenience declaration
    ngxfwControlHostDirective
  ],
})
export class TestTextControlComponent {
  // Inject the Directive to gain access to all public properties
  // Make sure to pass the correct type parameter to get proper type information
  private readonly control = inject(NgxfwControlDirective<TestTextControl>);

  // Extract all things you are interested
  // Explicitly setting a type definition is not required, but some IDEs work better if they are present
  readonly content: Signal<TestTextControl> = this.control.content; // The configuration object of the control instance
  readonly testId: Signal<string> = this.control.testId;
  readonly isHidden: Signal<unknown> = this.control.isHidden; // Really only should ever be a boolean return value, but an expression could also return a number, string or object
  readonly disabled: Signal<boolean> = this.control.disabled;

  // We get proper type information when accessing this.content()
  readonly hint = computed(() => this.content().hint);
  readonly label = computed(() => this.content().label);
  readonly id = computed(() => this.content().id);

  // Getter to easily get access to the underlying form control
  // Helpful to check for validation errors
  get formControl() {
    return this.control.formControl;
  }

  constructor() {
    // Optional
    // Set visibility handling to manual if you want handle it yourself
    // By default it is set to auto and will apply the "hidden" attribute if the control is hidden
    this.control.setVisibilityHandling('manual')
  }
}
```

```html
<!-- Just an example -->
<label [htmlFor]="id()" [attr.data-testId]="testId() + '-label'">
{{ label() }}</label>
<input
  [attr.data-testId]="testId() + '-input'"
  [id]="id()"
  [formControlName]="id()"
/>
```

Finally, register the control in _app.config.ts_

```ts
  componentRegistrations: 
    {
      'test-text-control': TestTextControlComponent
    }
```

### Groups


Here is an example of a simple group.

First create an interface for your group

```ts
  // Unique Key of your group that is used for differentiating groups
  // This can be descriptive like "email-control"
export interface TestGroup extends NgxFwFormGroup {
  type: 'test-group';

  // Additional options only applicable to this group if you want
}
```

Then implement the component. See [Helper](#helper) for how to set up `controlContainerViewProviders` and `ngxfwGroupHostDirective`.

> [!IMPORTANT]  
> Be sure to bind to `[formGroupName]` on an element (e.g. div, ng-container)


```ts
@Component({
  selector: 'ngxfw-test-group',
  imports: [NgxfwAbstractControlDirective, ReactiveFormsModule],
  templateUrl: './test-group.component.html',
  // Important: You always need view providers
  viewProviders: controlContainerViewProviders,
  // Convenience declaration
  hostDirectives: [ngxfwGroupHostDirective],
})
export class TestGroupComponent {
  // Inject the Directive to gain access to all public properties
  // Make sure to pass the correct type parameter to get proper type information
  private readonly control = inject(NgxfwGroupDirective<TestGroup>);

  // Extract all things you are interested
  // Explicitly setting a type definition is not required, but some IDEs work better if they are present
  readonly content: Signal<TestGroup> = this.control.content;  // The configuration object of the group instance
  readonly testId: Signal<string> = this.control.testId;
  readonly controls: Signal<NgxFwContent[]> = this.control.controls;
  readonly isHidden: Signal<unknown> = this.control.isHidden; // Really only should ever be a boolean return value, but an expression could also return a number, string or object

  // Getter to easily get access to the underlying form control
  // Helpful to check for validation errors
  get formGroup() {
    return this.control.formGroup;
  }

  constructor() {
    // Optional
    // Set visibility handling to manual if you want handle it yourself
    // By default it is set to auto and will apply the "hidden" attribute if the control is hidden
    this.control.setVisibilityHandling('manual');
  }
}
```

```html
<!-- Just an example -->
<div [formGroupName]="content().id">
  @for (control of controls(); track control.id) {
  <ng-template *ngxfwNgxfwAbstractControl="control" />
  }
</div>
```

Finally, register the group in _app.config.ts_

```ts
  componentRegistrations:
  {
    'test-group': TestGroupComponent
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

Once you've registered controls and optionally validators, you write a configuration for a form. You can either do this directly in json or in TypeScript, for better typing information.

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


