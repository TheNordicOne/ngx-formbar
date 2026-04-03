import type { Meta, StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { NgxFbForm } from '@ngx-formbar/core';
import { ExampleControls } from '@ngx-formbar/examples';
import { StoryFormHostComponent } from './story-form-host.component';

const meta: Meta<StoryFormHostComponent> = {
  title: 'Reactive Forms/Visibility Strategies/Controls',
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
// Stories
// ---------------------------------------------------------------------------

export const ControlKeepLast: Story = {
  name: 'Keep & Last',
  parameters: {
    docs: { description: { story: 'Keep strategy with last value — control removed from view, value preserved in model.' } },
  },
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
    const targetInput = await canvas.findByRole('textbox', { name: 'Keep and use last value' });
    await userEvent.clear(targetInput);
    await userEvent.type(targetInput, customValue);

    // Hide the field
    const triggerInput = await canvas.findByRole('textbox', { name: 'Type "hide" to hide everything' });
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Verify field is hidden but still in the DOM (keep strategy)
    await expect(canvas.queryByRole('textbox', { name: 'Keep and use last value', hidden: true })).toBeInTheDocument();
    await expect(canvas.queryByRole('textbox', { name: 'Keep and use last value' })).not.toBeInTheDocument();

    // Value is preserved in the form model (keep strategy)
    await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
    await expect(getFormValue()['keepLastField']).toBe(customValue);

    // Show field again
    await userEvent.clear(await canvas.findByRole('textbox', { name: 'Type "hide" to hide everything' }));

    // Verify field appears with the last value
    await expect(await canvas.findByRole('textbox', { name: 'Keep and use last value' })).toHaveValue(customValue);
  },
};

export const ControlRemoveLast: Story = {
  name: 'Remove & Last',
  parameters: {
    docs: { description: { story: 'Remove strategy with last value — control removed from DOM and model, restored on show.' } },
  },
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
    const targetInput = await canvas.findByRole('textbox', { name: 'Remove but remember last value' });
    await userEvent.clear(targetInput);
    await userEvent.type(targetInput, customValue);

    // Hide the field
    const triggerInput = await canvas.findByRole('textbox', { name: 'Type "hide" to hide everything' });
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Verify field is removed from the DOM entirely (remove strategy)
    await expect(canvas.queryByRole('textbox', { name: 'Remove but remember last value', hidden: true })).not.toBeInTheDocument();

    // Value is not in the form model when hidden (remove strategy)
    await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
    await expect(getFormValue()['removeLastField']).toBeUndefined();

    // Show field again
    await userEvent.clear(await canvas.findByRole('textbox', { name: 'Type "hide" to hide everything' }));

    // Verify field appears with the last value
    await expect(await canvas.findByRole('textbox', { name: 'Remove but remember last value' })).toHaveValue(customValue);
  },
};

export const ControlRemoveDefault: Story = {
  name: 'Remove & Default',
  parameters: {
    docs: { description: { story: 'Remove strategy with default — reverts to default value on show.' } },
  },
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
    const targetInput = await canvas.findByRole('textbox', { name: 'Remove but use default value' });
    await userEvent.clear(targetInput);
    await userEvent.type(targetInput, customValue);

    // Hide the field
    const triggerInput = await canvas.findByRole('textbox', { name: 'Type "hide" to hide everything' });
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Verify field is removed from the DOM entirely (remove strategy)
    await expect(canvas.queryByRole('textbox', { name: 'Remove but use default value', hidden: true })).not.toBeInTheDocument();

    // Value is not in the form model when hidden
    await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
    await expect(getFormValue()['removeDefaultField']).toBeUndefined();

    // Show field again
    await userEvent.clear(await canvas.findByRole('textbox', { name: 'Type "hide" to hide everything' }));

    // Verify field appears with the default value
    await expect(await canvas.findByRole('textbox', { name: 'Remove but use default value' })).toHaveValue(defaultValue);
  },
};

export const ControlRemoveReset: Story = {
  name: 'Remove & Reset',
  parameters: {
    docs: { description: { story: 'Remove strategy with reset — clears to null on show.' } },
  },
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
    const targetInput = await canvas.findByRole('textbox', { name: 'Remove and reset value' });
    await userEvent.clear(targetInput);
    await userEvent.type(targetInput, customValue);

    // Hide the field
    const triggerInput = await canvas.findByRole('textbox', { name: 'Type "hide" to hide everything' });
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Verify field is removed from the DOM entirely (remove strategy)
    await expect(canvas.queryByRole('textbox', { name: 'Remove and reset value', hidden: true })).not.toBeInTheDocument();

    // Value is not in the form model when hidden
    await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
    await expect(getFormValue()['removeResetField']).toBeUndefined();

    // Show field again
    await userEvent.clear(await canvas.findByRole('textbox', { name: 'Type "hide" to hide everything' }));

    // Verify field appears with empty value (reset to null)
    await expect(await canvas.findByRole('textbox', { name: 'Remove and reset value' })).toHaveValue('');
  },
};

// ---------------------------------------------------------------------------
//Keep & Default
// ---------------------------------------------------------------------------

export const ControlKeepDefault: Story = {
  name: 'Keep & Default',
  parameters: {
    docs: { description: { story: 'Keep strategy with default — reverts to default when hidden.' } },
  },
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
    const targetInput = await canvas.findByRole('textbox', { name: 'Keep but use default value' });
    await userEvent.clear(targetInput);
    await userEvent.type(targetInput, customValue);

    // Hide the field
    const triggerInput = await canvas.findByRole('textbox', { name: 'Type "hide" to hide everything' });
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Verify field is hidden but still in the DOM (keep strategy)
    await expect(canvas.queryByRole('textbox', { name: 'Keep but use default value', hidden: true })).toBeInTheDocument();
    await expect(canvas.queryByRole('textbox', { name: 'Keep but use default value' })).not.toBeInTheDocument();

    // Value reverts to default in the form model (keep + default strategy)
    await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
    await expect(getFormValue()['keepDefaultField']).toBe(defaultValue);

    // Show field again
    await userEvent.clear(await canvas.findByRole('textbox', { name: 'Type "hide" to hide everything' }));

    // Verify field appears with the default value
    await expect(await canvas.findByRole('textbox', { name: 'Keep but use default value' })).toHaveValue(defaultValue);
  },
};

// ---------------------------------------------------------------------------
//Keep & Reset
// ---------------------------------------------------------------------------

export const ControlKeepReset: Story = {
  name: 'Keep & Reset',
  parameters: {
    docs: { description: { story: 'Keep strategy with reset — clears to null when hidden.' } },
  },
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
    const targetInput = await canvas.findByRole('textbox', { name: 'Keep but reset value' });
    await userEvent.clear(targetInput);
    await userEvent.type(targetInput, customValue);

    // Hide the field
    const triggerInput = await canvas.findByRole('textbox', { name: 'Type "hide" to hide everything' });
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Verify field is hidden but still in the DOM (keep strategy)
    await expect(canvas.queryByRole('textbox', { name: 'Keep but reset value', hidden: true })).toBeInTheDocument();
    await expect(canvas.queryByRole('textbox', { name: 'Keep but reset value' })).not.toBeInTheDocument();

    // Value is reset to empty in the form model (keep + reset strategy)
    await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
    await expect(getFormValue()['keepResetField']).toBeNull();

    // Show field again
    await userEvent.clear(await canvas.findByRole('textbox', { name: 'Type "hide" to hide everything' }));

    // Verify field appears with empty value (reset)
    await expect(await canvas.findByRole('textbox', { name: 'Keep but reset value' })).toHaveValue('');
  },
};

