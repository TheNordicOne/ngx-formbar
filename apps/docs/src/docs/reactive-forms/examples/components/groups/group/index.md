The group control nests a set of child controls under a shared legend.

{{ NgDocActions.demo("GroupExampleComponent", { container: false }) }}

Configure it in your form like this:

```typescript name="form config"
address: {
  type: 'group',
  legend: 'Address',
  controls: {
    street: { type: 'text', label: 'Street' },
    city: { type: 'text', label: 'City' },
  },
}
```

Implementation:

```typescript group="group-source" name="group-control.component.ts" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/group/group-control.component.ts"
```

```html group="group-source" name="group-control.component.html" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/group/group-control.component.html"
```

```scss group="group-source" name="group-control.component.scss" file="../../../../../../../../../libs/examples/reactive-forms/src/lib/components/group/group-control.component.scss"
```
