

This example extends the basic maintenance form with advanced features:

- **Computed values** — Fields whose values are derived from other fields (e.g., total cost, SLA deadline, priority score)
- **Function expressions** — `computedValue` using arrow functions for complex logic
- **Dynamic titles** — Group legends that change based on form state (e.g., `"Details — hvac"`)
- **Dynamic labels** — Control labels that adapt to context (e.g., `"Impact Score (required)"` when urgency is critical)
- **`updateOn`** — Per-control change detection strategy (`change`, `blur`)
- **`hideStrategy`** — Choose between `remove` (destroy control) and `keep` (preserve value)
- **`valueStrategy`** — Choose between `reset` (clear on hide) and `last` (keep last value)
- **`disabled` / `readonly` expressions** — Conditional interactivity based on other fields

## Key Highlights

### Computed Values with Functions

```typescript
totalCost: {
  type: 'text',
  readonly: true,
  computedValue: (v) => {
    const rate = Number(v.costs?.hourlyRate ?? 0);
    const hours = Number(v.costs?.laborHours ?? 0);
    const materials = Number(v.costs?.materialCosts ?? 0);
    return `${(rate * hours + materials).toFixed(2)} ${v.costs?.currency ?? 'EUR'}`;
  },
}
```

### Dynamic Titles with String Expressions

```typescript
details: {
  type: 'group',
  dynamicTitle: "'Issue Details' + (details && details.category ? ' — ' + details.category : '')",
  // ...
}
```

### Hide + Value Strategy

```typescript
assetOther: {
  type: 'text',
  hidden: 'details.affectedAsset !== "other"',
  hideStrategy: 'keep',    // keep the control in the form
  valueStrategy: 'last',   // preserve the last entered value
}
```

## Live Demo

{{ NgDocActions.demo("ComplexDemoComponent") }}

## Form Configuration Used

<details>
<summary>complex-maintenance-form.ts (click to expand)</summary>

```typescript file="./../../../app/examples/forms/complex-maintenance-form.ts"
```

</details>
