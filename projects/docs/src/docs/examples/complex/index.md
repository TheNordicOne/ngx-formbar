

Advanced form features including computed values, dynamic titles/labels, hide strategies, and conditional interactivity.

<details>
<summary>Form Configuration (click to expand)</summary>

```typescript file="./../../../../../examples/src/lib/forms/complex-maintenance-form.ts"
```

</details>

{{ NgDocActions.demo("ComplexDemoComponent") }}

## Concepts Used

- **Computed values** — total cost is derived from hourly rate, labor hours, and material costs using a function expression ([Expressions](/guides/expressions))
- **Dynamic titles** — group legends update to show the selected category, e.g. `"Issue Details — hvac"` ([Groups](/guides/groups))
- **Dynamic labels** — the impact score label appends `"(required)"` when urgency is critical ([Controls](/guides/controls))
- **`hideStrategy` / `valueStrategy`** — the "other asset" field stays in the form when hidden and preserves its last value ([Controls](/guides/controls))
- **`updateOn`** — per-control change detection set to `blur` for text inputs and `change` for selects ([Controls](/guides/controls))
- **`disabled` / `readonly` expressions** — fields become readonly or disabled based on other field values ([Expressions](/guides/expressions))
