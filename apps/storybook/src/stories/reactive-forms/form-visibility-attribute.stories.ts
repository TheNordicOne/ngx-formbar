import type { Meta, StoryObj } from '@storybook/angular';
import { expect, waitFor } from 'storybook/test';
import { NgxFbForm } from '@ngx-formbar/core';
import { ExampleControls } from '@ngx-formbar/examples';
import { StoryFormHostComponent } from './story-form-host.component';

const meta: Meta<StoryFormHostComponent> = {
  title: 'Reactive Forms/Visibility Strategies/Attribute',
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

// ---------------------------------------------------------------------------
// Group — Keep & Last (attribute hiding)
// ---------------------------------------------------------------------------

export const GroupKeepLast: Story = {
  name: 'Group — Keep & Last',
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
        hideMode: 'attribute',
      },
      keepLastGroup: {
        type: 'group',
        legend: 'Keep and use last value',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'keep',
        valueStrategy: 'last',
        hideMode: 'attribute',
        controls: {
          childField: {
            type: 'text',
            label: 'Child field',
            defaultValue: 'default-child',
            hideMode: 'attribute',
          },
          childDefaultField: {
            type: 'text',
            label: 'Child with default strategy',
            defaultValue: 'default-child-default',
            valueStrategy: 'default',
            hideMode: 'attribute',
          },
          childResetField: {
            type: 'text',
            label: 'Child with reset strategy',
            defaultValue: 'default-child-reset',
            valueStrategy: 'reset',
            hideMode: 'attribute',
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    // Fill fields with custom values
    await typeInField(canvas, userEvent, 'keepLastGroup-childField-input', 'Custom child value');
    await typeInField(canvas, userEvent, 'keepLastGroup-childDefaultField-input', 'Custom child default value');
    await typeInField(canvas, userEvent, 'keepLastGroup-childResetField-input', 'Custom child reset value');

    // Hide the group
    await typeInField(canvas, userEvent, 'hideControl-input', 'hide');

    // Group is hidden via [hidden] attribute but stays in the DOM
    await waitFor(async () => {
      await expect(canvas.getByTestId('keepLastGroup-title')).not.toBeVisible();
    });

    // Submit and check rendered values according to strategies
    await clickSubmit(canvas, userEvent);
    await waitFor(async () => {
      // Child inherits parent's last value strategy
      await expect(canvas.getByTestId('keepLastGroup.childField-value')).toHaveTextContent('Custom child value');

      // Child with default strategy overrides parent
      await expect(canvas.getByTestId('keepLastGroup.childDefaultField-value')).toHaveTextContent('default-child-default');

      // Child with reset strategy overrides parent (reset produces empty string)
      await expect(canvas.getByTestId('keepLastGroup.childResetField-value')).toHaveTextContent('');
    });

    // Show fields again
    await clearField(canvas, userEvent, 'hideControl-input');

    // Submit again and verify values are maintained
    await clickSubmit(canvas, userEvent);
    await waitFor(async () => {
      await expect(canvas.getByTestId('keepLastGroup.childField-value')).toHaveTextContent('Custom child value');
      await expect(canvas.getByTestId('keepLastGroup.childDefaultField-value')).toHaveTextContent('default-child-default');
      await expect(canvas.getByTestId('keepLastGroup.childResetField-value')).toHaveTextContent('');
    });
  },
};

// ---------------------------------------------------------------------------
// Group — Remove & Last (attribute hiding)
// ---------------------------------------------------------------------------

export const GroupRemoveLast: Story = {
  name: 'Group — Remove & Last',
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
        hideMode: 'attribute',
      },
      removeLastGroup: {
        type: 'group',
        legend: 'Remove but remember last value',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'remove',
        valueStrategy: 'last',
        hideMode: 'attribute',
        controls: {
          childField: {
            type: 'text',
            label: 'Child field',
            defaultValue: 'default-child',
            hideMode: 'attribute',
          },
          childDefaultField: {
            type: 'text',
            label: 'Child with default strategy',
            defaultValue: 'default-child-default',
            valueStrategy: 'default',
            hideMode: 'attribute',
          },
          childResetField: {
            type: 'text',
            label: 'Child with reset strategy',
            defaultValue: 'default-child-reset',
            valueStrategy: 'reset',
            hideMode: 'attribute',
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    // Fill fields with custom values
    await typeInField(canvas, userEvent, 'removeLastGroup-childField-input', 'Custom child value');
    await typeInField(canvas, userEvent, 'removeLastGroup-childDefaultField-input', 'Custom child default value');
    await typeInField(canvas, userEvent, 'removeLastGroup-childResetField-input', 'Custom child reset value');

    // Hide the group
    await typeInField(canvas, userEvent, 'hideControl-input', 'hide');

    // Group is hidden via [hidden] attribute but stays in the DOM
    await waitFor(async () => {
      await expect(canvas.getByTestId('removeLastGroup-title')).not.toBeVisible();
    });

    // Submit — group values should not exist in rendered output (remove strategy)
    await clickSubmit(canvas, userEvent);
    await waitFor(async () => {
      await expect(canvas.queryByTestId('removeLastGroup.childField-value')).not.toBeInTheDocument();
    });

    // Show fields again
    await clearField(canvas, userEvent, 'hideControl-input');

    // Submit and verify values are handled according to their strategies
    await clickSubmit(canvas, userEvent);
    await waitFor(async () => {
      // Child inherits parent's last value strategy
      await expect(canvas.getByTestId('removeLastGroup.childField-value')).toHaveTextContent('Custom child value');

      // Child with default strategy overrides parent
      await expect(canvas.getByTestId('removeLastGroup.childDefaultField-value')).toHaveTextContent('default-child-default');

      // Child with reset strategy overrides parent (reset produces empty string)
      await expect(canvas.getByTestId('removeLastGroup.childResetField-value')).toHaveTextContent('');
    });
  },
};

// ---------------------------------------------------------------------------
// Group — Remove & Default (attribute hiding)
// ---------------------------------------------------------------------------

export const GroupRemoveDefault: Story = {
  name: 'Group — Remove & Default',
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
        hideMode: 'attribute',
      },
      removeDefaultGroup: {
        type: 'group',
        legend: 'Remove but use default value',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'remove',
        valueStrategy: 'default',
        hideMode: 'attribute',
        controls: {
          childField: {
            type: 'text',
            label: 'Child field',
            defaultValue: 'default-child',
            hideMode: 'attribute',
          },
          childLastField: {
            type: 'text',
            label: 'Child with last strategy',
            defaultValue: 'default-child-last',
            valueStrategy: 'last',
            hideMode: 'attribute',
          },
          childResetField: {
            type: 'text',
            label: 'Child with reset strategy',
            defaultValue: 'default-child-reset',
            valueStrategy: 'reset',
            hideMode: 'attribute',
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    // Fill fields with custom values
    await typeInField(canvas, userEvent, 'removeDefaultGroup-childField-input', 'Custom child value');
    await typeInField(canvas, userEvent, 'removeDefaultGroup-childLastField-input', 'Custom child last value');
    await typeInField(canvas, userEvent, 'removeDefaultGroup-childResetField-input', 'Custom child reset value');

    // Hide the group
    await typeInField(canvas, userEvent, 'hideControl-input', 'hide');

    // Group is hidden via [hidden] attribute
    await waitFor(async () => {
      await expect(canvas.getByTestId('removeDefaultGroup-title')).not.toBeVisible();
    });

    // Submit — group values should not exist in rendered output (remove strategy)
    await clickSubmit(canvas, userEvent);
    await waitFor(async () => {
      await expect(canvas.queryByTestId('removeDefaultGroup.childField-value')).not.toBeInTheDocument();
    });

    // Show fields again
    await clearField(canvas, userEvent, 'hideControl-input');

    // Submit and verify values are handled according to their strategies
    await clickSubmit(canvas, userEvent);
    await waitFor(async () => {
      // Child inherits parent's default value strategy
      await expect(canvas.getByTestId('removeDefaultGroup.childField-value')).toHaveTextContent('default-child');

      // Child with last strategy overrides parent
      await expect(canvas.getByTestId('removeDefaultGroup.childLastField-value')).toHaveTextContent('Custom child last value');

      // Child with reset strategy overrides parent (reset produces empty string)
      await expect(canvas.getByTestId('removeDefaultGroup.childResetField-value')).toHaveTextContent('');
    });
  },
};

// ---------------------------------------------------------------------------
// Group — Remove & Reset (attribute hiding)
// ---------------------------------------------------------------------------

export const GroupRemoveReset: Story = {
  name: 'Group — Remove & Reset',
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
        hideMode: 'attribute',
      },
      removeResetGroup: {
        type: 'group',
        legend: 'Remove and reset value',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'remove',
        valueStrategy: 'reset',
        hideMode: 'attribute',
        controls: {
          childField: {
            type: 'text',
            label: 'Child field',
            defaultValue: 'default-child',
            hideMode: 'attribute',
          },
          childLastField: {
            type: 'text',
            label: 'Child with last strategy',
            defaultValue: 'default-child-last',
            valueStrategy: 'last',
            hideMode: 'attribute',
          },
          childDefaultField: {
            type: 'text',
            label: 'Child with default strategy',
            defaultValue: 'default-child-default',
            valueStrategy: 'default',
            hideMode: 'attribute',
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    // Fill fields with custom values
    await typeInField(canvas, userEvent, 'removeResetGroup-childField-input', 'Custom child value');
    await typeInField(canvas, userEvent, 'removeResetGroup-childLastField-input', 'Custom child last value');
    await typeInField(canvas, userEvent, 'removeResetGroup-childDefaultField-input', 'Custom child default value');

    // Hide the group
    await typeInField(canvas, userEvent, 'hideControl-input', 'hide');

    // Group is hidden via [hidden] attribute
    await waitFor(async () => {
      await expect(canvas.getByTestId('removeResetGroup-title')).not.toBeVisible();
    });

    // Submit — group values should not exist in rendered output (remove strategy)
    await clickSubmit(canvas, userEvent);
    await waitFor(async () => {
      await expect(canvas.queryByTestId('removeResetGroup.childField-value')).not.toBeInTheDocument();
    });

    // Show fields again
    await clearField(canvas, userEvent, 'hideControl-input');

    // Submit and verify values are handled according to their strategies
    await clickSubmit(canvas, userEvent);
    await waitFor(async () => {
      // Child inherits parent's reset value strategy (reset produces empty string)
      await expect(canvas.getByTestId('removeResetGroup.childField-value')).toHaveTextContent('');

      // Child with last strategy overrides parent
      await expect(canvas.getByTestId('removeResetGroup.childLastField-value')).toHaveTextContent('Custom child last value');

      // Child with default strategy overrides parent
      await expect(canvas.getByTestId('removeResetGroup.childDefaultField-value')).toHaveTextContent('default-child-default');
    });
  },
};
