The date control renders a date `input` with optional min and max bounds.

{{ NgDocActions.demo("DateExampleComponent", { container: false }) }}

Configure it in your form like this:

```typescript name="form config"
preferredDate: {
  type: 'date',
  label: 'Preferred Date',
  minDate: '1900-01-01',
  maxDate: '2026-12-31',
}
```

Implementation:

```typescript group="date-source" name="date-control.component.ts" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/date/date-control.component.ts"
```

```html group="date-source" name="date-control.component.html" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/date/date-control.component.html"
```

```scss group="date-source" name="date-control.component.scss" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/date/date-control.component.scss"
```
