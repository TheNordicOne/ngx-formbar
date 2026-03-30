

Registering components and validators via Angular DI tokens — the most explicit, provider-based approach.

<details>
<summary>Form Configuration (click to expand)</summary>

```typescript file="./../../../../../../../libs/examples/src/lib/forms/maintenance-form.ts"
```

</details>

{{ NgDocActions.demo("TokenBasedDemoComponent") }}

## Concepts Used

- **Component registrations** — maps control types to components via `NGX_FW_COMPONENT_REGISTRATIONS` ([Formbar Configuration](/reactive-forms/guides/formbar-configuration))
- **Validator registrations** — maps validator keys to `ValidatorFn` arrays via `NGX_FW_VALIDATOR_REGISTRATIONS` ([Validation](/reactive-forms/guides/validation))
- **`provideFormbar()`** — bootstraps the library alongside manual token providers ([Formbar Configuration](/reactive-forms/guides/formbar-configuration))
