The array control repeats a row control so users can add and remove entries.

{{ NgDocActions.demo("ArrayExampleComponent", { container: false }) }}

Configure it in your form like this:

```typescript name="form config"
tags: {
  type: 'array',
  label: 'Tags',
  addLabel: 'Add tag',
  itemLabel: 'tag',
  emptyMessage: 'No tags yet.',
  rowControl: { type: 'text', label: 'Tag' },
}
```

Implementation:

```typescript group="array-source" name="array-control.component.ts" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/array/array-control.component.ts"
```

```html group="array-source" name="array-control.component.html" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/array/array-control.component.html"
```

```scss group="array-source" name="array-control.component.scss" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/array/array-control.component.scss"
```
