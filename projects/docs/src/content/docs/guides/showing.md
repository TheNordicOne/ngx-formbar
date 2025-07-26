---
title: Showing a form
keyword: ShowingPage
sidebar:
  order: 4
---

You build the form as usual. This gives you full access to the underlying form object, and you can do everything you normally can.

```ts title="some-feature.component.ts" group="component"
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

```html title="some-feature.component.html" group="component"
<!-- Just normal form binding -->
<form [formGroup]="form" (ngSubmit)="onSubmit()">
   
  <!-- This component renders your form  -->
  <ngxfw-form [formConfig]="formContent()" />
  
  <!-- normal submit button -->
  <button type="submit">Submit</button>
</form>

<button type="button" (click)="reset()">Reset</button>
```
