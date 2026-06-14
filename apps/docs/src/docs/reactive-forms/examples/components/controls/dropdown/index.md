The dropdown control renders a `select` from a configured list of options.

<docs-component-example>

{{ NgDocActions.demo("DropdownExampleComponent", { container: false }) }}

</docs-component-example>

Implementation:

```typescript group="dropdown-source" name="dropdown-control.component.ts" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/dropdown/dropdown-control.component.ts"

```

```html group="dropdown-source" name="dropdown-control.component.html" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/dropdown/dropdown-control.component.html"

```

```scss group="dropdown-source" name="dropdown-control.component.scss" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/dropdown/dropdown-control.component.scss"

```

Configure it in your form like this:

```typescript name="form config"
country: {
  type: 'dropdown',
  label: 'Country',
  options: [
    { id: 'us', value: 'us', label: 'United States' },
    { id: 'uk', value: 'uk', label: 'United Kingdom' },
    { id: 'de', value: 'de', label: 'Germany' },
  ],
}
```
