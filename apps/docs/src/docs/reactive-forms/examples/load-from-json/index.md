

Loading a form configuration at runtime from a JSON file via `HttpClient`, useful for server-driven forms, multi-tenant apps, and A/B testing.

<details>
<summary>Form Configuration (click to expand)</summary>

```json file="./../../../../../public/examples/maintenanceForm.json"
```

</details>

{{ NgDocActions.demo("LoadFromJsonDemoComponent") }}

## Concepts Used

- **String expressions**: JSON can't contain functions, so all computed values and visibility rules use string expressions instead ([Expressions](/fundamentals/expressions))
- **`NgxfbFormComponent`**: renders the form from the loaded config using `[formConfig]` binding ([Showing a Form](/reactive-forms/guides/showing-a-form))
- **Configuring a form**: the JSON structure mirrors the TypeScript form config, with groups and controls ([Configuring a Form](/fundamentals/configuration))
