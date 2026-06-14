The text control renders a single-line `input` for free-form text.

{{ NgDocActions.demo("TextExampleComponent", { container: false }) }}

Configure it in your form like this:

```typescript name="form config"
fullName: {
  type: 'text',
  label: 'Full Name',
  placeHolder: 'e.g., Emma Frost',
}
```

Implementation:

```typescript group="text-source" name="text-control.component.ts" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/text/text-control.component.ts"
```

```html group="text-source" name="text-control.component.html" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/text/text-control.component.html"
```

```scss group="text-source" name="text-control.component.scss" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/text/text-control.component.scss"
```
