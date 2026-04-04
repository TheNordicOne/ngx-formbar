import type { Meta, StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { NgxFbForm } from '@ngx-formbar/core';
import { ExampleControls } from '@ngx-formbar/examples';
import { StoryFormHostComponent } from './story-form-host.component';

const meta: Meta<StoryFormHostComponent> = {
  title: 'Reactive Forms/Visibility Strategies/Groups',
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
// Keep & Last
// ---------------------------------------------------------------------------

export const GroupKeepLast: Story = {
  name: 'Keep & Last',
  parameters: {
    docs: {
      description: {
        story:
          'Keep strategy with last value — group stays in DOM, values preserved.',
      },
    },
  },
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
    const triggerInput = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide everything',
    });
    const childField = await canvas.findByRole('textbox', {
      name: 'Child field',
    });
    const childDefaultField = await canvas.findByRole('textbox', {
      name: 'Child with default strategy',
    });
    const childResetField = await canvas.findByRole('textbox', {
      name: 'Child with reset strategy',
    });

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
    await expect(
      await canvas.findByText('Keep and use last value'),
    ).not.toBeVisible();

    // Submit and check rendered values according to strategies
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Submit' }),
    );
    // Child inherits parent's last value strategy
    await expect(
      await canvas.findByTestId('keepLastGroup.childField-value'),
    ).toHaveTextContent('Custom child value');

    // Child with default strategy overrides parent
    await expect(
      await canvas.findByTestId('keepLastGroup.childDefaultField-value'),
    ).toHaveTextContent('default-child-default');

    // Child with reset strategy overrides parent (reset produces empty string)
    await expect(
      await canvas.findByTestId('keepLastGroup.childResetField-value'),
    ).toHaveTextContent('');

    // Show fields again
    await userEvent.clear(triggerInput);

    // Submit again and verify values are maintained
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Submit' }),
    );
    await expect(
      await canvas.findByTestId('keepLastGroup.childField-value'),
    ).toHaveTextContent('Custom child value');
    await expect(
      await canvas.findByTestId('keepLastGroup.childDefaultField-value'),
    ).toHaveTextContent('default-child-default');
    await expect(
      await canvas.findByTestId('keepLastGroup.childResetField-value'),
    ).toHaveTextContent('');
  },
};

// ---------------------------------------------------------------------------
// Remove & Last
// ---------------------------------------------------------------------------

export const GroupRemoveLast: Story = {
  name: 'Remove & Last',
  parameters: {
    docs: {
      description: {
        story:
          'Remove strategy with last value — group removed, values restored on show.',
      },
    },
  },
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
    const triggerInput = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide everything',
    });
    const childField = await canvas.findByRole('textbox', {
      name: 'Child field',
    });
    const childDefaultField = await canvas.findByRole('textbox', {
      name: 'Child with default strategy',
    });
    const childResetField = await canvas.findByRole('textbox', {
      name: 'Child with reset strategy',
    });

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

    // Group is removed from the DOM (remove strategy)
    await expect(
      canvas.queryByText('Remove but remember last value'),
    ).not.toBeInTheDocument();

    // Control is removed from form model
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Submit' }),
    );
    await expect(
      canvas.queryByTestId('removeLastGroup.childField-value'),
    ).not.toBeInTheDocument();

    // Show fields again
    await userEvent.clear(triggerInput);

    // Submit and verify values are handled according to their strategies
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Submit' }),
    );
    // Child inherits parent's last value strategy
    await expect(
      await canvas.findByTestId('removeLastGroup.childField-value'),
    ).toHaveTextContent('Custom child value');

    // Child with default strategy overrides parent
    await expect(
      await canvas.findByTestId('removeLastGroup.childDefaultField-value'),
    ).toHaveTextContent('default-child-default');

    // Child with reset strategy overrides parent (reset produces empty string)
    await expect(
      await canvas.findByTestId('removeLastGroup.childResetField-value'),
    ).toHaveTextContent('');
  },
};

// ---------------------------------------------------------------------------
// Remove & Default
// ---------------------------------------------------------------------------

export const GroupRemoveDefault: Story = {
  name: 'Remove & Default',
  parameters: {
    docs: {
      description: {
        story:
          'Remove strategy with default value — reverts to defaults on show.',
      },
    },
  },
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
    const triggerInput = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide everything',
    });
    const childField = await canvas.findByRole('textbox', {
      name: 'Child field',
    });
    const childLastField = await canvas.findByRole('textbox', {
      name: 'Child with last strategy',
    });
    const childResetField = await canvas.findByRole('textbox', {
      name: 'Child with reset strategy',
    });

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

    // Group is removed from the DOM (remove strategy)
    await expect(
      canvas.queryByText('Remove but use default value'),
    ).not.toBeInTheDocument();

    // Control is removed from form model
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Submit' }),
    );
    await expect(
      canvas.queryByTestId('removeDefaultGroup.childField-value'),
    ).not.toBeInTheDocument();

    // Show fields again
    await userEvent.clear(triggerInput);

    // Submit and verify values are handled according to their strategies
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Submit' }),
    );
    // Child inherits parent's default value strategy
    await expect(
      await canvas.findByTestId('removeDefaultGroup.childField-value'),
    ).toHaveTextContent('default-child');

    // Child with last strategy overrides parent
    await expect(
      await canvas.findByTestId('removeDefaultGroup.childLastField-value'),
    ).toHaveTextContent('Custom child last value');

    // Child with reset strategy overrides parent (reset produces empty string)
    await expect(
      await canvas.findByTestId('removeDefaultGroup.childResetField-value'),
    ).toHaveTextContent('');
  },
};

// ---------------------------------------------------------------------------
// Remove & Reset
// ---------------------------------------------------------------------------

export const GroupRemoveReset: Story = {
  name: 'Remove & Reset',
  parameters: {
    docs: {
      description: {
        story: 'Remove strategy with reset — clears values on show.',
      },
    },
  },
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
    const triggerInput = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide everything',
    });
    const childField = await canvas.findByRole('textbox', {
      name: 'Child field',
    });
    const childLastField = await canvas.findByRole('textbox', {
      name: 'Child with last strategy',
    });
    const childDefaultField = await canvas.findByRole('textbox', {
      name: 'Child with default strategy',
    });

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

    // Group is removed from the DOM (remove strategy)
    await expect(
      canvas.queryByText('Remove and reset value'),
    ).not.toBeInTheDocument();

    // Control is removed from form model
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Submit' }),
    );
    await expect(
      canvas.queryByTestId('removeResetGroup.childField-value'),
    ).not.toBeInTheDocument();

    // Show fields again
    await userEvent.clear(triggerInput);

    // Submit and verify values are handled according to their strategies
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Submit' }),
    );
    // Child inherits parent's reset value strategy (reset produces empty string)
    await expect(
      await canvas.findByTestId('removeResetGroup.childField-value'),
    ).toHaveTextContent('');

    // Child with last strategy overrides parent
    await expect(
      await canvas.findByTestId('removeResetGroup.childLastField-value'),
    ).toHaveTextContent('Custom child last value');

    // Child with default strategy overrides parent
    await expect(
      await canvas.findByTestId('removeResetGroup.childDefaultField-value'),
    ).toHaveTextContent('default-child-default');
  },
};

// ---------------------------------------------------------------------------
// Keep & Default
// ---------------------------------------------------------------------------

export const GroupKeepDefault: Story = {
  name: 'Keep & Default',
  parameters: {
    docs: {
      description: {
        story:
          'Keep strategy with default value — reverts to defaults when hidden.',
      },
    },
  },
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      keepDefaultGroup: {
        type: 'group',
        legend: 'Keep but use default value',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'keep',
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
    const triggerInput = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide everything',
    });
    const childField = await canvas.findByRole('textbox', {
      name: 'Child field',
    });
    const childLastField = await canvas.findByRole('textbox', {
      name: 'Child with last strategy',
    });
    const childResetField = await canvas.findByRole('textbox', {
      name: 'Child with reset strategy',
    });

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
    await expect(
      await canvas.findByText('Keep but use default value'),
    ).not.toBeVisible();

    // Submit and check rendered values according to strategies
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Submit' }),
    );
    // Child inherits parent's default value strategy
    await expect(
      await canvas.findByTestId('keepDefaultGroup.childField-value'),
    ).toHaveTextContent('default-child');

    // Child with last strategy overrides parent
    await expect(
      await canvas.findByTestId('keepDefaultGroup.childLastField-value'),
    ).toHaveTextContent('Custom child last value');

    // Child with reset strategy overrides parent (reset produces empty string)
    await expect(
      await canvas.findByTestId('keepDefaultGroup.childResetField-value'),
    ).toHaveTextContent('');

    // Show fields again
    await userEvent.clear(triggerInput);

    // Submit again and verify values are maintained
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Submit' }),
    );
    await expect(
      await canvas.findByTestId('keepDefaultGroup.childField-value'),
    ).toHaveTextContent('default-child');
    await expect(
      await canvas.findByTestId('keepDefaultGroup.childLastField-value'),
    ).toHaveTextContent('Custom child last value');
    await expect(
      await canvas.findByTestId('keepDefaultGroup.childResetField-value'),
    ).toHaveTextContent('');
  },
};

// ---------------------------------------------------------------------------
// Keep & Reset
// ---------------------------------------------------------------------------

export const GroupKeepReset: Story = {
  name: 'Keep & Reset',
  parameters: {
    docs: {
      description: {
        story: 'Keep strategy with reset — clears values when hidden.',
      },
    },
  },
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      keepResetGroup: {
        type: 'group',
        legend: 'Keep but reset value',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'keep',
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
    const triggerInput = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide everything',
    });
    const childField = await canvas.findByRole('textbox', {
      name: 'Child field',
    });
    const childLastField = await canvas.findByRole('textbox', {
      name: 'Child with last strategy',
    });
    const childDefaultField = await canvas.findByRole('textbox', {
      name: 'Child with default strategy',
    });

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
    await expect(
      await canvas.findByText('Keep but reset value'),
    ).not.toBeVisible();

    // Submit and check rendered values according to strategies
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Submit' }),
    );
    // Child inherits parent's reset value strategy (reset produces empty string)
    await expect(
      await canvas.findByTestId('keepResetGroup.childField-value'),
    ).toHaveTextContent('');

    // Child with last strategy overrides parent
    await expect(
      await canvas.findByTestId('keepResetGroup.childLastField-value'),
    ).toHaveTextContent('Custom child last value');

    // Child with default strategy overrides parent
    await expect(
      await canvas.findByTestId('keepResetGroup.childDefaultField-value'),
    ).toHaveTextContent('default-child-default');

    // Show fields again
    await userEvent.clear(triggerInput);

    // Submit again and verify values are maintained
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Submit' }),
    );
    await expect(
      await canvas.findByTestId('keepResetGroup.childField-value'),
    ).toHaveTextContent('');
    await expect(
      await canvas.findByTestId('keepResetGroup.childLastField-value'),
    ).toHaveTextContent('Custom child last value');
    await expect(
      await canvas.findByTestId('keepResetGroup.childDefaultField-value'),
    ).toHaveTextContent('default-child-default');
  },
};

// ---------------------------------------------------------------------------
// Parent Remove Precedence// ---------------------------------------------------------------------------

export const ParentRemovePrecedence: Story = {
  name: 'Parent Remove Precedence',
  parameters: {
    docs: {
      description: {
        story: 'Parent remove strategy takes precedence over child keep.',
      },
    },
  },
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      parentRemove: {
        type: 'group',
        legend: 'Parent with Remove Strategy',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'remove',
        valueStrategy: 'last',

        controls: {
          parentRemoveField: {
            type: 'text',
            label: 'Parent field',
            defaultValue: 'default-parent',
          },
          childKeep: {
            type: 'group',
            legend: 'Child with Keep Strategy (will be ignored)',
            hideStrategy: 'keep',
            valueStrategy: 'last',

            controls: {
              childKeepField: {
                type: 'text',
                label: 'Child field',
                defaultValue: 'default-child',
              },
            },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const triggerInput = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide everything',
    });
    const parentField = await canvas.findByRole('textbox', {
      name: 'Parent field',
    });
    const childField = await canvas.findByRole('textbox', {
      name: 'Child field',
    });

    // Fill fields with custom values
    await userEvent.clear(parentField);
    await userEvent.type(parentField, 'Custom parent value');
    await userEvent.clear(childField);
    await userEvent.type(childField, 'Custom child value');

    // Hide the group
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Group is removed from the DOM (remove strategy)
    await expect(
      canvas.queryByText('Parent with Remove Strategy'),
    ).not.toBeInTheDocument();

    // Controls are removed from form model
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Submit' }),
    );
    await expect(
      canvas.queryByTestId('parentRemove.parentRemoveField-value'),
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByTestId('parentRemove.childKeep.childKeepField-value'),
    ).not.toBeInTheDocument();

    // Show fields again
    await userEvent.clear(triggerInput);

    // Submit and verify values are restored with 'last' strategy
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Submit' }),
    );
    await expect(
      await canvas.findByTestId('parentRemove.parentRemoveField-value'),
    ).toHaveTextContent('Custom parent value');
    await expect(
      await canvas.findByTestId('parentRemove.childKeep.childKeepField-value'),
    ).toHaveTextContent('Custom child value');
  },
};

// ---------------------------------------------------------------------------
// Inherited Strategies// ---------------------------------------------------------------------------

export const InheritedStrategies: Story = {
  name: 'Inherited Strategies',
  parameters: {
    docs: {
      description: {
        story: "Child group inherits parent's keep & last strategies.",
      },
    },
  },
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      parentGroup: {
        type: 'group',
        legend: 'Parent Group - Keep & Last',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'keep',
        valueStrategy: 'last',

        controls: {
          parentField: {
            type: 'text',
            label: 'Parent field',
            defaultValue: 'default-parent',
          },
          childGroup: {
            type: 'group',
            legend: 'Child Group - No Strategy Override',

            controls: {
              childField: {
                type: 'text',
                label: 'Child field',
                defaultValue: 'default-child',
              },
            },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const triggerInput = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide everything',
    });
    const parentField = await canvas.findByRole('textbox', {
      name: 'Parent field',
    });
    const childField = await canvas.findByRole('textbox', {
      name: 'Child field',
    });

    // Fill fields with custom values
    await userEvent.clear(parentField);
    await userEvent.type(parentField, 'Custom parent value');
    await userEvent.clear(childField);
    await userEvent.type(childField, 'Custom child value');

    // Hide the group
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Group is hidden via [hidden] attribute but stays in the DOM
    await expect(
      await canvas.findByText('Parent Group - Keep & Last'),
    ).not.toBeVisible();

    // Submit and check rendered values — both keep last (custom values)
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Submit' }),
    );
    await expect(
      await canvas.findByTestId('parentGroup.parentField-value'),
    ).toHaveTextContent('Custom parent value');
    await expect(
      await canvas.findByTestId('parentGroup.childGroup.childField-value'),
    ).toHaveTextContent('Custom child value');

    // Show fields again
    await userEvent.clear(triggerInput);

    // Submit again and verify values are maintained
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Submit' }),
    );
    await expect(
      await canvas.findByTestId('parentGroup.parentField-value'),
    ).toHaveTextContent('Custom parent value');
    await expect(
      await canvas.findByTestId('parentGroup.childGroup.childField-value'),
    ).toHaveTextContent('Custom child value');
  },
};

// ---------------------------------------------------------------------------
// Strategy Override// ---------------------------------------------------------------------------

export const StrategyOverride: Story = {
  name: 'Strategy Override',
  parameters: {
    docs: {
      description: { story: "Child group overrides parent's value strategy." },
    },
  },
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      parentGroup: {
        type: 'group',
        legend: 'Parent Group - Keep & Last',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'keep',
        valueStrategy: 'last',

        controls: {
          parentField: {
            type: 'text',
            label: 'Parent field',
            defaultValue: 'default-parent',
          },
          childGroup: {
            type: 'group',
            legend: 'Child Group - With Strategy Override',
            valueStrategy: 'default',

            controls: {
              childField: {
                type: 'text',
                label: 'Child field',
                defaultValue: 'default-child',
              },
            },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const triggerInput = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide everything',
    });
    const parentField = await canvas.findByRole('textbox', {
      name: 'Parent field',
    });
    const childField = await canvas.findByRole('textbox', {
      name: 'Child field',
    });

    // Fill fields with custom values
    await userEvent.clear(parentField);
    await userEvent.type(parentField, 'Custom parent value');
    await userEvent.clear(childField);
    await userEvent.type(childField, 'Custom child value');

    // Hide the group
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Group is hidden via [hidden] attribute but stays in the DOM
    await expect(
      await canvas.findByText('Parent Group - Keep & Last'),
    ).not.toBeVisible();

    // Submit and check rendered values
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Submit' }),
    );
    // Parent keeps last (custom value)
    await expect(
      await canvas.findByTestId('parentGroup.parentField-value'),
    ).toHaveTextContent('Custom parent value');

    // Child reverts to default (overrides parent's last strategy)
    await expect(
      await canvas.findByTestId('parentGroup.childGroup.childField-value'),
    ).toHaveTextContent('default-child');

    // Show fields again
    await userEvent.clear(triggerInput);

    // Submit again and verify values are maintained
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Submit' }),
    );
    await expect(
      await canvas.findByTestId('parentGroup.parentField-value'),
    ).toHaveTextContent('Custom parent value');
    await expect(
      await canvas.findByTestId('parentGroup.childGroup.childField-value'),
    ).toHaveTextContent('default-child');
  },
};

// ---------------------------------------------------------------------------
// Three-Level Inheritance// ---------------------------------------------------------------------------

export const ThreeLevelInheritance: Story = {
  name: 'Three-Level Inheritance',
  parameters: {
    docs: {
      description: {
        story: 'Three-level hierarchy with strategy overrides at each level.',
      },
    },
  },
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      grandparentGroup: {
        type: 'group',
        legend: 'Grandparent Group - Keep & Default',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'keep',
        valueStrategy: 'default',

        controls: {
          grandparentField: {
            type: 'text',
            label: 'Grandparent field',
            defaultValue: 'default-grandparent',
          },
          parentGroup: {
            type: 'group',
            legend: 'Parent Group - Override to Last',
            valueStrategy: 'last',

            controls: {
              parentField: {
                type: 'text',
                label: 'Parent field',
                defaultValue: 'default-parent',
              },
              childGroup: {
                type: 'group',
                legend: 'Child Group - No Strategy Override',

                controls: {
                  childField: {
                    type: 'text',
                    label: 'Child field',
                    defaultValue: 'default-child',
                  },
                },
              },
              childGroupWithOverride: {
                type: 'group',
                legend: 'Child Group - Reset Override',
                valueStrategy: 'reset',

                controls: {
                  childOverrideField: {
                    type: 'text',
                    label: 'Child override field',
                    defaultValue: 'default-child-override',
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
    const triggerInput = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide everything',
    });
    const grandparentField = await canvas.findByRole('textbox', {
      name: 'Grandparent field',
    });
    const parentField = await canvas.findByRole('textbox', {
      name: 'Parent field',
    });
    const childField = await canvas.findByRole('textbox', {
      name: 'Child field',
    });
    const childOverrideField = await canvas.findByRole('textbox', {
      name: 'Child override field',
    });

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
    await expect(
      await canvas.findByText('Grandparent Group - Keep & Default'),
    ).not.toBeVisible();

    // Submit and check rendered values according to strategies
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Submit' }),
    );
    // Grandparent field uses grandparent's default strategy
    await expect(
      await canvas.findByTestId('grandparentGroup.grandparentField-value'),
    ).toHaveTextContent('default-grandparent');

    // Parent field uses parent's last strategy (overrides grandparent's default)
    await expect(
      await canvas.findByTestId(
        'grandparentGroup.parentGroup.parentField-value',
      ),
    ).toHaveTextContent('Custom parent value');

    // Child field inherits parent's last strategy
    await expect(
      await canvas.findByTestId(
        'grandparentGroup.parentGroup.childGroup.childField-value',
      ),
    ).toHaveTextContent('Custom child value');

    // Child override field uses reset strategy (overrides parent's last)
    await expect(
      await canvas.findByTestId(
        'grandparentGroup.parentGroup.childGroupWithOverride.childOverrideField-value',
      ),
    ).toHaveTextContent('');

    // Show fields again
    await userEvent.clear(triggerInput);

    // Submit again and verify values are maintained
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Submit' }),
    );
    await expect(
      await canvas.findByTestId('grandparentGroup.grandparentField-value'),
    ).toHaveTextContent('default-grandparent');
    await expect(
      await canvas.findByTestId(
        'grandparentGroup.parentGroup.parentField-value',
      ),
    ).toHaveTextContent('Custom parent value');
    await expect(
      await canvas.findByTestId(
        'grandparentGroup.parentGroup.childGroup.childField-value',
      ),
    ).toHaveTextContent('Custom child value');
    await expect(
      await canvas.findByTestId(
        'grandparentGroup.parentGroup.childGroupWithOverride.childOverrideField-value',
      ),
    ).toHaveTextContent('');
  },
};
