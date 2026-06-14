The note block renders a static message and holds no form value.

{{ NgDocActions.demo("NoteExampleComponent", { container: false }) }}

Configure it in your form like this:

```typescript name="form config"
infoNote: {
  type: 'note',
  isControl: false,
  severity: 'info',
  message: 'An informational note rendered as a block.',
}
```

Implementation:

```typescript group="note-source" name="note-control.component.ts" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/note/note-control.component.ts"
```

```html group="note-source" name="note-control.component.html" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/note/note-control.component.html"
```

```scss group="note-source" name="note-control.component.scss" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/note/note-control.component.scss"
```
