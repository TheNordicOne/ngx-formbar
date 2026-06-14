The file control renders a file `input` with an optional list of accepted types.

<docs-component-example>

{{ NgDocActions.demo("FileExampleComponent", { container: false }) }}

</docs-component-example>

Implementation:

```typescript group="file-source" name="file-control.component.ts" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/file/file-control.component.ts"
```

```html group="file-source" name="file-control.component.html" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/file/file-control.component.html"
```

```scss group="file-source" name="file-control.component.scss" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/file/file-control.component.scss"
```

Configure it in your form like this:

```typescript name="form config"
attachment: {
  type: 'file',
  label: 'Attachment',
  accept: ['.pdf', '.txt'],
}
```
