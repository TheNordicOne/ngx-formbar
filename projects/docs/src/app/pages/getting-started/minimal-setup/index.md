---
keyword: MinimalSetupPage
---

To get started quickly follow this minimal setup.
> **Note**
> Checkout `Optimization` to see how to set up helpers.


_ngx-formwork_ comes with **no** pre-built components by design. This gives you flexibility of what framework to use and how to structure the markup. Furthermore, it uses the [Directive Composition API](https://angular.dev/guide/directives/directive-composition-api) instead of inheritance. While this may seem to make some things a little more verbose, it is the better approach to encapsulate the core logic.


## Controls

Here is an example of a simple text control.

First create an interface for your control.

```ts name="test-text-control.type.ts"
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

Then implement the component.

```ts name="test-text-control.component.ts"
@Component({
  selector: 'app-test-text-control',
  imports: [ReactiveFormsModule],
  templateUrl: './test-text-control.component.html',
  viewProviders: [
    {
      provide: ControlContainer,
      useFactory: () => inject(ControlContainer, { skipSelf: true }),
    }
  ],
  hostDirectives: [
    {
      directive: NgxfwGroupDirective,
      inputs: ['content'],
    }
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

> **Warning** Be sure to bind to `[formControlName]` on the actual input element

```html name="test-text-control.component.html"
{% raw %}<!-- Just an example -->
<label [htmlFor]="id()" [attr.data-testId]="testId() + '-label'">{{ label() }}</label>
<input
  [attr.data-testId]="testId() + '-input'"
  [id]="id()"
  [formControlName]="id()"
/>{% endraw %}
```

Finally, register the control in _app.config.ts_

```ts name="app.config.ts"
componentRegistrations: {
  text: TestTextControlComponent
}
```

## Groups

Here is an example of a simple group. Most likely you will only set up one or two group components, if at all.

First create an interface for your group.

```ts name="test-group.type.ts"
export interface TestGroup extends NgxFwFormGroup {
  // Unique Key of your group that is used for differentiating groups
  type: 'test-group';

  // Additional options only applicable to this group if you want
}
```

Then implement the component.

> **Warning** Be sure to bind to `[formGroupName]` on an element (e.g. div, ng-container)

```ts name="test-group.component.ts"
@Component({
  selector: 'ngxfw-test-group',
  imports: [NgxfwAbstractControlDirective, ReactiveFormsModule],
  templateUrl: './test-group.component.html',
  viewProviders: [
    {
      provide: ControlContainer,
      useFactory: () => inject(ControlContainer, { skipSelf: true }),
    },
  ],
  hostDirectives: [
    {
      directive: NgxfwGroupDirective,
      inputs: ['content'],
    }
  ],
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

```html name="test-group.component.html"
{% raw %}<!-- Just an example -->
<div [formGroupName]="content().id">
@for (control of controls(); track control.id) {
  <ng-template *ngxfwNgxfwAbstractControl="control" />
}
</div>{% endraw %}
```

Finally, register the group in _app.config.ts_

```ts
componentRegistrations: {
    group: TestGroupComponent
  }
```

## Configuring a form

Once you've registered controls and optionally validators, you write a configuration for a form. You can either do this directly in JSON or in TypeScript, for better typing information.

This example is written in TypeScript
```ts name="example.form.ts"
export const exampleForm: NgxFwContent[] = [
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
    type: 'group',
    id: 'repo',
    controls: [
      {
        type: 'text',
        id: 'username',
        label: 'Username',
        default: 'UsernameSuggestion123',
      },
    ],
  },
];
```

As you can see the configuration is just an array of controls and/or groups. Every item in that array will be registered on the top-level of the form.

## Rendering a form

Now that everything is set up, you can render the form.

You build the form as usual. This gives you full access to the underlying form, and you can do everything you normally can too.

```ts name="example-form.component.ts"
@Component({
  selector: 'app-example-form',
  imports: [ReactiveFormsModule, NgxFwFormComponent],
  templateUrl: './example-form.component.html'
})
export class ExampleFormComponent {
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

```html name="example-form.component.ts"
{% raw %}<!-- Just normal form binding -->
<form [formGroup]="form" (ngSubmit)="onSubmit()">
  
  <!-- This component renders your form  -->
  <ngxfw-form [formContent]="formContent()" />
  
  <!-- normal submit button -->
  <button type="submit">Submit</button>
</form>

<button type="button" (click)="reset()">Reset</button>{% endraw %}
```
