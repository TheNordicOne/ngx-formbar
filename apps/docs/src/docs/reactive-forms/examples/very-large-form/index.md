

Performance testing with large forms and cascading computations: switch between a realistic large form and a stress-test with deep dependency chains.

<details>
<summary>Large Maintenance Form Configuration (click to expand)</summary>

```typescript file="./../../../../../../../libs/examples/src/lib/forms/maintenance-form-large.ts"
```

</details>

<details>
<summary>Highly Computed Form Configuration (click to expand)</summary>

```typescript file="./../../../../../../../libs/examples/src/lib/forms/highly-computed-form.ts"
```

</details>

{{ NgDocActions.demo("VeryLargeFormDemoComponent") }}

## Concepts Used

- **Deep cascade chains**: changing the `seed` field triggers a chain of 8 dependent computed values (L1 → L2 → ... → L8) ([Expressions](/fundamentals/expressions))
- **Cross-group fan-out**: multiple fields depend on the same source, creating diamond-shaped dependency graphs ([Expressions](/fundamentals/expressions))
- **State matrix**: fields use mixed `hidden`, `disabled`, and `readonly` expressions driven by a single `mode` field ([Controls](/reactive-forms/guides/controls))
- **Cross-field validators**: validators that span multiple controls and groups ([Validation](/reactive-forms/guides/validation))
