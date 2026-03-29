The form configuration defines the structure and behavior of your form. It is the same regardless of which integration package you use. You can write it directly in JSON or in TypeScript for better typing information.

## Form

The `NgxFbForm<ContentType extends NgxFbBaseContent = NgxFbContent>` interface defines these properties.

| Name    | Type                          | Required | Description                                                                                             |
|---------|-------------------------------|----------|---------------------------------------------------------------------------------------------------------|
| content | `Record<string, ContentType>` | Yes      | An object holding the content of the form (a.k.a. controls). The key will be used as the controls name. |

### Type Generic

By default, you don't need to pass any type generic to `NgxFbForm`. But if you have set up a union type, you can pass that to get better type support.

> **Note**
> If you want to use Blocks you must either use a union type of your own controls or handle TypeScript errors by other mean.

## Content

Following are configuration options that are supported out of the box. When setting up Controls or Groups you can add more options.

### Base

The `NgxFbBaseContent` interface is the foundation for all form controls and groups. It defines a common set of options that control registration, validation, visibility, and behavior of the form elements.

| Name   | Type                  | Required | Description                                                                                                                                                                       |
|--------|-----------------------|----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| type   | `string`              | Yes      | Specifies the kind of form control. Determines what control is used and what additional properties are available.                                                                 |
| hidden | `Expression<boolean>` | No       | An expression that determines when the control should be hidden. Can be a string expression evaluated at runtime against the form object, or a function receiving the form value. |


### Abstract Control

Controls and Groups extend the `NgxFbAbstractControl` interface and therefore both have access to these options.

| Name            | Type                             | Required | Description                                                                                                                                                               |
|-----------------|----------------------------------|----------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| validators      | `string[]`                       | No       | Array of strings representing names of synchronous validators that apply to the control. These can be registered globally with a validator registration object.           |
| asyncValidators | `string[]`                       | No       | Similar to validators, but for asynchronous validation logic that may involve API calls or other deferred operations.                                                     |
| disabled        | `Expression<boolean> \| boolean` | No       | Defines whether the control should be disabled. Can be a boolean, a string expression, or a function receiving the form value.                                            |
| hideStrategy    | `HideStrategy`                   | No       | Specifies how to handle the control when hidden: 'keep' (remains in form model) or 'remove' (removed from form model).                                                    |
| valueStrategy   | `ValueStrategy`                  | No       | Determines how the control's value is handled when visibility changes: 'last' (preserves last value), 'default' (reverts to default value), or 'reset' (clears value).    |
| readonly        | `Expression<boolean> \| boolean` | No       | Indicates if the control is read-only (displayed but not modifiable). Can be a boolean, a string expression, or a function receiving the form value.                      |
| updateOn        | `UpdateStrategy`                 | No       | Specifies when to update the control's value: 'change' (as user types, default), 'blur' (when control loses focus), or 'submit' (when form is submitted).                 |
| computedValue   | `Expression<unknown>`            | No       | A value that is automatically derived and set for the control. Can be a string expression or a function. It will overwrite user input if one of its dependencies changes. |

### Control

The following configurations options are only applicable to the interface `NgxFbControl`.

| Name          | Type                  | Required | Description                                                                                                  |
|---------------|-----------------------|----------|--------------------------------------------------------------------------------------------------------------|
| label         | `string`              | No       | Specifies the label for the control                                                                          |
| dynamicLabel  | `Expression<string>`  | No       | A dynamic label evaluated from form data. Can be a string expression or a function receiving the form value. |
| defaultValue  | `unknown`             | No       | Should be overwritten with the proper value type of the control                                              |
| nonNullable   | `boolean`             | No       | Whether this control can have a null value. Used to set the same property through the reactive forms API     |


### Group

The following configurations options are only applicable to the interface `NgxFbFormGroup<T extends NgxFbBaseContent = NgxFbContent>`.

| Name         | Type                 | Required | Description                                                                                                   |
|--------------|----------------------|----------|---------------------------------------------------------------------------------------------------------------|
| title        | `string`             | No       | Specifies a title for the group                                                                               |
| dynamicTitle | `Expression<string>` | No       | A dynamic title evaluated from form data. Can be a string expression or a function receiving the form value.  |
| controls     | `Record<string, T>`  | Yes      | Object mapping keys to `NgxFbContent` that configure the controls of the group                                |


### Block

The following configurations are only applicable to the interface `NgxFbBlock`.

| Name      | Type    | Required | Description                                                    |
|-----------|---------|----------|----------------------------------------------------------------|
| isControl | `false` | Yes      | Required property for TypeScript to properly do type narrowing |


## Full Example

As you can see the configuration is just an object of controls and/or groups. Every entry in that object will be registered on the top-level of the form.

How to register validators depends on your integration package:

- [Reactive Forms — Validation](/reactive-forms/guides/validation)

> **Note**
> This example assumes that additional control types have been registered

```typescript name="example.form.ts"
export const exampleForm: NgxFbForm = {
  content: {
    // Simple fields with no additional configuration
    name: {
      type: 'text',
      label: 'First and Lastname',
    },
    company: {
      type: 'text',
      label: 'Name of Company',
      hint: 'If applicable',
    },
    licenses: {
      type: 'numeric',
      label: 'Amount of Licenses',
      max: 3,
    },
    // Example how a configuration for a radio button group could look like
    plan: {
      type: 'radio',
      label: 'Price Plan',
      options: [
        {
          id: 'plan-123',
          label: 'Free',
          value: 'p123',
        },
        {
          id: 'plan-456',
          label: 'Medium',
          value: 'p456',
        },
        {
          id: 'plan-789',
          label: 'Large',
          value: 'p789',
        },
      ],
    },
    termsAccepted: {
      type: 'checkbox',
      label: 'I Accept Terms',
    },
    repo: {
      type: 'group',
      controls: {
        username: {
          type: 'text',
          label: 'Username',
          defaultValue: 'UsernameSuggestion123',
          validators: ['min5Characters'],
          asyncValidators: ['usernameIsFreeValidator'],
        },
        repositories: {
          type: 'numeric',
          label: 'Repositories to create',
          defaultValue: 1,
        },
        // Example how a configuration for a dropdown could look like
        repoTemplate: {
          type: 'dropdown',
          label: 'Template',
          defaultValue: 'none',
          options: [
            {
              id: 'template-1',
              label: 'None',
              value: 'none',
            },
            {
              id: 'template-2',
              label: 'Monorepo',
              value: 'mono',
            },
            {
              id: 'template-3',
              label: 'Documentation',
              value: 'doc',
            },
            {
              id: 'template-4',
              label: 'Note Management',
              value: 'note',
            },
          ],
        },
        sendConfirmation: {
          type: 'checkbox',
          label: 'Send confirmation mail',
          defaultValue: true,
        },
        confirmationMailTarget: {
          type: 'email',
          label: 'E-Mail',
          hidden: '!repo.sendConfirmation',
          hideStrategy: 'remove',
          valueStrategy: 'reset',
        },
        editProjectId: {
          type: 'checkbox',
          label: 'Edit Project ID',
          defaultValue: false,
        },
        projectId: {
          type: 'text',
          label: 'Project ID',
          defaultValue: '123456789',
          hidden: '!repo.editProjectId',
          hideStrategy: 'keep',
          valueStrategy: 'reset',
        },
      },
    },
    docs: {
      type: 'group',
      controls: {
        docAmount: {
          type: 'numeric',
          label: 'Documents to store',
        },
        acceptedLimits: {
          type: 'checkbox',
          label: 'I accept the limits for large volumes of documents',
          hidden: 'docs.docAmount > 1000',
        },
        updateFrequency: {
          type: 'dropdown',
          label: 'Documentation Update Frequency',
          options: [
            {
              id: 'on-the-fly',
              label: 'On the fly',
              value: 'otf',
            },
            {
              id: 'sprint',
              label: 'Sprint',
              value: 'spr',
            },
            {
              id: 'cycle',
              label: 'Cycle',
              value: 'cyc',
            },
            {
              id: 'planned',
              label: 'Planned',
              value: 'pla',
            },
          ],
        },
        frequency: {
          type: 'numeric',
          label: 'Frequency (Sprint / Cycle Duration)',
          hidden: 'docs.docAmount > 2000 && (docs.updateFrequency === "spr" || docs.updateFrequency === "cyc")',
          hideStrategy: 'remove',
          valueStrategy: 'last',
        },
      },
    },
  }
};
``` 

## Next steps

Once you have a configuration, see your integration package's guide on how to render it:

- [Reactive Forms — Showing a Form](/reactive-forms/guides/showing-a-form)
