

Registering components, validators, and async validators through a single `defineFormbarConfig()` object — the recommended, type-safe approach.

<details>
<summary>Form Configuration (click to expand)</summary>

```typescript file="./../../../app/examples/forms/maintenance-form.ts"
```

</details>

{{ NgDocActions.demo("ConfigBasedDemoComponent") }}

## Concepts Used

- **`defineFormbarConfig()`** — consolidates all registrations into a single config object ([Formbar Configuration](/guides/formbar-configuration))
- **Component registrations** — maps control types to components as a plain object instead of a `Map` ([Formbar Configuration](/guides/formbar-configuration))
- **Validator registrations** — registers validators and async validators with type-safe config ([Validation](/guides/validation))
