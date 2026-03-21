import type { Meta, StoryObj } from '@storybook/angular';
import { expect, waitFor } from 'storybook/test';
import { NgxFbForm } from '@ngx-formbar/core';
import { ExampleControls } from '@ngx-formbar/examples';
import { StoryFormHostComponent } from './story-form-host.component';

const meta: Meta<StoryFormHostComponent> = {
  title: 'Reactive Forms/Visibility Strategies',
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

// ---------------------------------------------------------------------------
// Group-level stories
// ---------------------------------------------------------------------------

export const GroupKeepLast: Story = {
  name: 'Group — Keep & Last',
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      keepLastGroup: {
        type: 'group',
        legend: 'Keep and use last value',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'keep',
        valueStrategy: 'last',
        controls: {
          childField: {
            type: 'text',
            label: 'Child field',
            defaultValue: 'default-child',
          },
          childDefaultField: {
            type: 'text',
            label: 'Child with default strategy',
            defaultValue: 'default-child-default',
            valueStrategy: 'default',
          },
          childResetField: {
            type: 'text',
            label: 'Child with reset strategy',
            defaultValue: 'default-child-reset',
            valueStrategy: 'reset',
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    // Fill fields with custom values
    await typeInField(canvas, userEvent, 'childField-input', 'Custom child value');
    await typeInField(canvas, userEvent, 'childDefaultField-input', 'Custom child default value');
    await typeInField(canvas, userEvent, 'childResetField-input', 'Custom child reset value');

    // Hide the group
    await typeInField(canvas, userEvent, 'hideControl-input', 'hide');

    // Verify group is hidden
    await waitFor(async () => {
      await expect(canvas.queryByTestId('childField-input')).not.toBeInTheDocument();
    });

    // Submit and check values according to strategies
    await clickSubmit(canvas, userEvent);
    await waitFor(async () => {
      const formValue = getFormValue();
      const group = formValue['keepLastGroup'] as Record<string, unknown>;

      // Child inherits parent's last value strategy
      await expect(group['childField']).toBe('Custom child value');

      // Child with default strategy overrides parent
      await expect(group['childDefaultField']).toBe('default-child-default');

      // Child with reset strategy overrides parent
      await expect(group['childResetField']).toBe(null);
    });

    // Show fields again
    await clearField(canvas, userEvent, 'hideControl-input');

    // Verify values are maintained after showing
    await waitFor(async () => {
      const formValue = getFormValue();
      const group = formValue['keepLastGroup'] as Record<string, unknown>;
      await expect(group['childField']).toBe('Custom child value');
      await expect(group['childDefaultField']).toBe('default-child-default');
      await expect(group['childResetField']).toBe(null);
    });
  },
};

export const GroupRemoveLast: Story = {
  name: 'Group — Remove & Last',
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      removeLastGroup: {
        type: 'group',
        legend: 'Remove but remember last value',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'remove',
        valueStrategy: 'last',
        controls: {
          childField: {
            type: 'text',
            label: 'Child field',
            defaultValue: 'default-child',
          },
          childDefaultField: {
            type: 'text',
            label: 'Child with default strategy',
            defaultValue: 'default-child-default',
            valueStrategy: 'default',
          },
          childResetField: {
            type: 'text',
            label: 'Child with reset strategy',
            defaultValue: 'default-child-reset',
            valueStrategy: 'reset',
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    // Fill fields with custom values
    await typeInField(canvas, userEvent, 'childField-input', 'Custom child value');
    await typeInField(canvas, userEvent, 'childDefaultField-input', 'Custom child default value');
    await typeInField(canvas, userEvent, 'childResetField-input', 'Custom child reset value');

    // Hide the group
    await typeInField(canvas, userEvent, 'hideControl-input', 'hide');

    // Verify group is removed from DOM
    await waitFor(async () => {
      await expect(canvas.queryByTestId('childField-input')).not.toBeInTheDocument();
    });

    // Group and all child values are not in the form value when hidden
    await clickSubmit(canvas, userEvent);
    await waitFor(async () => {
      const formValue = getFormValue();
      await expect(formValue['removeLastGroup']).toBeUndefined();
    });

    // Show fields again
    await clearField(canvas, userEvent, 'hideControl-input');

    // Verify values are handled according to their strategies after showing
    await waitFor(async () => {
      const formValue = getFormValue();
      const group = formValue['removeLastGroup'] as Record<string, unknown>;

      // Child inherits parent's last value strategy
      await expect(group['childField']).toBe('Custom child value');

      // Child with default strategy overrides parent
      await expect(group['childDefaultField']).toBe('default-child-default');

      // Child with reset strategy overrides parent
      await expect(group['childResetField']).toBe(null);
    });
  },
};

export const GroupRemoveDefault: Story = {
  name: 'Group — Remove & Default',
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      removeDefaultGroup: {
        type: 'group',
        legend: 'Remove but use default value',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'remove',
        valueStrategy: 'default',
        controls: {
          childField: {
            type: 'text',
            label: 'Child field',
            defaultValue: 'default-child',
          },
          childLastField: {
            type: 'text',
            label: 'Child with last strategy',
            defaultValue: 'default-child-last',
            valueStrategy: 'last',
          },
          childResetField: {
            type: 'text',
            label: 'Child with reset strategy',
            defaultValue: 'default-child-reset',
            valueStrategy: 'reset',
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    // Fill fields with custom values
    await typeInField(canvas, userEvent, 'childField-input', 'Custom child value');
    await typeInField(canvas, userEvent, 'childLastField-input', 'Custom child last value');
    await typeInField(canvas, userEvent, 'childResetField-input', 'Custom child reset value');

    // Hide the group
    await typeInField(canvas, userEvent, 'hideControl-input', 'hide');

    // Verify group is removed from DOM
    await waitFor(async () => {
      await expect(canvas.queryByTestId('childField-input')).not.toBeInTheDocument();
    });

    // Group and all child values are not in the form value when hidden
    await clickSubmit(canvas, userEvent);
    await waitFor(async () => {
      const formValue = getFormValue();
      await expect(formValue['removeDefaultGroup']).toBeUndefined();
    });

    // Show fields again
    await clearField(canvas, userEvent, 'hideControl-input');

    // Verify values are handled according to their strategies after showing
    await waitFor(async () => {
      const formValue = getFormValue();
      const group = formValue['removeDefaultGroup'] as Record<string, unknown>;

      // Child inherits parent's default value strategy
      await expect(group['childField']).toBe('default-child');

      // Child with last strategy overrides parent
      await expect(group['childLastField']).toBe('Custom child last value');

      // Child with reset strategy overrides parent
      await expect(group['childResetField']).toBe(null);
    });
  },
};

export const GroupRemoveReset: Story = {
  name: 'Group — Remove & Reset',
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      removeResetGroup: {
        type: 'group',
        legend: 'Remove and reset value',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'remove',
        valueStrategy: 'reset',
        controls: {
          childField: {
            type: 'text',
            label: 'Child field',
            defaultValue: 'default-child',
          },
          childLastField: {
            type: 'text',
            label: 'Child with last strategy',
            defaultValue: 'default-child-last',
            valueStrategy: 'last',
          },
          childDefaultField: {
            type: 'text',
            label: 'Child with default strategy',
            defaultValue: 'default-child-default',
            valueStrategy: 'default',
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    // Fill fields with custom values
    await typeInField(canvas, userEvent, 'childField-input', 'Custom child value');
    await typeInField(canvas, userEvent, 'childLastField-input', 'Custom child last value');
    await typeInField(canvas, userEvent, 'childDefaultField-input', 'Custom child default value');

    // Hide the group
    await typeInField(canvas, userEvent, 'hideControl-input', 'hide');

    // Verify group is removed from DOM
    await waitFor(async () => {
      await expect(canvas.queryByTestId('childField-input')).not.toBeInTheDocument();
    });

    // Group and all child values are not in the form value when hidden
    await clickSubmit(canvas, userEvent);
    await waitFor(async () => {
      const formValue = getFormValue();
      await expect(formValue['removeResetGroup']).toBeUndefined();
    });

    // Show fields again
    await clearField(canvas, userEvent, 'hideControl-input');

    // Verify values are handled according to their strategies after showing
    await waitFor(async () => {
      const formValue = getFormValue();
      const group = formValue['removeResetGroup'] as Record<string, unknown>;

      // Child inherits parent's reset value strategy
      await expect(group['childField']).toBe(null);

      // Child with last strategy overrides parent
      await expect(group['childLastField']).toBe('Custom child last value');

      // Child with default strategy overrides parent
      await expect(group['childDefaultField']).toBe('default-child-default');
    });
  },
};
