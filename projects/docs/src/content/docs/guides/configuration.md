---
title: Configuring a Form
keyword: ConfigurationPage
sidebar:
  order: 3
---

Once you've registered [Controls](/guides/controls), [Groups](/guides/groups) and optionally [Validators](/guides/validation), you can write a configuration for a form, either directly in JSON or in TypeScript, for better typing information.

## Form

The `NgxFwForm<ContentType extends NgxFwBaseContent = NgxFwContent>` interface defines these properties.

| Name    | Type                          | Required | Description                                                                                             |
|---------|-------------------------------|----------|---------------------------------------------------------------------------------------------------------|
| content | `Record<string, ContentType>` | Yes      | An object holding the content of the form (a.k.a. controls). The key will be used as the controls name. |

### Type Generic

By default, you don't need to pass any type generic to `NgxFwForm`. But if you have set up a [union type](/guides/helper/#union-types), you can pass that to get better type support. 

:::note
If you want to use [Blocks](/guides/blocks) you must either use a [union type](/guides/helper/#union-types) of your own controls or handle TypeScript errors by other mean.
:::

## Content

Following are configuration options that are supported out of the box. When setting up [Controls](/guides/controls) or [Groups](/guides/groups) you can add more options.

### Base

The `NgxFwBaseContent` interface is the foundation for all form controls and groups. It defines a common set of options that control registration, validation, visibility, and behavior of the form elements.

| Name            | Type                | Required | Description                                                                                                                                                            |
|-----------------|---------------------|----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| type            | `string`            | Yes      | Specifies the kind of form control. Determines what control is used and what additional properties are available.                                                      |
| hidden          | `string`            | No       | A string expression that determines when the control should be hidden. This condition is evaluated at runtime against the whole form object.                           |


### Abstract Control

Controls and Groups extend the `NgxFwAbstractControl` interface and therefore both have access to these options.

| Name            | Type                | Required | Description                                                                                                                                                            |
|-----------------|---------------------|----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| validators      | `string[]`          | No       | Array of strings representing names of synchronous validators that apply to the control. These can be registered globally with a validator registration object.        |
| asyncValidators | `string[]`          | No       | Similar to validators, but for asynchronous validation logic that may involve API calls or other deferred operations.                                                  |
| disabled        | `string \| boolean` | No       | Defines whether the control should be disabled. Can be a boolean value or a string expression that evaluates against the form object.                                  |
| hideStrategy    | `HideStrategy`      | No       | Specifies how to handle the control when hidden: 'keep' (remains in form model) or 'remove' (removed from form model).                                                 |
| valueStrategy   | `ValueStrategy`     | No       | Determines how the control's value is handled when visibility changes: 'last' (preserves last value), 'default' (reverts to default value), or 'reset' (clears value). |
| readonly        | `string \| boolean` | No       | Indicates if the control is read-only (displayed but not modifiable). Accepts either a boolean value or a string expression for dynamic evaluation.                    |
| updateOn        | `UpdateStrategy`    | No       | Specifies when to update the control's value: 'change' (as user types, default), 'blur' (when control loses focus), or 'submit' (when form is submitted).              |

### Control

The following configurations options are only applicable to the interface `NgxFwControl`.

| Name          | Type      | Required | Description                                                                                                                     |
|---------------|-----------|----------|---------------------------------------------------------------------------------------------------------------------------------|
| label         | `string`  | Yes      | Specifies the label for the control                                                                                             |
| defaultValue  | `unknown` | No       | Should be overwritten with the proper value type of the control                                                                 |
| nonNullable   | `boolean` | No       | Whether this control can have a null value. Used to set the same property through the reactive forms API                        |
| computedValue | `string`  | No       | A value that is automatically derived and set for the control. It will overwrite user input if one of its dependencies changes. |


### Group

The following configurations options are only applicable to the interface `NgxFwFormGroup<T extends NgxFwBaseContent = NgxFwContent>`.

| Name     | Type                | Required | Description                                                                    |
|----------|---------------------|----------|--------------------------------------------------------------------------------|
| title    | `string`            | No       | Specifies a title for the group                                                |
| controls | `Record<string, T>` | Yes      | Object mapping keys to `NgxFwContent` that configure the controls of the group |


### Block

The following configurations are only applicable to the interface `NgxFwBlock`.

| Name      | Type    | Required | Description                                                    |
|-----------|---------|----------|----------------------------------------------------------------|
| isControl | `false` | Yes      | Required property for TypeScript to properly do type narrowing |


## Full Example

As you can see the configuration is just an array of controls and/or groups. Every item in that array will be registered on the top-level of the form.

Checkout [Validation](/guides/validation) to see how to register validators.

:::note
This example assumes that additional control types have been registered
:::

```ts title="example.form.ts"
export const exampleForm: NgxFwForm = {
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
          default: 'UsernameSuggestion123',
          validators: ['min5Characters'],
          asyncValidators: ['usernameIsFreeValidator'],
        },
        repositories: {
          type: 'numeric',
          label: 'Repositories to create',
          default: 1,
        },
        // Example how a configuration for a dropdown could look like
        repoTemplate: {
          type: 'dropdown',
          label: 'Template',
          default: 'none',
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
              id: 'template-3', // Note: Duplicate ID, consider fixing if intentional
              label: 'Note Management',
              value: 'note',
            },
          ],
        },
        sendConfirmation: {
          type: 'checkbox',
          label: 'Send confirmation mail',
          default: true,
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
          default: false,
        },
        projectId: {
          type: 'text',
          label: 'Project ID',
          default: '123456789',
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
