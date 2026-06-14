The form configuration defines the structure and behavior of your form. It is the same regardless of which integration package you use. You can write it directly in JSON, or in TypeScript for better typing information.

## Form

The `NgxFbForm<ContentType extends NgxFbBaseContent = NgxFbItem>` interface defines these properties.

| Name    | Type                          | Required | Description                                                                                             |
| ------- | ----------------------------- | -------- | ------------------------------------------------------------------------------------------------------- |
| content | `Record<string, ContentType>` | Yes      | An object holding the content of the form (a.k.a. controls). The key will be used as the controls name. |

### Type Generic

By default, you don't need to pass any type generic to `NgxFbForm`, but if you have set up a union type, you can pass that to get better type support.

> **Note**
> If you want to use Blocks you must either use a union type of your own controls or handle TypeScript errors by other means.

## Content

The following configuration options are supported built in. When setting up Controls or Groups you can add more.

### Base

The `NgxFbBaseContent` interface is the foundation for all form content. It defines the minimal set of properties shared across all content types: type identification and visibility.

| Name   | Type                  | Required | Description                                                                                                                                                                       |
| ------ | --------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type   | `string`              | Yes      | Specifies the kind of form control. Determines what control is used and what additional properties are available.                                                                 |
| hidden | `Expression<boolean>` | No       | An expression that determines when the control should be hidden. Can be a string expression evaluated at runtime against the form object, or a function receiving the form value. |

### Abstract Control

Controls and Groups extend the `NgxFbAbstractControl` interface and therefore both have access to these options.

| Name            | Type                             | Required | Description                                                                                                                                                               |
| --------------- | -------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
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

| Name         | Type                 | Required | Description                                                                                                  |
| ------------ | -------------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| label        | `string`             | No       | Specifies the label for the control                                                                          |
| dynamicLabel | `Expression<string>` | No       | A dynamic label evaluated from form data. Can be a string expression or a function receiving the form value. |
| defaultValue | `unknown`            | No       | Should be overwritten with the proper value type of the control                                              |
| nonNullable  | `boolean`            | No       | Whether the control rejects null. Maps to the `nonNullable` option on Angular's form controls                |

### Group

The following configurations options are only applicable to the interface `NgxFbFormGroup<T extends NgxFbBaseContent = NgxFbItem>`.

| Name         | Type                 | Required | Description                                                                                                  |
| ------------ | -------------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| title        | `string`             | No       | Specifies a title for the group                                                                              |
| dynamicTitle | `Expression<string>` | No       | A dynamic title evaluated from form data. Can be a string expression or a function receiving the form value. |
| controls     | `Record<string, T>`  | Yes      | Object mapping keys to `NgxFbItem` that configure the controls of the group                                  |

### Block

The following configurations are only applicable to the interface `NgxFbBlock`.

| Name      | Type    | Required | Description                                                    |
| --------- | ------- | -------- | -------------------------------------------------------------- |
| isControl | `false` | Yes      | Required property for TypeScript to properly do type narrowing |

## Full Example

The configuration is an object of controls and/or groups. Every entry in that object is registered on the top level of the form.

How to register validators depends on your integration package:

- [Reactive Forms: Validation](/reactive-forms/guides/validation)

> **Note**
> This example assumes that additional control types have been registered

```typescript name="example.form.ts"
export const exampleForm: NgxFbForm = {
  content: {
    // Simple fields with no additional configuration
    fullName: {
      type: 'text',
      label: 'Full Name',
    },
    company: {
      type: 'text',
      label: 'Name of Company',
      hint: 'If applicable',
    },
    peopleAffected: {
      type: 'number',
      label: 'People Affected (estimate)',
      max: 5000,
    },
    // Example how a configuration for a radio button group could look like
    urgency: {
      type: 'radio',
      label: 'Urgency',
      options: [
        {
          id: 'urg-low',
          label: 'Low',
          value: 'low',
        },
        {
          id: 'urg-med',
          label: 'Medium',
          value: 'medium',
        },
        {
          id: 'urg-high',
          label: 'High',
          value: 'high',
        },
      ],
    },
    policyAccepted: {
      type: 'checkbox',
      label: 'I Accept the Facility Policy',
    },
    requester: {
      type: 'group',
      controls: {
        contactName: {
          type: 'text',
          label: 'Contact Name',
          defaultValue: 'Emma Frost',
          validators: ['min2Characters'],
          asyncValidators: ['contactIsKnown'],
        },
        room: {
          type: 'number',
          label: 'Room Number',
          defaultValue: 1,
        },
        // Example how a configuration for a dropdown could look like
        building: {
          type: 'dropdown',
          label: 'Building',
          defaultValue: 'A',
          options: [
            {
              id: 'b-a',
              label: 'A',
              value: 'A',
            },
            {
              id: 'b-b',
              label: 'B',
              value: 'B',
            },
            {
              id: 'b-c',
              label: 'C',
              value: 'C',
            },
            {
              id: 'b-d',
              label: 'D',
              value: 'D',
            },
          ],
        },
        sendConfirmation: {
          type: 'checkbox',
          label: 'Send confirmation mail',
          defaultValue: true,
        },
        confirmationMailTarget: {
          type: 'text',
          label: 'E-Mail',
          validators: ['email'],
          hidden: '!requester.sendConfirmation',
          hideStrategy: 'remove',
          valueStrategy: 'reset',
        },
        editTicketId: {
          type: 'checkbox',
          label: 'Edit Ticket ID',
          defaultValue: false,
        },
        ticketId: {
          type: 'text',
          label: 'Ticket ID',
          defaultValue: '123456789',
          hidden: '!requester.editTicketId',
          hideStrategy: 'keep',
          valueStrategy: 'reset',
        },
      },
    },
    details: {
      type: 'group',
      controls: {
        peopleImpacted: {
          type: 'number',
          label: 'People Impacted',
        },
        acceptedLimits: {
          type: 'checkbox',
          label: 'I accept the handling time for large impact requests',
          hidden: 'details.peopleImpacted > 1000',
        },
        category: {
          type: 'dropdown',
          label: 'Category',
          options: [
            {
              id: 'cat-hvac',
              label: 'HVAC',
              value: 'hvac',
            },
            {
              id: 'cat-elec',
              label: 'Electrical',
              value: 'electrical',
            },
            {
              id: 'cat-plum',
              label: 'Plumbing',
              value: 'plumbing',
            },
            {
              id: 'cat-clean',
              label: 'Cleaning',
              value: 'cleaning',
            },
          ],
        },
        unitId: {
          type: 'text',
          label: 'Unit ID (HVAC / Electrical)',
          hidden: 'details.peopleImpacted > 2000 && (details.category === "hvac" || details.category === "electrical")',
          hideStrategy: 'remove',
          valueStrategy: 'last',
        },
      },
    },
  },
};
```

## Typing the Form Value

{% include "../../shared/typed-form-value.md" %}

## Next Steps

Once you have a configuration, see your integration package's guide on how to render it:

- [Reactive Forms: Showing a Form](/reactive-forms/guides/showing-a-form)
