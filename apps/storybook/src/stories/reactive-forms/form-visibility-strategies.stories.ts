import type { Meta, StoryObj } from '@storybook/angular';
import { expect, waitFor } from 'storybook/test';
import { NgxFbForm } from '@ngx-formbar/core';
import { ExampleControls } from '@ngx-formbar/examples';
import { StoryFormHostComponent } from './story-form-host.component';

const meta: Meta<StoryFormHostComponent> = {
  title: 'Reactive Forms/Visibility Strategies/Structural',
  component: StoryFormHostComponent,
};

export default meta;
type Story = StoryObj<StoryFormHostComponent>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formConfig(
  content: Record<string, ExampleControls>,
): NgxFbForm<ExampleControls> {
  return { content };
}

function getFormValue(): Record<string, unknown> {
  return StoryFormHostComponent.lastInstance!.form.getRawValue();
}

// ---------------------------------------------------------------------------
// Control-level stories
// ---------------------------------------------------------------------------

export const ControlKeepLast: Story = {
  name: 'Control — Keep & Last',
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      keepLastField: {
        type: 'text',
        label: 'Keep and use last value',
        defaultValue: 'default-value',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'keep',
        valueStrategy: 'last',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const customValue = 'Custom keep & last value';

    // Fill the field with a custom value
    const targetInput = canvas.getByRole('textbox', { name: 'Keep and use last value' });
    await userEvent.clear(targetInput);
    await userEvent.type(targetInput, customValue);

    // Hide the field
    const triggerInput = canvas.getByRole('textbox', { name: 'Type "hide" to hide everything' });
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Verify field is hidden
    await waitFor(async () => {
      await expect(canvas.queryByRole('textbox', { name: 'Keep and use last value' })).not.toBeInTheDocument();
    });

    // Value is preserved in the form model (keep strategy)
    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));
    await waitFor(async () => {
      await expect(getFormValue()['keepLastField']).toBe(customValue);
    });

    // Show field again
    await userEvent.clear(canvas.getByRole('textbox', { name: 'Type "hide" to hide everything' }));

    // Verify field appears with the last value
    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'Keep and use last value' })).toHaveValue(customValue);
    });
  },
};

export const ControlRemoveLast: Story = {
  name: 'Control — Remove & Last',
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      removeLastField: {
        type: 'text',
        label: 'Remove but remember last value',
        defaultValue: 'default-value',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'remove',
        valueStrategy: 'last',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const customValue = 'Custom remove & last value';

    // Fill the field with a custom value
    const targetInput = canvas.getByRole('textbox', { name: 'Remove but remember last value' });
    await userEvent.clear(targetInput);
    await userEvent.type(targetInput, customValue);

    // Hide the field
    const triggerInput = canvas.getByRole('textbox', { name: 'Type "hide" to hide everything' });
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Verify field is removed from DOM
    await waitFor(async () => {
      await expect(canvas.queryByRole('textbox', { name: 'Remove but remember last value' })).not.toBeInTheDocument();
    });

    // Value is not in the form model when hidden (remove strategy)
    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));
    await waitFor(async () => {
      await expect(getFormValue()['removeLastField']).toBeUndefined();
    });

    // Show field again
    await userEvent.clear(canvas.getByRole('textbox', { name: 'Type "hide" to hide everything' }));

    // Verify field appears with the last value
    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'Remove but remember last value' })).toHaveValue(customValue);
    });
  },
};

export const ControlRemoveDefault: Story = {
  name: 'Control — Remove & Default',
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      removeDefaultField: {
        type: 'text',
        label: 'Remove but use default value',
        defaultValue: 'default-remove-default',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'remove',
        valueStrategy: 'default',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const customValue = 'Custom remove & default value';
    const defaultValue = 'default-remove-default';

    // Fill the field with a custom value
    const targetInput = canvas.getByRole('textbox', { name: 'Remove but use default value' });
    await userEvent.clear(targetInput);
    await userEvent.type(targetInput, customValue);

    // Hide the field
    const triggerInput = canvas.getByRole('textbox', { name: 'Type "hide" to hide everything' });
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Verify field is removed from DOM
    await waitFor(async () => {
      await expect(canvas.queryByRole('textbox', { name: 'Remove but use default value' })).not.toBeInTheDocument();
    });

    // Value is not in the form model when hidden
    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));
    await waitFor(async () => {
      await expect(getFormValue()['removeDefaultField']).toBeUndefined();
    });

    // Show field again
    await userEvent.clear(canvas.getByRole('textbox', { name: 'Type "hide" to hide everything' }));

    // Verify field appears with the default value
    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'Remove but use default value' })).toHaveValue(defaultValue);
    });
  },
};

export const ControlRemoveReset: Story = {
  name: 'Control — Remove & Reset',
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      removeResetField: {
        type: 'text',
        label: 'Remove and reset value',
        defaultValue: 'default-remove-reset',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'remove',
        valueStrategy: 'reset',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const customValue = 'Custom remove & reset value';

    // Fill the field with a custom value
    const targetInput = canvas.getByRole('textbox', { name: 'Remove and reset value' });
    await userEvent.clear(targetInput);
    await userEvent.type(targetInput, customValue);

    // Hide the field
    const triggerInput = canvas.getByRole('textbox', { name: 'Type "hide" to hide everything' });
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Verify field is removed from DOM
    await waitFor(async () => {
      await expect(canvas.queryByRole('textbox', { name: 'Remove and reset value' })).not.toBeInTheDocument();
    });

    // Value is not in the form model when hidden
    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));
    await waitFor(async () => {
      await expect(getFormValue()['removeResetField']).toBeUndefined();
    });

    // Show field again
    await userEvent.clear(canvas.getByRole('textbox', { name: 'Type "hide" to hide everything' }));

    // Verify field appears with empty value (reset to null)
    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'Remove and reset value' })).toHaveValue('');
    });
  },
};

// ---------------------------------------------------------------------------
// Control — Keep & Default
// ---------------------------------------------------------------------------

export const ControlKeepDefault: Story = {
  name: 'Control — Keep & Default',
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      keepDefaultField: {
        type: 'text',
        label: 'Keep but use default value',
        defaultValue: 'default-keep-default',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'keep',
        valueStrategy: 'default',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const customValue = 'Custom keep & default value';
    const defaultValue = 'default-keep-default';

    // Fill the field with a custom value
    const targetInput = canvas.getByRole('textbox', { name: 'Keep but use default value' });
    await userEvent.clear(targetInput);
    await userEvent.type(targetInput, customValue);

    // Hide the field
    const triggerInput = canvas.getByRole('textbox', { name: 'Type "hide" to hide everything' });
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Verify field is removed from DOM
    await waitFor(async () => {
      await expect(canvas.queryByRole('textbox', { name: 'Keep but use default value' })).not.toBeInTheDocument();
    });

    // Value reverts to default in the form model (keep + default strategy)
    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));
    await waitFor(async () => {
      await expect(getFormValue()['keepDefaultField']).toBe(defaultValue);
    });

    // Show field again
    await userEvent.clear(canvas.getByRole('textbox', { name: 'Type "hide" to hide everything' }));

    // Verify field appears with the default value
    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'Keep but use default value' })).toHaveValue(defaultValue);
    });
  },
};

// ---------------------------------------------------------------------------
// Control — Keep & Reset
// ---------------------------------------------------------------------------

export const ControlKeepReset: Story = {
  name: 'Control — Keep & Reset',
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      keepResetField: {
        type: 'text',
        label: 'Keep but reset value',
        defaultValue: 'default-keep-reset',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'keep',
        valueStrategy: 'reset',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const customValue = 'Custom keep & reset value';

    // Fill the field with a custom value
    const targetInput = canvas.getByRole('textbox', { name: 'Keep but reset value' });
    await userEvent.clear(targetInput);
    await userEvent.type(targetInput, customValue);

    // Hide the field
    const triggerInput = canvas.getByRole('textbox', { name: 'Type "hide" to hide everything' });
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Verify field is removed from DOM
    await waitFor(async () => {
      await expect(canvas.queryByRole('textbox', { name: 'Keep but reset value' })).not.toBeInTheDocument();
    });

    // Value is reset to empty in the form model (keep + reset strategy)
    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));
    await waitFor(async () => {
      await expect(getFormValue()['keepResetField']).toBeNull();
    });

    // Show field again
    await userEvent.clear(canvas.getByRole('textbox', { name: 'Type "hide" to hide everything' }));

    // Verify field appears with empty value (reset)
    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'Keep but reset value' })).toHaveValue('');
    });
  },
};

