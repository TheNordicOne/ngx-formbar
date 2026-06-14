The checkbox control renders a single boolean `input`.

{{ NgDocActions.demo("CheckboxExampleComponent", { container: false }) }}

Configure it in your form like this:

```typescript name="form config"
agree: {
  type: 'checkbox',
  label: 'Power loss present',
}
```

Implementation:

```typescript group="checkbox-source" name="checkbox-control.component.ts" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/checkbox/checkbox-control.component.ts"
```

```html group="checkbox-source" name="checkbox-control.component.html" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/checkbox/checkbox-control.component.html"
```

```scss group="checkbox-source" name="checkbox-control.component.scss" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/checkbox/checkbox-control.component.scss"
```
