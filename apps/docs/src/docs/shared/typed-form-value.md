By default, `formValue` in expression functions is typed as `FormContext` (`Record<string, unknown>`) - access yields `unknown` and requires bracket access. Annotate the parameter with whatever type you already use for this data elsewhere (the same type you'd use when the form is submitted) to get dot access, nested fields, and wrong-type checks.

```typescript name="example.form.ts"
import { Repository } from './repository';

// Inside the form configuration:
{
  type: 'email',
  label: 'E-Mail',
  hidden: (formValue: Repository) => !formValue.repo?.sendConfirmation,
  dynamicLabel: (formValue: Repository) =>
    `Send confirmation to ${formValue.repo?.username ?? 'user'}`,
}
```

Use `Partial<Repository>` or `DeepPartial<Repository>` if the type's required fields don't match an in-progress form.
