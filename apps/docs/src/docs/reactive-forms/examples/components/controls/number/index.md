The number control renders a numeric `input` with optional min and max bounds.

<docs-component-example>

{{ NgDocActions.demo("NumberExampleComponent", { container: false }) }}

</docs-component-example>

Implementation:

```typescript group="number-source" name="number-control.component.ts" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/number/number-control.component.ts"

```

```html group="number-source" name="number-control.component.html" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/number/number-control.component.html"

```

```scss group="number-source" name="number-control.component.scss" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/number/number-control.component.scss"

```

Configure it in your form like this:

```typescript name="form config"
peopleAffected: {
  type: 'number',
  label: 'People Affected',
  min: 0,
  max: 5000,
}
```
