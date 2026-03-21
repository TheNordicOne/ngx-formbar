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

// ---------------------------------------------------------------------------
// Group — Keep & Default (attribute hiding)
// ---------------------------------------------------------------------------

export const GroupKeepDefault: Story = {
  name: 'Group — Keep & Default',
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
    // Fill fields with custom values
    await typeInField(canvas, userEvent, 'keepDefaultGroup-childField-input', 'Custom child value');
    await typeInField(canvas, userEvent, 'keepDefaultGroup-childLastField-input', 'Custom child last value');
    await typeInField(canvas, userEvent, 'keepDefaultGroup-childResetField-input', 'Custom child reset value');

    // Hide the group
    await typeInField(canvas, userEvent, 'hideControl-input', 'hide');

    // Group is hidden via [hidden] attribute but stays in the DOM
    await waitFor(async () => {
      await expect(canvas.getByTestId('keepDefaultGroup-title')).not.toBeVisible();
    });

    // Submit and check rendered values according to strategies
    await clickSubmit(canvas, userEvent);
    await waitFor(async () => {
      // Child inherits parent's default value strategy
      await expect(canvas.getByTestId('keepDefaultGroup.childField-value')).toHaveTextContent('default-child');

      // Child with last strategy overrides parent
      await expect(canvas.getByTestId('keepDefaultGroup.childLastField-value')).toHaveTextContent('Custom child last value');

      // Child with reset strategy overrides parent (reset produces empty string)
      await expect(canvas.getByTestId('keepDefaultGroup.childResetField-value')).toHaveTextContent('');
    });

    // Show fields again
    await clearField(canvas, userEvent, 'hideControl-input');

    // Submit again and verify values are maintained
    await clickSubmit(canvas, userEvent);
    await waitFor(async () => {
      await expect(canvas.getByTestId('keepDefaultGroup.childField-value')).toHaveTextContent('default-child');
      await expect(canvas.getByTestId('keepDefaultGroup.childLastField-value')).toHaveTextContent('Custom child last value');
      await expect(canvas.getByTestId('keepDefaultGroup.childResetField-value')).toHaveTextContent('');
    });
  },
};

// ---------------------------------------------------------------------------
// Group — Keep & Reset (attribute hiding)
// ---------------------------------------------------------------------------

export const GroupKeepReset: Story = {
  name: 'Group — Keep & Reset',
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
    // Fill fields with custom values
    await typeInField(canvas, userEvent, 'keepResetGroup-childField-input', 'Custom child value');
    await typeInField(canvas, userEvent, 'keepResetGroup-childLastField-input', 'Custom child last value');
    await typeInField(canvas, userEvent, 'keepResetGroup-childDefaultField-input', 'Custom child default value');

    // Hide the group
    await typeInField(canvas, userEvent, 'hideControl-input', 'hide');

    // Group is hidden via [hidden] attribute but stays in the DOM
    await waitFor(async () => {
      await expect(canvas.getByTestId('keepResetGroup-title')).not.toBeVisible();
    });

    // Submit and check rendered values according to strategies
    await clickSubmit(canvas, userEvent);
    await waitFor(async () => {
      // Child inherits parent's reset value strategy (reset produces empty string)
      await expect(canvas.getByTestId('keepResetGroup.childField-value')).toHaveTextContent('');

      // Child with last strategy overrides parent
      await expect(canvas.getByTestId('keepResetGroup.childLastField-value')).toHaveTextContent('Custom child last value');

      // Child with default strategy overrides parent
      await expect(canvas.getByTestId('keepResetGroup.childDefaultField-value')).toHaveTextContent('default-child-default');
    });

    // Show fields again
    await clearField(canvas, userEvent, 'hideControl-input');

    // Submit again and verify values are maintained
    await clickSubmit(canvas, userEvent);
    await waitFor(async () => {
      await expect(canvas.getByTestId('keepResetGroup.childField-value')).toHaveTextContent('');
      await expect(canvas.getByTestId('keepResetGroup.childLastField-value')).toHaveTextContent('Custom child last value');
      await expect(canvas.getByTestId('keepResetGroup.childDefaultField-value')).toHaveTextContent('default-child-default');
    });
  },
};

// ---------------------------------------------------------------------------
// Parent Remove Precedence (attribute hiding)
// ---------------------------------------------------------------------------

export const ParentRemovePrecedence: Story = {
  name: 'Group — Parent Remove Precedence',
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
    // Fill fields with custom values
    await typeInField(canvas, userEvent, 'parentRemove-parentRemoveField-input', 'Custom parent value');
    await typeInField(canvas, userEvent, 'parentRemove-childKeep-childKeepField-input', 'Custom child value');

    // Hide the group
    await typeInField(canvas, userEvent, 'hideControl-input', 'hide');

    // Group is hidden via [hidden] attribute
    await waitFor(async () => {
      await expect(canvas.getByTestId('parentRemove-title')).not.toBeVisible();
    });

    // Submit — group values should not exist in rendered output (remove strategy)
    await clickSubmit(canvas, userEvent);
    await waitFor(async () => {
      await expect(canvas.queryByTestId('parentRemove.parentRemoveField-value')).not.toBeInTheDocument();
      await expect(canvas.queryByTestId('parentRemove.childKeep.childKeepField-value')).not.toBeInTheDocument();
    });

    // Show fields again
    await clearField(canvas, userEvent, 'hideControl-input');

    // Submit and verify values are restored with 'last' strategy
    await clickSubmit(canvas, userEvent);
    await waitFor(async () => {
      await expect(canvas.getByTestId('parentRemove.parentRemoveField-value')).toHaveTextContent('Custom parent value');
      await expect(canvas.getByTestId('parentRemove.childKeep.childKeepField-value')).toHaveTextContent('Custom child value');
    });
  },
};

// ---------------------------------------------------------------------------
// Inherited Strategies (attribute hiding)
// ---------------------------------------------------------------------------

export const InheritedStrategies: Story = {
  name: 'Group — Inherited Strategies',
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
    // Fill fields with custom values
    await typeInField(canvas, userEvent, 'parentGroup-parentField-input', 'Custom parent value');
    await typeInField(canvas, userEvent, 'parentGroup-childGroup-childField-input', 'Custom child value');

    // Hide the group
    await typeInField(canvas, userEvent, 'hideControl-input', 'hide');

    // Group is hidden via [hidden] attribute but stays in the DOM
    await waitFor(async () => {
      await expect(canvas.getByTestId('parentGroup-title')).not.toBeVisible();
    });

    // Submit and check rendered values — both keep last (custom values)
    await clickSubmit(canvas, userEvent);
    await waitFor(async () => {
      await expect(canvas.getByTestId('parentGroup.parentField-value')).toHaveTextContent('Custom parent value');
      await expect(canvas.getByTestId('parentGroup.childGroup.childField-value')).toHaveTextContent('Custom child value');
    });

    // Show fields again
    await clearField(canvas, userEvent, 'hideControl-input');

    // Submit again and verify values are maintained
    await clickSubmit(canvas, userEvent);
    await waitFor(async () => {
      await expect(canvas.getByTestId('parentGroup.parentField-value')).toHaveTextContent('Custom parent value');
      await expect(canvas.getByTestId('parentGroup.childGroup.childField-value')).toHaveTextContent('Custom child value');
    });
  },
};

// ---------------------------------------------------------------------------
// Strategy Override (attribute hiding)
// ---------------------------------------------------------------------------

export const StrategyOverride: Story = {
  name: 'Group — Strategy Override',
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
    // Fill fields with custom values
    await typeInField(canvas, userEvent, 'parentGroup-parentField-input', 'Custom parent value');
    await typeInField(canvas, userEvent, 'parentGroup-childGroup-childField-input', 'Custom child value');

    // Hide the group
    await typeInField(canvas, userEvent, 'hideControl-input', 'hide');

    // Group is hidden via [hidden] attribute but stays in the DOM
    await waitFor(async () => {
      await expect(canvas.getByTestId('parentGroup-title')).not.toBeVisible();
    });

    // Submit and check rendered values
    await clickSubmit(canvas, userEvent);
    await waitFor(async () => {
      // Parent keeps last (custom value)
      await expect(canvas.getByTestId('parentGroup.parentField-value')).toHaveTextContent('Custom parent value');

      // Child reverts to default (overrides parent's last strategy)
      await expect(canvas.getByTestId('parentGroup.childGroup.childField-value')).toHaveTextContent('default-child');
    });

    // Show fields again
    await clearField(canvas, userEvent, 'hideControl-input');

    // Submit again and verify values are maintained
    await clickSubmit(canvas, userEvent);
    await waitFor(async () => {
      await expect(canvas.getByTestId('parentGroup.parentField-value')).toHaveTextContent('Custom parent value');
      await expect(canvas.getByTestId('parentGroup.childGroup.childField-value')).toHaveTextContent('default-child');
    });
  },
};

// ---------------------------------------------------------------------------
// Three-Level Inheritance (attribute hiding)
// ---------------------------------------------------------------------------

export const ThreeLevelInheritance: Story = {
  name: 'Group — Three-Level Inheritance',
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
    // Fill all fields with custom values
    await typeInField(canvas, userEvent, 'grandparentGroup-grandparentField-input', 'Custom grandparent value');
    await typeInField(canvas, userEvent, 'grandparentGroup-parentGroup-parentField-input', 'Custom parent value');
    await typeInField(canvas, userEvent, 'grandparentGroup-parentGroup-childGroup-childField-input', 'Custom child value');
    await typeInField(canvas, userEvent, 'grandparentGroup-parentGroup-childGroupWithOverride-childOverrideField-input', 'Custom child override value');

    // Hide the group
    await typeInField(canvas, userEvent, 'hideControl-input', 'hide');

    // Group is hidden via [hidden] attribute but stays in the DOM
    await waitFor(async () => {
      await expect(canvas.getByTestId('grandparentGroup-title')).not.toBeVisible();
    });

    // Submit and check rendered values according to strategies
    await clickSubmit(canvas, userEvent);
    await waitFor(async () => {
      // Grandparent field uses grandparent's default strategy
      await expect(canvas.getByTestId('grandparentGroup.grandparentField-value')).toHaveTextContent('default-grandparent');

      // Parent field uses parent's last strategy (overrides grandparent's default)
      await expect(canvas.getByTestId('grandparentGroup.parentGroup.parentField-value')).toHaveTextContent('Custom parent value');

      // Child field inherits parent's last strategy
      await expect(canvas.getByTestId('grandparentGroup.parentGroup.childGroup.childField-value')).toHaveTextContent('Custom child value');

      // Child override field uses reset strategy (overrides parent's last)
      await expect(canvas.getByTestId('grandparentGroup.parentGroup.childGroupWithOverride.childOverrideField-value')).toHaveTextContent('');
    });

    // Show fields again
    await clearField(canvas, userEvent, 'hideControl-input');

    // Submit again and verify values are maintained
    await clickSubmit(canvas, userEvent);
    await waitFor(async () => {
      await expect(canvas.getByTestId('grandparentGroup.grandparentField-value')).toHaveTextContent('default-grandparent');
      await expect(canvas.getByTestId('grandparentGroup.parentGroup.parentField-value')).toHaveTextContent('Custom parent value');
      await expect(canvas.getByTestId('grandparentGroup.parentGroup.childGroup.childField-value')).toHaveTextContent('Custom child value');
      await expect(canvas.getByTestId('grandparentGroup.parentGroup.childGroupWithOverride.childOverrideField-value')).toHaveTextContent('');
    });
  },
};
