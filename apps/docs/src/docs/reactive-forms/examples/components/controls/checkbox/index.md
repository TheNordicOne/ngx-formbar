The checkbox control renders a single boolean `input`.

<docs-component-example>

{{ NgDocActions.demo("CheckboxExampleComponent", { container: false }) }}

</docs-component-example>

Implementation:

```typescript group="checkbox-source" name="checkbox-control.component.ts" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/checkbox/checkbox-control.component.ts"

```

```html group="checkbox-source" name="checkbox-control.component.html" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/checkbox/checkbox-control.component.html"

```

```scss group="checkbox-source" name="checkbox-control.component.scss" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/checkbox/checkbox-control.component.scss"

```

Configure it in your form like this:

```typescript name="form config"
agree: {
  type: 'checkbox',
  label: 'Power loss present',
}
```
