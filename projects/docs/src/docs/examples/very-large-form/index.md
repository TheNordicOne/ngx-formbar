

This example showcases performance with large forms and cascading computations.
Switch between two forms to compare:

- **Large Maintenance** — A realistic form with many groups, conditional visibility,
  computed summaries, and cross-field validators
- **Highly Computed** — A stress-test form where nearly every field depends on others,
  creating deep cascading chains (L1 → L2 → L3 → ... → L8)

## Highly Computed Form Highlights

### Deep Cascade Chains

```typescript
chain: {
  type: 'group',
  controls: {
    l1: { computedValue: '`L1:${seed ?? ""}`' },
    l2: { computedValue: '`L2:${chain?.l1 ?? ""}`' },
    l3: { computedValue: '`L3:${chain?.l2 ?? ""}`' },
    // ...continues to L8
  }
}
```

Changing the `seed` field triggers a cascade through all dependent fields.

### Cross-Group Fan-Out

Multiple fields depend on the same source, and their results feed into
further computations — testing the expression engine's ability to handle
diamond-shaped dependency graphs.

### State Matrix

Fields with mixed `hidden`, `disabled`, and `readonly` expressions
driven by the `mode` field — testing interaction between visibility
and interactivity states.

## Live Demo

{{ NgDocActions.demo("VeryLargeFormDemoComponent") }}

## Form Configurations Used

<details>
<summary>maintenance-form-large.ts (click to expand)</summary>

```typescript file="./../../../app/examples/forms/maintenance-form-large.ts"
```

</details>

<details>
<summary>highly-computed-form.ts (click to expand)</summary>

```typescript file="./../../../app/examples/forms/highly-computed-form.ts"
```

</details>
