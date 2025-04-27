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


