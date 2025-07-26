Here is an example of a simple text control.

First create an interface for your control.

```ts title="text-control.type.ts"
export interface TextControl extends NgxFwControl {
  // Unique Key of your control that is used for differentiating controls
  // This can be descriptive like "email-control"
  type: 'text-control';

  // Overwrite defaultValue with correct value type
  // the default value type is "unknown"
  defaultValue?: string;

  // Additional options only applicable to this control
  hint?: string;
}
```

Then implement the component.

:::caution
Be sure to bind to `[formControlName]` on the actual input element
:::


```ts title="text-control.component.ts" group="minimal"
@Component({
  selector: 'app-text-control',
  imports: [ReactiveFormsModule],
  templateUrl: './text-control.component.html',
  viewProviders: [
    {
      provide: ControlContainer,
      useFactory: () => inject(ControlContainer, { skipSelf: true }),
    }
  ],
  hostDirectives: [
    {
      directive: NgxfwControlDirective,
      inputs: ['content', 'name'],
    }
  ],
})
export class TextControlComponent {
  // Inject the Directive to gain access to all public properties
  // Make sure to pass the correct type parameter to get proper type information
  private readonly control = inject(NgxfwControlDirective<TextControl>);
  
  // Explicitly setting a type definition is not required, but some IDEs work better if they are present
  readonly content: Signal<TextControl> = this.control.content; // The configuration object of the control instance
  
  // We get proper type information when accessing this.content()
  readonly hint = computed(() => this.content().hint);
  readonly label = computed(() => this.content().label);
  readonly name: Signal<string> = this.control.name;
}
```

```html title="text-control.component.html" group="minimal"
<!-- Just an example -->
<label [htmlFor]="name()">{{ label() }}</label>
<input
  [id]="name()"
  [formControlName]="name()"
/>
<span>{{hint()}}</span>
```

Finally, register the control in _app.config.ts_

```ts title="app.config.ts"
export const appConfig: ApplicationConfig = {
  providers: [
    // other providers
    provideFormwork({
      componentRegistrations: {
        text: TextControlComponent
      }
    })
  ],
};
```
