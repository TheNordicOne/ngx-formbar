import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { expect, waitFor } from 'storybook/test';
import { provideReactiveFormsExamples } from '@ngx-formbar/examples/reactive-forms';
import { StoryFormHostComponent } from './story-form-host.component';
import { NgxFbForm } from '@ngx-formbar/core';

const meta: Meta<StoryFormHostComponent> = {
  title: 'Reactive Forms/Update Strategy',
  component: StoryFormHostComponent,
};

export default meta;
type Story = StoryObj<StoryFormHostComponent>;

// -- DefaultChangeStrategy --
// Default Angular behavior: form control updates on every keystroke.

export const DefaultChangeStrategy: Story = {
  args: {
    autoUpdate: true,
    formConfig: {
      content: {
        'default-control': {
          type: 'text',
          label: 'Default Strategy',
          defaultValue: '',
        },
      },
    } satisfies NgxFbForm,
  },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByTestId('default-control-input');
    await userEvent.clear(input);
    await userEvent.type(input, 'new-text');

    await waitFor(async () => {
      const value = canvas.getByTestId('default-control-value');
      await expect(value).toHaveTextContent('new-text');
    });
  },
};

// -- GlobalBlurStrategy --
// Global blur: typing doesn't update the form, blur does.

export const GlobalBlurStrategy: Story = {
  decorators: [
    applicationConfig({
      providers: [provideReactiveFormsExamples({ updateOn: 'blur' })],
    }),
  ],
  args: {
    autoUpdate: true,
    formConfig: {
      content: {
        control: {
          type: 'text',
          label: 'Control',
        },
      },
    } satisfies NgxFbForm,
  },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByTestId('control-input');
    await userEvent.clear(input);
    await userEvent.type(input, 'new-text');

    // Value should not be visible yet (form hasn't updated)
    await expect(canvas.queryByTestId('control-value')).not.toBeInTheDocument();

    // Blur the input to trigger the update
    await userEvent.tab();

    await waitFor(async () => {
      const value = canvas.getByTestId('control-value');
      await expect(value).toHaveTextContent('new-text');
    });
  },
};

// -- GlobalSubmitStrategy --
// Global submit: form only updates on form submission.

export const GlobalSubmitStrategy: Story = {
  decorators: [
    applicationConfig({
      providers: [provideReactiveFormsExamples({ updateOn: 'submit' })],
    }),
  ],
  args: {
    autoUpdate: true,
    formConfig: {
      content: {
        control: {
          type: 'text',
          label: 'Control',
        },
      },
    } satisfies NgxFbForm,
  },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByTestId('control-input');
    await userEvent.clear(input);
    await userEvent.type(input, 'submit-text');

    // Blur should not trigger an update either
    await userEvent.tab();
    await expect(canvas.queryByTestId('control-value')).not.toBeInTheDocument();

    // Submit the form
    const submitButton = canvas.getByTestId('submit');
    await userEvent.click(submitButton);

    await waitFor(async () => {
      const value = canvas.getByTestId('control-value');
      await expect(value).toHaveTextContent('submit-text');
    });
  },
};

// -- ControlOverride --
// Global strategy is 'submit', but one control overrides to 'change'.

export const ControlOverride: Story = {
  decorators: [
    applicationConfig({
      providers: [provideReactiveFormsExamples({ updateOn: 'submit' })],
    }),
  ],
  args: {
    autoUpdate: true,
    formConfig: {
      content: {
        'default-control': {
          type: 'text',
          label: 'Default Control',
        },
        'override-control': {
          type: 'text',
          label: 'Override Control',
          updateOn: 'change',
        },
      },
    } satisfies NgxFbForm,
  },
  play: async ({ canvas, userEvent }) => {
    // The override-control uses 'change', so typing updates immediately
    const overrideInput = canvas.getByTestId('override-control-input');
    await userEvent.clear(overrideInput);
    await userEvent.type(overrideInput, 'override-text');

    await waitFor(async () => {
      const overrideValue = canvas.getByTestId('override-control-value');
      await expect(overrideValue).toHaveTextContent('override-text');
    });

    // The default-control uses the global 'submit' strategy
    const defaultInput = canvas.getByTestId('default-control-input');
    await userEvent.clear(defaultInput);
    await userEvent.type(defaultInput, 'default-text');
    await userEvent.tab();

    // Value should not be present since the form hasn't been submitted
    await expect(
      canvas.queryByTestId('default-control-value'),
    ).not.toHaveTextContent('default-text');

    // Submit the form to trigger the update for the default control
    const submitButton = canvas.getByTestId('submit');
    await userEvent.click(submitButton);

    await waitFor(async () => {
      const defaultValue = canvas.getByTestId('default-control-value');
      await expect(defaultValue).toHaveTextContent('default-text');
    });
  },
};

// -- NestedGroupInheritance --
// Nested groups inherit the parent group's updateOn strategy,
// but can override it at any level.

export const NestedGroupInheritance: Story = {
  args: {
    autoUpdate: true,
    formConfig: {
      content: {
        'root-group': {
          type: 'group',
          updateOn: 'submit',
          controls: {
            'child-group': {
              type: 'group',
              // Inherits 'submit' from root-group
              controls: {
                'grandchild-control': {
                  type: 'text',
                  label: 'Grandchild Control',
                  // Inherits 'submit' from parent chain
                },
              },
            },
            'override-group': {
              type: 'group',
              updateOn: 'blur',
              // Overrides to 'blur'
              controls: {
                'grandchild-override-control': {
                  type: 'text',
                  label: 'Grandchild Override Control',
                  // Inherits 'blur' from immediate parent
                },
              },
            },
          },
        },
      },
    } satisfies NgxFbForm,
  },
  play: async ({ canvas, userEvent }) => {
    // -- Grandchild inheriting 'submit' through nested groups --
    const grandchildInput = canvas.getByTestId('root-group-child-group-grandchild-control-input');
    await userEvent.clear(grandchildInput);
    await userEvent.type(grandchildInput, 'grandchild-text');
    await userEvent.tab();

    // Should not update yet (needs submit)
    await expect(
      canvas.queryByTestId('root-group.child-group.grandchild-control-value'),
    ).not.toBeInTheDocument();

    // Submit to trigger the update
    const submitButton = canvas.getByTestId('submit');
    await userEvent.click(submitButton);

    await waitFor(async () => {
      const grandchildValue = canvas.getByTestId(
        'root-group.child-group.grandchild-control-value',
      );
      await expect(grandchildValue).toHaveTextContent('grandchild-text');
    });

    // -- Grandchild inheriting 'blur' from overridden parent group --
    const overrideInput = canvas.getByTestId(
      'root-group-override-group-grandchild-override-control-input',
    );
    await userEvent.clear(overrideInput);
    await userEvent.type(overrideInput, 'override-grandchild-text');

    // Should not update yet (needs blur)
    await waitFor(async () => {
      const overrideValue = canvas.getByTestId(
        'root-group.override-group.grandchild-override-control-value',
      );
      await expect(overrideValue).toHaveTextContent('');
    });

    // Blur to trigger the update
    await userEvent.tab();

    await waitFor(async () => {
      const overrideValue = canvas.getByTestId(
        'root-group.override-group.grandchild-override-control-value',
      );
      await expect(overrideValue).toHaveTextContent('override-grandchild-text');
    });
  },
};
