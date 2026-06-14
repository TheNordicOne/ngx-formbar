The radio control renders a group of mutually exclusive options.

<docs-component-example>

{{ NgDocActions.demo("RadioExampleComponent", { container: false }) }}

</docs-component-example>

Implementation:

```typescript group="radio-source" name="radio-control.component.ts" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/radio/radio-control.component.ts"
```

```html group="radio-source" name="radio-control.component.html" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/radio/radio-control.component.html"
```

```scss group="radio-source" name="radio-control.component.scss" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/radio/radio-control.component.scss"
```

Configure it in your form like this:

```typescript name="form config"
urgency: {
  type: 'radio',
  label: 'Urgency',
  options: [
    { id: 'low', value: 'low', label: 'Low' },
    { id: 'high', value: 'high', label: 'High' },
  ],
}
```
