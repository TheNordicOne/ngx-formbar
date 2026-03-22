## Preparation

Before you go render a form, you must have at least one control set up and registered.

Detailed instructions for how to create and register controls, groups and blocks can be found in the Guides section.

- Controls
- Groups
- Blocks

In addition to controls you can also optionally configure validators. See the Validation page for detailed instructions.

## Configuring a form

Once you've registered controls and optionally validators, you write a configuration for a form. You can either do this directly in JSON or in TypeScript, for better typing information.

This example is written in TypeScript

```typescript name="example.form.ts"
export const exampleForm: NgxFbForm = {
  content: {
    name: {
      type: 'text',
      label: 'First and Lastname',
    },
    company: {
      type: 'text',
      label: 'Name of Company',
      hint: 'If applicable',
    },
    repo: {
      type: 'group',
      controls: {
        username: {
          type: 'text',
          label: 'Username',
          defaultValue: 'UsernameSuggestion123',
        },
      },
    },
  },
};
```

As you can see the configuration is just an object of controls and/or groups/blocks. Every entry in that object will be registered on the top-level of the form. Items within the `controls` property of a group will be registered within that group.

This is just simple example. For more details go to the Configuration guide.

## Showing a form

{% include "../../shared/showing-a-form.md" %}
