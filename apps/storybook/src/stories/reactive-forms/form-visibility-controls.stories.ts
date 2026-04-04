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
    autoUpdate: true,
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

// ---------------------------------------------------------------------------
// Remove & Last — Reset clears cache
// ---------------------------------------------------------------------------

export const ControlRemoveLastResetClearsCache: Story = {
  name: 'Remove & Last — Reset clears cache',
  parameters: {
    docs: { description: { story: 'When the form is reset while a control is hidden, the cached "last" value should be discarded. The control should show its default value on re-show, not the stale cached value.' } },
  },
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      cachedField: {
        type: 'text',
        label: 'Cached field',
        defaultValue: 'default-cached',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'remove',
        valueStrategy: 'last',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const defaultValue = 'default-cached';

    for (const [i, customValue] of ['First', 'Second', 'Third'].entries()) {
      // Fill the field with a custom value
      const targetInput = await canvas.findByRole('textbox', { name: 'Cached field' });
      await userEvent.clear(targetInput);
      await userEvent.type(targetInput, customValue);

      // Hide the field (value is cached in FormLifecycleState)
      const triggerInput = await canvas.findByRole('textbox', { name: 'Type "hide" to hide everything' });
      await userEvent.clear(triggerInput);
      await userEvent.type(triggerInput, 'hide');

      // Verify field is removed from DOM
      await expect(canvas.queryByRole('textbox', { name: 'Cached field', hidden: true })).not.toBeInTheDocument();

      // Reset the form while the control is hidden
      await userEvent.click(await canvas.findByRole('button', { name: 'Reset' }));

      // Verify field appears with default value, NOT the stale cached value
      await expect(await canvas.findByRole('textbox', { name: 'Cached field' })).toHaveValue(defaultValue);
    }
  },
};

// ---------------------------------------------------------------------------
// Manual Visibility Handling
// ---------------------------------------------------------------------------

export const ManualKeep: Story = {
  name: 'Manual — Keep',
  parameters: {
    docs: { description: { story: 'With manual visibility handling, the library does not set [attr.hidden] or manage the form model. The component handles visibility itself via @if.' } },
  },
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      manualKeepField: {
        type: 'manual-text',
        label: 'Manual keep field',
        defaultValue: 'default-manual-keep',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'keep',
        valueStrategy: 'last',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const customValue = 'Custom manual value';

    // Fill the field
    const targetInput = await canvas.findByRole('textbox', { name: 'Manual keep field' });
    await userEvent.clear(targetInput);
    await userEvent.type(targetInput, customValue);

    // Hide
    const triggerInput = await canvas.findByRole('textbox', { name: 'Type "hide" to hide everything' });
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Component handles hiding via @if — field is not in DOM
    await expect(canvas.queryByRole('textbox', { name: 'Manual keep field' })).not.toBeInTheDocument();

    // Library should NOT have removed control from form model (keep strategy, manual handling)
    await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
    await expect(getFormValue()['manualKeepField']).toBe(customValue);

    // Show again
    await userEvent.clear(await canvas.findByRole('textbox', { name: 'Type "hide" to hide everything' }));

    // Value preserved (last strategy, component handles it)
    await expect(await canvas.findByRole('textbox', { name: 'Manual keep field' })).toHaveValue(customValue);
  },
};

export const ManualKeepDefault: Story = {
  name: 'Manual — Keep & Default (no library value handling)',
  parameters: {
    docs: { description: { story: 'With manual handling and default value strategy, the library should NOT reset the value to defaultValue when hidden. The component manages everything.' } },
  },
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      manualKeepDefaultField: {
        type: 'manual-text',
        label: 'Manual keep default field',
        defaultValue: 'default-manual',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'keep',
        valueStrategy: 'default',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const customValue = 'Custom manual default value';

    // Fill the field
    const targetInput = await canvas.findByRole('textbox', { name: 'Manual keep default field' });
    await userEvent.clear(targetInput);
    await userEvent.type(targetInput, customValue);

    // Hide
    const triggerInput = await canvas.findByRole('textbox', { name: 'Type "hide" to hide everything' });
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Library should NOT have applied value strategy (manual mode)
    // The form model should still have the custom value, NOT defaultValue
    await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
    await expect(getFormValue()['manualKeepDefaultField']).toBe(customValue);

    // Show again
    await userEvent.clear(await canvas.findByRole('textbox', { name: 'Type "hide" to hide everything' }));

    // Value preserved (library didn't touch it)
    await expect(await canvas.findByRole('textbox', { name: 'Manual keep default field' })).toHaveValue(customValue);
  },
};

export const ManualRemove: Story = {
  name: 'Manual — Remove',
  parameters: {
    docs: { description: { story: 'With manual visibility handling and remove strategy, the library should NOT destroy the component. The component handles visibility itself.' } },
  },
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      manualRemoveField: {
        type: 'manual-text',
        label: 'Manual remove field',
        defaultValue: 'default-manual-remove',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'remove',
        valueStrategy: 'last',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const customValue = 'Custom manual remove value';

    // Fill the field
    const targetInput = await canvas.findByRole('textbox', { name: 'Manual remove field' });
    await userEvent.clear(targetInput);
    await userEvent.type(targetInput, customValue);

    // Hide
    const triggerInput = await canvas.findByRole('textbox', { name: 'Type "hide" to hide everything' });
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Component handles hiding via @if — input not visible
    await expect(canvas.queryByRole('textbox', { name: 'Manual remove field' })).not.toBeInTheDocument();

    // Library should NOT have destroyed the component (manual handling)
    // The control should still be in the form model because the library didn't remove it
    await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
    await expect(getFormValue()['manualRemoveField']).toBe(customValue);

    // Show again
    await userEvent.clear(await canvas.findByRole('textbox', { name: 'Type "hide" to hide everything' }));

    // Value preserved
    await expect(await canvas.findByRole('textbox', { name: 'Manual remove field' })).toHaveValue(customValue);
  },
};
