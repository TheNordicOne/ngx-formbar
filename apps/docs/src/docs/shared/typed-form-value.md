By default, `formValue` in expression functions is typed as `FormContext` (`Record<string, unknown>`) - access yields `unknown` and requires bracket access. Annotate the parameter with whatever type you already use for this data elsewhere (the same type you'd use when the form is submitted) to get dot access, nested fields, and wrong-type checks.

```typescript name="example.form.ts"
import { MaintenanceRequest } from './maintenance-request';

// Inside the form configuration:
{
  type: 'text',
  label: 'Confirmation E-Mail',
  hidden: (formValue: MaintenanceRequest) => !formValue.requester?.sendConfirmation,
  dynamicLabel: (formValue: MaintenanceRequest) =>
    `Send confirmation to ${formValue.requester?.contactName ?? 'requester'}`,
}
```

Use `Partial<MaintenanceRequest>` or `DeepPartial<MaintenanceRequest>` if the type's required fields don't match an in-progress form.
