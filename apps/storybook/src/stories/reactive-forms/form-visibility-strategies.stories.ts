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

async function typeInField(
  canvas: any,
  userEvent: any,
  testId: string,
  value: string,
) {
  const input = canvas.getByTestId(testId);
  await userEvent.clear(input);
  await userEvent.type(input, value);
}

async function clearField(canvas: any, userEvent: any, testId: string) {
  const input = canvas.getByTestId(testId);
  await userEvent.clear(input);
}

async function clickSubmit(canvas: any, userEvent: any) {
  await userEvent.click(canvas.getByTestId('submit'));
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
    await typeInField(canvas, userEvent, 'keepLastField-input', customValue);

    // Hide the field
    await typeInField(canvas, userEvent, 'hideControl-input', 'hide');

    // Verify field is hidden
    await waitFor(async () => {
      await expect(canvas.queryByTestId('keepLastField-input')).not.toBeInTheDocument();
    });

    // Value is preserved in the form model (keep strategy)
    await clickSubmit(canvas, userEvent);
    await waitFor(async () => {
      await expect(getFormValue()['keepLastField']).toBe(customValue);
    });

    // Show field again
    await clearField(canvas, userEvent, 'hideControl-input');

    // Verify field appears with the last value
    await waitFor(async () => {
      await expect(canvas.getByTestId('keepLastField-input')).toHaveValue(customValue);
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
    await typeInField(canvas, userEvent, 'removeLastField-input', customValue);

    // Hide the field
    await typeInField(canvas, userEvent, 'hideControl-input', 'hide');

    // Verify field is removed from DOM
    await waitFor(async () => {
      await expect(canvas.queryByTestId('removeLastField-input')).not.toBeInTheDocument();
    });

    // Value is not in the form model when hidden (remove strategy)
    await clickSubmit(canvas, userEvent);
    await waitFor(async () => {
      await expect(getFormValue()['removeLastField']).toBeUndefined();
    });

    // Show field again
    await clearField(canvas, userEvent, 'hideControl-input');

    // Verify field appears with the last value
    await waitFor(async () => {
      await expect(canvas.getByTestId('removeLastField-input')).toHaveValue(customValue);
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
    await typeInField(canvas, userEvent, 'removeDefaultField-input', customValue);

    // Hide the field
    await typeInField(canvas, userEvent, 'hideControl-input', 'hide');

    // Verify field is removed from DOM
    await waitFor(async () => {
      await expect(canvas.queryByTestId('removeDefaultField-input')).not.toBeInTheDocument();
    });

    // Value is not in the form model when hidden
    await clickSubmit(canvas, userEvent);
    await waitFor(async () => {
      await expect(getFormValue()['removeDefaultField']).toBeUndefined();
    });

    // Show field again
    await clearField(canvas, userEvent, 'hideControl-input');

    // Verify field appears with the default value
    await waitFor(async () => {
      await expect(canvas.getByTestId('removeDefaultField-input')).toHaveValue(defaultValue);
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
    await typeInField(canvas, userEvent, 'removeResetField-input', customValue);

    // Hide the field
    await typeInField(canvas, userEvent, 'hideControl-input', 'hide');

    // Verify field is removed from DOM
    await waitFor(async () => {
      await expect(canvas.queryByTestId('removeResetField-input')).not.toBeInTheDocument();
    });

    // Value is not in the form model when hidden
    await clickSubmit(canvas, userEvent);
    await waitFor(async () => {
      await expect(getFormValue()['removeResetField']).toBeUndefined();
    });

    // Show field again
    await clearField(canvas, userEvent, 'hideControl-input');

    // Verify field appears with empty value (reset to null)
    await waitFor(async () => {
      await expect(canvas.getByTestId('removeResetField-input')).toHaveValue('');
    });
  },
};

