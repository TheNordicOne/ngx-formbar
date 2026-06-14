The textarea control renders a multi-line `textarea` for longer text.

<docs-component-example>

{{ NgDocActions.demo("TextareaExampleComponent", { container: false }) }}

</docs-component-example>

Implementation:

```typescript group="textarea-source" name="textarea-control.component.ts" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/textarea/textarea-control.component.ts"

```

```html group="textarea-source" name="textarea-control.component.html" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/textarea/textarea-control.component.html"

```

```scss group="textarea-source" name="textarea-control.component.scss" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/textarea/textarea-control.component.scss"

```

Configure it in your form like this:

```typescript name="form config"
description: {
  type: 'textarea',
  label: 'Description',
  placeHolder: 'Describe the issue',
  rows: 4,
  maxLength: 500,
}
```
