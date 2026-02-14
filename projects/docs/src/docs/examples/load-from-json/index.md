

This example demonstrates loading the form configuration at runtime from a JSON file
via `HttpClient`, rather than importing it statically from TypeScript.

## How It Works

The form configuration is stored as a JSON file (e.g., `maintenanceForm.json`) and
fetched asynchronously. Since JSON cannot contain functions, this approach works best
with forms that use **string expressions** for computed values, visibility, and
validators.

{% raw %}

```typescript group="load-from-json" name="load-from-json.component.ts" icon="angular"
@Component({
  selector: 'app-load-from-json',
  imports: [NgxfbFormComponent, ReactiveFormsModule],
  templateUrl: './load-from-json.component.html',
})
export class LoadFromJsonComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly httpClient = inject(HttpClient);

  form = this.formBuilder.group({});

  readonly formContent = toSignal(
    this.httpClient.get<NgxFbForm<FormControls>>('/examples/maintenanceForm.json'),
  );
}
```

```html group="load-from-json" name="load-from-json.component.html"
@let formConfig = formContent();
@if (formConfig) {
  <form [formGroup]="form">
    <ngxfb-form [formConfig]="formConfig" />
  </form>
} @else {
  <p>Loading form configuration...</p>
}
```

{% endraw %}

## When to Use This

- **Server-driven forms** — Form structure defined in a CMS or backend
- **Multi-tenant apps** — Different form configurations per tenant
- **A/B testing** — Swap form layouts without redeploying

## Limitations

JSON cannot represent JavaScript functions, so `computedValue` as a function
won't work. Use **string expressions** instead:

```json
{
  "computedValue": "seed",
  "hidden": "details.category !== 'hvac'",
  "dynamicLabel": "'Impact Score' + (details.urgency === 'critical' ? ' (required)' : '')"
}
```

## Live Demo

{{ NgDocActions.demo("LoadFromJsonDemoComponent") }}

## Form Configuration Used

<details>
<summary>maintenanceForm.json (click to expand)</summary>

```json file="./../../../../public/examples/maintenanceForm.json"
```

</details>
