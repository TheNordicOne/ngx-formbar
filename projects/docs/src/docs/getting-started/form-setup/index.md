## Preparation

Before you go render a form, you must have at least one control set up and registered.

Detailed instructions for how to create and register controls, groups and blocks can be found in the Guides section.

- Controls
- Groups
- Blocks

In addition to controls you can also optionally configure validators. See the Validation page for detailed instructions.

## Configuring a form

Once you've registered controls and optionally validators, you write a configuration for a form. You can either do this directly in JSON or in TypeScript, for better typing information.

This example is written in TypeScript

```ts
// example.form.ts
export const exampleForm: NgxFbForm = {
  content: {
    name: {
      type: 'text',
      label: 'First and Lastname',
    },
    company: {
      type: 'text',
      label: 'Name of Company',
      hint: 'If applicable',
    },
    repo: {
      type: 'group',
      controls: {
        username: {
          type: 'text',
          label: 'Username',
          default: 'UsernameSuggestion123',
        },
      },
    },
  },
};
```

As you can see the configuration is just an array of controls and/or groups/blocks. Every item in that array will be registered on the top-level of the form. Items within the `controls` property of a group will be registered within that group.

This is just simple example. For more details go to the Configuration guide.

## Showing a form

You build the form as usual. This gives you full access to the underlying form object, and you can do everything you normally can.

```ts
// some-feature.component.ts
@Component({
  selector: 'app-some-form',
  imports: [ReactiveFormsModule, NgxfbFormComponent],
  templateUrl: './form-integration-host.component.html'
})
export class FormIntegrationHostComponent {
  // Construct the reactive form as usual
  private readonly formBuilder = inject(FormBuilder);

  // This is our form configuration. It doesn't have to be passed as an input. You could also have a service that gets this or just import it from a file.
  readonly formContent = input.required<NgxFbContent[]>();

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
<!-- some-feature.component.html -->
<!-- Just normal form binding -->
<form [formGroup]="form" (ngSubmit)="onSubmit()">

  <!-- This component renders your form  -->
  <ngxfb-form [formConfig]="formContent()" />

  <!-- normal submit button -->
  <button type="submit">Submit</button>
</form>

<button type="button" (click)="reset()">Reset</button>
```
