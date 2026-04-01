import type { Meta, StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
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

// ---------------------------------------------------------------------------
// Group — Keep & Last (attribute hiding)
// ---------------------------------------------------------------------------

export const GroupKeepLast: Story = {
  name: 'Group — Keep & Last',
  parameters: {
    docs: { description: { story: 'Keep strategy with last value — group stays in DOM, values preserved.' } },
  },
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
    const triggerInput = await canvas.findByRole('textbox', { name: 'Type "hide" to hide everything' });
    const childField = await canvas.findByRole('textbox', { name: 'Child field' });
    const childDefaultField = await canvas.findByRole('textbox', { name: 'Child with default strategy' });
    const childResetField = await canvas.findByRole('textbox', { name: 'Child with reset strategy' });

    // Fill fields with custom values
    await userEvent.clear(childField);
    await userEvent.type(childField, 'Custom child value');
    await userEvent.clear(childDefaultField);
    await userEvent.type(childDefaultField, 'Custom child default value');
    await userEvent.clear(childResetField);
    await userEvent.type(childResetField, 'Custom child reset value');

    // Hide the group
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Group is hidden via [hidden] attribute but stays in the DOM
    await expect(await canvas.findByText('Keep and use last value')).not.toBeVisible();

    // Submit and check rendered values according to strategies
    await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
    // Child inherits parent's last value strategy
    await expect(await canvas.findByTestId('keepLastGroup.childField-value')).toHaveTextContent('Custom child value');

    // Child with default strategy overrides parent
    await expect(await canvas.findByTestId('keepLastGroup.childDefaultField-value')).toHaveTextContent('default-child-default');

    // Child with reset strategy overrides parent (reset produces empty string)
    await expect(await canvas.findByTestId('keepLastGroup.childResetField-value')).toHaveTextContent('');

    // Show fields again
    await userEvent.clear(triggerInput);

    // Submit again and verify values are maintained
    await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
    await expect(await canvas.findByTestId('keepLastGroup.childField-value')).toHaveTextContent('Custom child value');
    await expect(await canvas.findByTestId('keepLastGroup.childDefaultField-value')).toHaveTextContent('default-child-default');
    await expect(await canvas.findByTestId('keepLastGroup.childResetField-value')).toHaveTextContent('');
  },
};

// ---------------------------------------------------------------------------
// Group — Remove & Last (attribute hiding)
// ---------------------------------------------------------------------------

export const GroupRemoveLast: Story = {
  name: 'Group — Remove & Last',
  parameters: {
    docs: { description: { story: 'Remove strategy with last value — group removed, values restored on show.' } },
  },
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
    const triggerInput = await canvas.findByRole('textbox', { name: 'Type "hide" to hide everything' });
    const childField = await canvas.findByRole('textbox', { name: 'Child field' });
    const childDefaultField = await canvas.findByRole('textbox', { name: 'Child with default strategy' });
    const childResetField = await canvas.findByRole('textbox', { name: 'Child with reset strategy' });

    // Fill fields with custom values
    await userEvent.clear(childField);
    await userEvent.type(childField, 'Custom child value');
    await userEvent.clear(childDefaultField);
    await userEvent.type(childDefaultField, 'Custom child default value');
    await userEvent.clear(childResetField);
    await userEvent.type(childResetField, 'Custom child reset value');

    // Hide the group
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Group is hidden via [hidden] attribute but stays in the DOM
    await expect(await canvas.findByText('Remove but remember last value')).not.toBeVisible();

    // Submit — group values should not exist in rendered output (remove strategy)
    await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
    await expect(canvas.queryByTestId('removeLastGroup.childField-value')).not.toBeInTheDocument();

    // Show fields again
    await userEvent.clear(triggerInput);

    // Submit and verify values are handled according to their strategies
    await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
    // Child inherits parent's last value strategy
    await expect(await canvas.findByTestId('removeLastGroup.childField-value')).toHaveTextContent('Custom child value');

    // Child with default strategy overrides parent
    await expect(await canvas.findByTestId('removeLastGroup.childDefaultField-value')).toHaveTextContent('default-child-default');

    // Child with reset strategy overrides parent (reset produces empty string)
    await expect(await canvas.findByTestId('removeLastGroup.childResetField-value')).toHaveTextContent('');
  },
};

// ---------------------------------------------------------------------------
// Group — Remove & Default (attribute hiding)
// ---------------------------------------------------------------------------

export const GroupRemoveDefault: Story = {
  name: 'Group — Remove & Default',
  parameters: {
    docs: { description: { story: 'Remove strategy with default value — reverts to defaults on show.' } },
  },
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
    const triggerInput = await canvas.findByRole('textbox', { name: 'Type "hide" to hide everything' });
    const childField = await canvas.findByRole('textbox', { name: 'Child field' });
    const childLastField = await canvas.findByRole('textbox', { name: 'Child with last strategy' });
    const childResetField = await canvas.findByRole('textbox', { name: 'Child with reset strategy' });

    // Fill fields with custom values
    await userEvent.clear(childField);
    await userEvent.type(childField, 'Custom child value');
    await userEvent.clear(childLastField);
    await userEvent.type(childLastField, 'Custom child last value');
    await userEvent.clear(childResetField);
    await userEvent.type(childResetField, 'Custom child reset value');

    // Hide the group
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Group is hidden via [hidden] attribute
    await expect(await canvas.findByText('Remove but use default value')).not.toBeVisible();

    // Submit — group values should not exist in rendered output (remove strategy)
    await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
    await expect(canvas.queryByTestId('removeDefaultGroup.childField-value')).not.toBeInTheDocument();

    // Show fields again
    await userEvent.clear(triggerInput);

    // Submit and verify values are handled according to their strategies
    await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
    // Child inherits parent's default value strategy
    await expect(await canvas.findByTestId('removeDefaultGroup.childField-value')).toHaveTextContent('default-child');

    // Child with last strategy overrides parent
    await expect(await canvas.findByTestId('removeDefaultGroup.childLastField-value')).toHaveTextContent('Custom child last value');

    // Child with reset strategy overrides parent (reset produces empty string)
    await expect(await canvas.findByTestId('removeDefaultGroup.childResetField-value')).toHaveTextContent('');
  },
};

// ---------------------------------------------------------------------------
// Group — Remove & Reset (attribute hiding)
// ---------------------------------------------------------------------------

export const GroupRemoveReset: Story = {
  name: 'Group — Remove & Reset',
  parameters: {
    docs: { description: { story: 'Remove strategy with reset — clears values on show.' } },
  },
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
    const triggerInput = await canvas.findByRole('textbox', { name: 'Type "hide" to hide everything' });
    const childField = await canvas.findByRole('textbox', { name: 'Child field' });
    const childLastField = await canvas.findByRole('textbox', { name: 'Child with last strategy' });
    const childDefaultField = await canvas.findByRole('textbox', { name: 'Child with default strategy' });

    // Fill fields with custom values
    await userEvent.clear(childField);
    await userEvent.type(childField, 'Custom child value');
    await userEvent.clear(childLastField);
    await userEvent.type(childLastField, 'Custom child last value');
    await userEvent.clear(childDefaultField);
    await userEvent.type(childDefaultField, 'Custom child default value');

    // Hide the group
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Group is hidden via [hidden] attribute
    await expect(await canvas.findByText('Remove and reset value')).not.toBeVisible();

    // Submit — group values should not exist in rendered output (remove strategy)
    await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
    await expect(canvas.queryByTestId('removeResetGroup.childField-value')).not.toBeInTheDocument();

    // Show fields again
    await userEvent.clear(triggerInput);

    // Submit and verify values are handled according to their strategies
    await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
    // Child inherits parent's reset value strategy (reset produces empty string)
    await expect(await canvas.findByTestId('removeResetGroup.childField-value')).toHaveTextContent('');

    // Child with last strategy overrides parent
    await expect(await canvas.findByTestId('removeResetGroup.childLastField-value')).toHaveTextContent('Custom child last value');

    // Child with default strategy overrides parent
    await expect(await canvas.findByTestId('removeResetGroup.childDefaultField-value')).toHaveTextContent('default-child-default');
  },
};

// ---------------------------------------------------------------------------
// Group — Keep & Default (attribute hiding)
// ---------------------------------------------------------------------------

export const GroupKeepDefault: Story = {
  name: 'Group — Keep & Default',
  parameters: {
    docs: { description: { story: 'Keep strategy with default value — reverts to defaults when hidden.' } },
  },
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
        hideMode: 'attribute',
      },
      keepDefaultGroup: {
        type: 'group',
        legend: 'Keep but use default value',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'keep',
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
    const triggerInput = await canvas.findByRole('textbox', { name: 'Type "hide" to hide everything' });
    const childField = await canvas.findByRole('textbox', { name: 'Child field' });
    const childLastField = await canvas.findByRole('textbox', { name: 'Child with last strategy' });
    const childResetField = await canvas.findByRole('textbox', { name: 'Child with reset strategy' });

    // Fill fields with custom values
    await userEvent.clear(childField);
    await userEvent.type(childField, 'Custom child value');
    await userEvent.clear(childLastField);
    await userEvent.type(childLastField, 'Custom child last value');
    await userEvent.clear(childResetField);
    await userEvent.type(childResetField, 'Custom child reset value');

    // Hide the group
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Group is hidden via [hidden] attribute but stays in the DOM
    await expect(await canvas.findByText('Keep but use default value')).not.toBeVisible();

    // Submit and check rendered values according to strategies
    await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
    // Child inherits parent's default value strategy
    await expect(await canvas.findByTestId('keepDefaultGroup.childField-value')).toHaveTextContent('default-child');

    // Child with last strategy overrides parent
    await expect(await canvas.findByTestId('keepDefaultGroup.childLastField-value')).toHaveTextContent('Custom child last value');

    // Child with reset strategy overrides parent (reset produces empty string)
    await expect(await canvas.findByTestId('keepDefaultGroup.childResetField-value')).toHaveTextContent('');

    // Show fields again
    await userEvent.clear(triggerInput);

    // Submit again and verify values are maintained
    await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
    await expect(await canvas.findByTestId('keepDefaultGroup.childField-value')).toHaveTextContent('default-child');
    await expect(await canvas.findByTestId('keepDefaultGroup.childLastField-value')).toHaveTextContent('Custom child last value');
    await expect(await canvas.findByTestId('keepDefaultGroup.childResetField-value')).toHaveTextContent('');
  },
};

// ---------------------------------------------------------------------------
// Group — Keep & Reset (attribute hiding)
// ---------------------------------------------------------------------------

export const GroupKeepReset: Story = {
  name: 'Group — Keep & Reset',
  parameters: {
    docs: { description: { story: 'Keep strategy with reset — clears values when hidden.' } },
  },
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
        hideMode: 'attribute',
      },
      keepResetGroup: {
        type: 'group',
        legend: 'Keep but reset value',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'keep',
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
    const triggerInput = await canvas.findByRole('textbox', { name: 'Type "hide" to hide everything' });
    const childField = await canvas.findByRole('textbox', { name: 'Child field' });
    const childLastField = await canvas.findByRole('textbox', { name: 'Child with last strategy' });
    const childDefaultField = await canvas.findByRole('textbox', { name: 'Child with default strategy' });

    // Fill fields with custom values
    await userEvent.clear(childField);
    await userEvent.type(childField, 'Custom child value');
    await userEvent.clear(childLastField);
    await userEvent.type(childLastField, 'Custom child last value');
    await userEvent.clear(childDefaultField);
    await userEvent.type(childDefaultField, 'Custom child default value');

    // Hide the group
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Group is hidden via [hidden] attribute but stays in the DOM
    await expect(await canvas.findByText('Keep but reset value')).not.toBeVisible();

    // Submit and check rendered values according to strategies
    await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
    // Child inherits parent's reset value strategy (reset produces empty string)
    await expect(await canvas.findByTestId('keepResetGroup.childField-value')).toHaveTextContent('');

    // Child with last strategy overrides parent
    await expect(await canvas.findByTestId('keepResetGroup.childLastField-value')).toHaveTextContent('Custom child last value');

    // Child with default strategy overrides parent
    await expect(await canvas.findByTestId('keepResetGroup.childDefaultField-value')).toHaveTextContent('default-child-default');

    // Show fields again
    await userEvent.clear(triggerInput);

    // Submit again and verify values are maintained
    await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
    await expect(await canvas.findByTestId('keepResetGroup.childField-value')).toHaveTextContent('');
    await expect(await canvas.findByTestId('keepResetGroup.childLastField-value')).toHaveTextContent('Custom child last value');
    await expect(await canvas.findByTestId('keepResetGroup.childDefaultField-value')).toHaveTextContent('default-child-default');
  },
};

// ---------------------------------------------------------------------------
// Parent Remove Precedence (attribute hiding)
// ---------------------------------------------------------------------------

export const ParentRemovePrecedence: Story = {
  name: 'Group — Parent Remove Precedence',
  parameters: {
    docs: { description: { story: 'Parent remove strategy takes precedence over child keep.' } },
  },
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
        hideMode: 'attribute',
      },
      parentRemove: {
        type: 'group',
        legend: 'Parent with Remove Strategy',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'remove',
        valueStrategy: 'last',
        hideMode: 'attribute',
        controls: {
          parentRemoveField: {
            type: 'text',
            label: 'Parent field',
            defaultValue: 'default-parent',
            hideMode: 'attribute',
          },
          childKeep: {
            type: 'group',
            legend: 'Child with Keep Strategy (will be ignored)',
            hideStrategy: 'keep',
            valueStrategy: 'last',
            hideMode: 'attribute',
            controls: {
              childKeepField: {
                type: 'text',
                label: 'Child field',
                defaultValue: 'default-child',
                hideMode: 'attribute',
              },
            },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const triggerInput = await canvas.findByRole('textbox', { name: 'Type "hide" to hide everything' });
    const parentField = await canvas.findByRole('textbox', { name: 'Parent field' });
    const childField = await canvas.findByRole('textbox', { name: 'Child field' });

    // Fill fields with custom values
    await userEvent.clear(parentField);
    await userEvent.type(parentField, 'Custom parent value');
    await userEvent.clear(childField);
    await userEvent.type(childField, 'Custom child value');

    // Hide the group
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Group is hidden via [hidden] attribute
    await expect(await canvas.findByText('Parent with Remove Strategy')).not.toBeVisible();

    // Submit — group values should not exist in rendered output (remove strategy)
    await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
    await expect(canvas.queryByTestId('parentRemove.parentRemoveField-value')).not.toBeInTheDocument();
    await expect(canvas.queryByTestId('parentRemove.childKeep.childKeepField-value')).not.toBeInTheDocument();

    // Show fields again
    await userEvent.clear(triggerInput);

    // Submit and verify values are restored with 'last' strategy
    await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
    await expect(await canvas.findByTestId('parentRemove.parentRemoveField-value')).toHaveTextContent('Custom parent value');
    await expect(await canvas.findByTestId('parentRemove.childKeep.childKeepField-value')).toHaveTextContent('Custom child value');
  },
};

// ---------------------------------------------------------------------------
// Inherited Strategies (attribute hiding)
// ---------------------------------------------------------------------------

export const InheritedStrategies: Story = {
  name: 'Group — Inherited Strategies',
  parameters: {
    docs: { description: { story: 'Child group inherits parent\'s keep & last strategies.' } },
  },
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
        hideMode: 'attribute',
      },
      parentGroup: {
        type: 'group',
        legend: 'Parent Group - Keep & Last',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'keep',
        valueStrategy: 'last',
        hideMode: 'attribute',
        controls: {
          parentField: {
            type: 'text',
            label: 'Parent field',
            defaultValue: 'default-parent',
            hideMode: 'attribute',
          },
          childGroup: {
            type: 'group',
            legend: 'Child Group - No Strategy Override',
            hideMode: 'attribute',
            controls: {
              childField: {
                type: 'text',
                label: 'Child field',
                defaultValue: 'default-child',
                hideMode: 'attribute',
              },
            },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const triggerInput = await canvas.findByRole('textbox', { name: 'Type "hide" to hide everything' });
    const parentField = await canvas.findByRole('textbox', { name: 'Parent field' });
    const childField = await canvas.findByRole('textbox', { name: 'Child field' });

    // Fill fields with custom values
    await userEvent.clear(parentField);
    await userEvent.type(parentField, 'Custom parent value');
    await userEvent.clear(childField);
    await userEvent.type(childField, 'Custom child value');

    // Hide the group
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Group is hidden via [hidden] attribute but stays in the DOM
    await expect(await canvas.findByText('Parent Group - Keep & Last')).not.toBeVisible();

    // Submit and check rendered values — both keep last (custom values)
    await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
    await expect(await canvas.findByTestId('parentGroup.parentField-value')).toHaveTextContent('Custom parent value');
    await expect(await canvas.findByTestId('parentGroup.childGroup.childField-value')).toHaveTextContent('Custom child value');

    // Show fields again
    await userEvent.clear(triggerInput);

    // Submit again and verify values are maintained
    await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
    await expect(await canvas.findByTestId('parentGroup.parentField-value')).toHaveTextContent('Custom parent value');
    await expect(await canvas.findByTestId('parentGroup.childGroup.childField-value')).toHaveTextContent('Custom child value');
  },
};

// ---------------------------------------------------------------------------
// Strategy Override (attribute hiding)
// ---------------------------------------------------------------------------

export const StrategyOverride: Story = {
  name: 'Group — Strategy Override',
  parameters: {
    docs: { description: { story: 'Child group overrides parent\'s value strategy.' } },
  },
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
        hideMode: 'attribute',
      },
      parentGroup: {
        type: 'group',
        legend: 'Parent Group - Keep & Last',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'keep',
        valueStrategy: 'last',
        hideMode: 'attribute',
        controls: {
          parentField: {
            type: 'text',
            label: 'Parent field',
            defaultValue: 'default-parent',
            hideMode: 'attribute',
          },
          childGroup: {
            type: 'group',
            legend: 'Child Group - With Strategy Override',
            valueStrategy: 'default',
            hideMode: 'attribute',
            controls: {
              childField: {
                type: 'text',
                label: 'Child field',
                defaultValue: 'default-child',
                hideMode: 'attribute',
              },
            },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const triggerInput = await canvas.findByRole('textbox', { name: 'Type "hide" to hide everything' });
    const parentField = await canvas.findByRole('textbox', { name: 'Parent field' });
    const childField = await canvas.findByRole('textbox', { name: 'Child field' });

    // Fill fields with custom values
    await userEvent.clear(parentField);
    await userEvent.type(parentField, 'Custom parent value');
    await userEvent.clear(childField);
    await userEvent.type(childField, 'Custom child value');

    // Hide the group
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Group is hidden via [hidden] attribute but stays in the DOM
    await expect(await canvas.findByText('Parent Group - Keep & Last')).not.toBeVisible();

    // Submit and check rendered values
    await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
    // Parent keeps last (custom value)
    await expect(await canvas.findByTestId('parentGroup.parentField-value')).toHaveTextContent('Custom parent value');

    // Child reverts to default (overrides parent's last strategy)
    await expect(await canvas.findByTestId('parentGroup.childGroup.childField-value')).toHaveTextContent('default-child');

    // Show fields again
    await userEvent.clear(triggerInput);

    // Submit again and verify values are maintained
    await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
    await expect(await canvas.findByTestId('parentGroup.parentField-value')).toHaveTextContent('Custom parent value');
    await expect(await canvas.findByTestId('parentGroup.childGroup.childField-value')).toHaveTextContent('default-child');
  },
};

// ---------------------------------------------------------------------------
// Three-Level Inheritance (attribute hiding)
// ---------------------------------------------------------------------------

export const ThreeLevelInheritance: Story = {
  name: 'Group — Three-Level Inheritance',
  parameters: {
    docs: { description: { story: 'Three-level hierarchy with strategy overrides at each level.' } },
  },
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
        hideMode: 'attribute',
      },
      grandparentGroup: {
        type: 'group',
        legend: 'Grandparent Group - Keep & Default',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'keep',
        valueStrategy: 'default',
        hideMode: 'attribute',
        controls: {
          grandparentField: {
            type: 'text',
            label: 'Grandparent field',
            defaultValue: 'default-grandparent',
            hideMode: 'attribute',
          },
          parentGroup: {
            type: 'group',
            legend: 'Parent Group - Override to Last',
            valueStrategy: 'last',
            hideMode: 'attribute',
            controls: {
              parentField: {
                type: 'text',
                label: 'Parent field',
                defaultValue: 'default-parent',
                hideMode: 'attribute',
              },
              childGroup: {
                type: 'group',
                legend: 'Child Group - No Strategy Override',
                hideMode: 'attribute',
                controls: {
                  childField: {
                    type: 'text',
                    label: 'Child field',
                    defaultValue: 'default-child',
                    hideMode: 'attribute',
                  },
                },
              },
              childGroupWithOverride: {
                type: 'group',
                legend: 'Child Group - Reset Override',
                valueStrategy: 'reset',
                hideMode: 'attribute',
                controls: {
                  childOverrideField: {
                    type: 'text',
                    label: 'Child override field',
                    defaultValue: 'default-child-override',
                    hideMode: 'attribute',
                  },
                },
              },
            },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const triggerInput = await canvas.findByRole('textbox', { name: 'Type "hide" to hide everything' });
    const grandparentField = await canvas.findByRole('textbox', { name: 'Grandparent field' });
    const parentField = await canvas.findByRole('textbox', { name: 'Parent field' });
    const childField = await canvas.findByRole('textbox', { name: 'Child field' });
    const childOverrideField = await canvas.findByRole('textbox', { name: 'Child override field' });

    // Fill all fields with custom values
    await userEvent.clear(grandparentField);
    await userEvent.type(grandparentField, 'Custom grandparent value');
    await userEvent.clear(parentField);
    await userEvent.type(parentField, 'Custom parent value');
    await userEvent.clear(childField);
    await userEvent.type(childField, 'Custom child value');
    await userEvent.clear(childOverrideField);
    await userEvent.type(childOverrideField, 'Custom child override value');

    // Hide the group
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Group is hidden via [hidden] attribute but stays in the DOM
    await expect(await canvas.findByText('Grandparent Group - Keep & Default')).not.toBeVisible();

    // Submit and check rendered values according to strategies
    await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
    // Grandparent field uses grandparent's default strategy
    await expect(await canvas.findByTestId('grandparentGroup.grandparentField-value')).toHaveTextContent('default-grandparent');

    // Parent field uses parent's last strategy (overrides grandparent's default)
    await expect(await canvas.findByTestId('grandparentGroup.parentGroup.parentField-value')).toHaveTextContent('Custom parent value');

    // Child field inherits parent's last strategy
    await expect(await canvas.findByTestId('grandparentGroup.parentGroup.childGroup.childField-value')).toHaveTextContent('Custom child value');

    // Child override field uses reset strategy (overrides parent's last)
    await expect(await canvas.findByTestId('grandparentGroup.parentGroup.childGroupWithOverride.childOverrideField-value')).toHaveTextContent('');

    // Show fields again
    await userEvent.clear(triggerInput);

    // Submit again and verify values are maintained
    await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
    await expect(await canvas.findByTestId('grandparentGroup.grandparentField-value')).toHaveTextContent('default-grandparent');
    await expect(await canvas.findByTestId('grandparentGroup.parentGroup.parentField-value')).toHaveTextContent('Custom parent value');
    await expect(await canvas.findByTestId('grandparentGroup.parentGroup.childGroup.childField-value')).toHaveTextContent('Custom child value');
    await expect(await canvas.findByTestId('grandparentGroup.parentGroup.childGroupWithOverride.childOverrideField-value')).toHaveTextContent('');
  },
};
