

Swapping components at runtime using a custom `ComponentResolver` — the urgency control switches between radio buttons and a dropdown.

<details>
<summary>Form Configuration (click to expand)</summary>

```typescript file="./../../../../../examples/src/lib/forms/maintenance-form.ts"
```

</details>

{{ NgDocActions.demo("CustomResolverDemoComponent") }}

## Concepts Used

- **Custom `ComponentResolver`** — a `HybridComponentResolver` layers signal-based dynamic registrations on top of the defaults ([Custom Resolvers](/guides/custom-resolvers))
- **`useExisting` provider pattern** — ensures the same resolver instance is used whether injecting by token or by class ([Custom Resolvers](/guides/custom-resolvers))
- **Component registrations** — the default component map is extended at runtime to swap control types ([Formbar Configuration](/guides/formbar-configuration))
