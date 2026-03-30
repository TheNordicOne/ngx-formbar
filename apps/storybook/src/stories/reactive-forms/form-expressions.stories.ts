import type { Meta, StoryObj } from '@storybook/angular';
import { expect, waitFor } from 'storybook/test';
import type { FormContext } from '@ngx-formbar/core';
import type { ExampleControls } from '@ngx-formbar/examples';
import { StoryFormHostComponent } from './story-form-host.component';

const meta: Meta<StoryFormHostComponent> = {
  title: 'Reactive Forms/Form Expressions',
  component: StoryFormHostComponent,
};

export default meta;
type Story = StoryObj<StoryFormHostComponent>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formConfig(
  content: Record<string, ExampleControls>,
): { formConfig: { content: Record<string, ExampleControls> } } {
  return { formConfig: { content } };
}

// ---------------------------------------------------------------------------
// Disabling
// ---------------------------------------------------------------------------

export const StaticDisabled: Story = {
  parameters: {
    docs: { description: { story: 'Static disabled: true disables controls and inherits through groups.' } },
  },
  args: formConfig({
    first: {
      type: 'text',
      label: 'First',
      defaultValue: 'default-first',
      disabled: true,
    },
    'first-group': {
      type: 'group',
      legend: 'First Group',
      disabled: true,
      controls: {
        'grouped-first': {
          type: 'text',
          label: 'Grouped First label',
          defaultValue: 'default-grouped-first',
        },
        'nested-group': {
          type: 'group',
          legend: 'Nested Group',
          controls: {
            'nested-second': {
              type: 'text',
              label: 'Nested Second label',
              defaultValue: 'default-nested-second',
            },
          },
        },
      },
    },
  }),
  play: async ({ canvas }) => {
    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'First' })).toBeDisabled();
      await expect(canvas.getByRole('textbox', { name: 'Grouped First label' })).toBeDisabled();
      await expect(canvas.getByRole('textbox', { name: 'Nested Second label' })).toBeDisabled();
    });
  },
};

export const ConditionalDisabled: Story = {
  parameters: {
    docs: { description: { story: 'Conditional expression toggles disabled state reactively.' } },
  },
  args: formConfig({
    disableControl: {
      type: 'text',
      label: 'Type "disable" to disable everything',
    },
    first: {
      type: 'text',
      label: 'First',
      defaultValue: 'default-first',
      disabled: 'disableControl === "disable"',
    },
    'first-group': {
      type: 'group',
      legend: 'First Group',
      disabled: 'disableControl === "disable"',
      controls: {
        'grouped-first': {
          type: 'text',
          label: 'Grouped First label',
          defaultValue: 'default-grouped-first',
        },
        'nested-group': {
          type: 'group',
          legend: 'Nested Group',
          controls: {
            'nested-second': {
              type: 'text',
              label: 'Nested Second label',
              defaultValue: 'default-nested-second',
            },
          },
        },
      },
    },
  }),
  play: async ({ canvas, userEvent }) => {
    // Initially not disabled
    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'First' })).not.toBeDisabled();
      await expect(canvas.getByRole('textbox', { name: 'Grouped First label' })).not.toBeDisabled();
      await expect(canvas.getByRole('textbox', { name: 'Nested Second label' })).not.toBeDisabled();
    });

    // Type "disable" to trigger the expression
    const disableControl = canvas.getByRole('textbox', { name: 'Type "disable" to disable everything' });
    await userEvent.clear(disableControl);
    await userEvent.type(disableControl, 'disable');

    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'First' })).toBeDisabled();
      await expect(canvas.getByRole('textbox', { name: 'Grouped First label' })).toBeDisabled();
      await expect(canvas.getByRole('textbox', { name: 'Nested Second label' })).toBeDisabled();
    });

    // Clear the trigger to re-enable
    await userEvent.clear(disableControl);
    await userEvent.type(disableControl, 'something else');

    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'First' })).not.toBeDisabled();
      await expect(canvas.getByRole('textbox', { name: 'Grouped First label' })).not.toBeDisabled();
      await expect(canvas.getByRole('textbox', { name: 'Nested Second label' })).not.toBeDisabled();
    });
  },
};

// ---------------------------------------------------------------------------
// Readonly
// ---------------------------------------------------------------------------

export const StaticReadonly: Story = {
  parameters: {
    docs: { description: { story: 'Static readonly: true applies the readonly attribute.' } },
  },
  args: formConfig({
    first: {
      type: 'text',
      label: 'First',
      defaultValue: 'default-first',
      readonly: true,
    },
    'first-group': {
      type: 'group',
      legend: 'First Group',
      readonly: true,
      controls: {
        'grouped-first': {
          type: 'text',
          label: 'Grouped First label',
          defaultValue: 'default-grouped-first',
        },
        'nested-group': {
          type: 'group',
          legend: 'Nested Group',
          controls: {
            'nested-second': {
              type: 'text',
              label: 'Nested Second label',
              defaultValue: 'default-nested-second',
            },
          },
        },
      },
    },
  }),
  play: async ({ canvas }) => {
    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'First' })).toHaveAttribute('readonly');
      await expect(canvas.getByRole('textbox', { name: 'Grouped First label' })).toHaveAttribute(
        'readonly',
      );
      await expect(canvas.getByRole('textbox', { name: 'Nested Second label' })).toHaveAttribute(
        'readonly',
      );
    });
  },
};

export const ConditionalReadonly: Story = {
  parameters: {
    docs: { description: { story: 'Conditional expression toggles readonly state reactively.' } },
  },
  args: formConfig({
    readonlyControl: {
      type: 'text',
      label: 'Type "readonly" to readonly everything',
    },
    first: {
      type: 'text',
      label: 'First',
      defaultValue: 'default-first',
      readonly: 'readonlyControl === "readonly"',
    },
    'first-group': {
      type: 'group',
      legend: 'First Group',
      readonly: 'readonlyControl === "readonly"',
      controls: {
        'grouped-first': {
          type: 'text',
          label: 'Grouped First label',
          defaultValue: 'default-grouped-first',
        },
        'nested-group': {
          type: 'group',
          legend: 'Nested Group',
          controls: {
            'nested-second': {
              type: 'text',
              label: 'Nested Second label',
              defaultValue: 'default-nested-second',
            },
          },
        },
      },
    },
  }),
  play: async ({ canvas, userEvent }) => {
    // Initially not readonly
    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'First' })).not.toHaveAttribute('readonly');
      await expect(canvas.getByRole('textbox', { name: 'Grouped First label' })).not.toHaveAttribute(
        'readonly',
      );
      await expect(canvas.getByRole('textbox', { name: 'Nested Second label' })).not.toHaveAttribute(
        'readonly',
      );
    });

    // Type "readonly" to trigger the expression
    const readonlyControl = canvas.getByRole('textbox', { name: 'Type "readonly" to readonly everything' });
    await userEvent.clear(readonlyControl);
    await userEvent.type(readonlyControl, 'readonly');

    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'First' })).toHaveAttribute('readonly');
      await expect(canvas.getByRole('textbox', { name: 'Grouped First label' })).toHaveAttribute(
        'readonly',
      );
      await expect(canvas.getByRole('textbox', { name: 'Nested Second label' })).toHaveAttribute(
        'readonly',
      );
    });

    // Clear to remove readonly
    await userEvent.clear(readonlyControl);
    await userEvent.type(readonlyControl, 'something else');

    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'First' })).not.toHaveAttribute('readonly');
      await expect(canvas.getByRole('textbox', { name: 'Grouped First label' })).not.toHaveAttribute(
        'readonly',
      );
      await expect(canvas.getByRole('textbox', { name: 'Nested Second label' })).not.toHaveAttribute(
        'readonly',
      );
    });
  },
};

// ---------------------------------------------------------------------------
// Hidden / Expressions
// ---------------------------------------------------------------------------

export const FunctionExpressions: Story = {
  parameters: {
    docs: { description: { story: 'Function-based expressions for hidden, disabled, readonly, computed, and dynamic labels.' } },
  },
  args: formConfig({
    triggerField: {
      type: 'text',
      label: 'Trigger (type "hide", "disable", "readonly")',
      defaultValue: '',
    },
    nameForLabel: {
      type: 'text',
      label: 'Name',
      defaultValue: 'User',
    },
    sourceA: {
      type: 'text',
      label: 'Source A',
      defaultValue: 'Hello',
    },
    sourceB: {
      type: 'text',
      label: 'Source B',
      defaultValue: 'World',
    },
    hiddenTarget: {
      type: 'text',
      label: 'Hidden by function',
      hidden: (formValue: FormContext) => formValue['triggerField'] === 'hide',
      defaultValue: 'I can be hidden',
    },
    disabledTarget: {
      type: 'text',
      label: 'Disabled by function',
      disabled: (formValue: FormContext) =>
        formValue['triggerField'] === 'disable',
      defaultValue: 'I can be disabled',
    },
    readonlyTarget: {
      type: 'text',
      label: 'Readonly by function',
      readonly: (formValue: FormContext) =>
        formValue['triggerField'] === 'readonly',
      defaultValue: 'I can be readonly',
    },
    computedTarget: {
      type: 'text',
      label: 'Computed by function',
      computedValue: (formValue: FormContext): string => {
        const a = (formValue['sourceA'] as string | undefined) ?? '';
        const b = (formValue['sourceB'] as string | undefined) ?? '';
        return `${a} ${b}!`.trim();
      },
      defaultValue: '',
    },
    labelTarget: {
      type: 'text',
      dynamicLabel: (formValue: FormContext): string => {
        const name =
          (formValue['nameForLabel'] as string | undefined) ?? '';
        return `Greeting for ${name.length > 0 ? name : 'Guest'}`;
      },
      defaultValue: 'Some value',
    },
  }),
  play: async ({ canvas, userEvent }) => {
    // Initial state: all visible, enabled, not readonly
    await waitFor(async () => {
      await expect(
        canvas.getByRole('textbox', { name: 'Hidden by function' }),
      ).toBeInTheDocument();
      await expect(canvas.getByRole('textbox', { name: 'Disabled by function' })).not.toBeDisabled();
      await expect(canvas.getByRole('textbox', { name: 'Readonly by function' })).not.toHaveAttribute(
        'readonly',
      );
    });

    // Computed value from function
    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'Computed by function' })).toHaveValue(
        'Hello World!',
      );
    });

    // Dynamic label from function
    await waitFor(async () => {
      await expect(canvas.getByText('Greeting for User')).toBeInTheDocument();
    });

    // Trigger hidden
    const triggerField = canvas.getByRole('textbox', { name: 'Trigger (type "hide", "disable", "readonly")' });
    await userEvent.clear(triggerField);
    await userEvent.type(triggerField, 'hide');
    await waitFor(async () => {
      await expect(
        canvas.queryByRole('textbox', { name: 'Hidden by function' }),
      ).not.toBeInTheDocument();
    });

    // Trigger disabled
    await userEvent.clear(triggerField);
    await userEvent.type(triggerField, 'disable');
    await waitFor(async () => {
      await expect(
        canvas.getByRole('textbox', { name: 'Hidden by function' }),
      ).toBeInTheDocument();
      await expect(canvas.getByRole('textbox', { name: 'Disabled by function' })).toBeDisabled();
    });

    // Trigger readonly
    await userEvent.clear(triggerField);
    await userEvent.type(triggerField, 'readonly');
    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'Disabled by function' })).not.toBeDisabled();
      await expect(canvas.getByRole('textbox', { name: 'Readonly by function' })).toHaveAttribute(
        'readonly',
      );
    });

    // Update computed sources
    const sourceA = canvas.getByRole('textbox', { name: 'Source A' });
    await userEvent.clear(sourceA);
    await userEvent.type(sourceA, 'Goodbye');
    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'Computed by function' })).toHaveValue(
        'Goodbye World!',
      );
    });

    // Update dynamic label source
    const nameForLabel = canvas.getByRole('textbox', { name: 'Name' });
    await userEvent.clear(nameForLabel);
    await userEvent.type(nameForLabel, 'Alice');
    await waitFor(async () => {
      await expect(canvas.getByText('Greeting for Alice')).toBeInTheDocument();
    });
  },
};

export const DeepHierarchyVisibility: Story = {
  parameters: {
    docs: { description: { story: 'Hidden expressions across three levels of nesting with mixed strategies.' } },
  },
  args: formConfig({
    toggleControl: {
      type: 'text',
      label: 'Type "hide" to hide nested fields',
    },
    rootField: {
      type: 'text',
      label: 'Root level field',
      defaultValue: 'root value',
    },
    level1: {
      type: 'group',
      legend: 'Level 1',
      controls: {
        level1Field: {
          type: 'text',
          label: 'Level 1 Field',
          defaultValue: 'level 1 value',
        },
        level2A: {
          type: 'group',
          legend: 'Level 2A',
          controls: {
            level2AField: {
              type: 'text',
              label: 'Level 2A Field',
              hidden: 'toggleControl === "hide"',
              hideStrategy: 'remove',
              defaultValue: 'level 2A value',
            },
          },
        },
        level2B: {
          type: 'group',
          legend: 'Level 2B',
          controls: {
            level2BField: {
              type: 'text',
              label: 'Level 2B Field',
              defaultValue: 'level 2B value',
            },
            level3A: {
              type: 'group',
              legend: 'Level 3A',
              controls: {
                level3AField: {
                  type: 'text',
                  label: 'Level 3A Field',
                  hidden: 'toggleControl === "hide"',
                  hideStrategy: 'keep',
                  defaultValue: 'level 3A value',
                },
              },
            },
            level3B: {
              type: 'group',
              legend: 'Level 3B',
              hidden: 'toggleControl === "hide"',
              controls: {
                level3BField: {
                  type: 'text',
                  label: 'Level 3B Field',
                  defaultValue: 'level 3B value',
                },
              },
            },
          },
        },
      },
    },
  }),
  play: async ({ canvas, userEvent }) => {
    // Initially all fields should be visible
    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'Level 2A Field' })).toBeInTheDocument();
      await expect(canvas.getByRole('textbox', { name: 'Level 3A Field' })).toBeInTheDocument();
      await expect(canvas.getByRole('textbox', { name: 'Level 3B Field' })).toBeInTheDocument();
    });

    // Hide fields with the toggle control
    const toggleControl = canvas.getByRole('textbox', { name: 'Type "hide" to hide nested fields' });
    await userEvent.clear(toggleControl);
    await userEvent.type(toggleControl, 'hide');

    // Fields with hidden condition should be hidden
    await waitFor(async () => {
      await expect(
        canvas.queryByRole('textbox', { name: 'Level 2A Field' }),
      ).not.toBeInTheDocument();
      await expect(
        canvas.queryByRole('textbox', { name: 'Level 3A Field' }),
      ).not.toBeInTheDocument();
      await expect(
        canvas.queryByRole('group', { name: 'Level 3B' }),
      ).not.toBeInTheDocument();
    });

    // Fields without hidden condition should still be visible
    await expect(canvas.getByRole('textbox', { name: 'Root level field' })).toBeInTheDocument();
    await expect(canvas.getByRole('textbox', { name: 'Level 1 Field' })).toBeInTheDocument();
    await expect(canvas.getByRole('textbox', { name: 'Level 2B Field' })).toBeInTheDocument();

    // Show fields again by clearing the toggle control
    await userEvent.clear(toggleControl);

    // All fields should be visible again
    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'Level 2A Field' })).toBeInTheDocument();
      await expect(canvas.getByRole('textbox', { name: 'Level 3A Field' })).toBeInTheDocument();
      await expect(canvas.getByRole('textbox', { name: 'Level 3B Field' })).toBeInTheDocument();
    });
  },
};

export const CrossGroupDependencies: Story = {
  parameters: {
    docs: { description: { story: 'A field in one group depends on a field in another group.' } },
  },
  args: formConfig({
    branchA: {
      type: 'group',
      legend: 'Branch A',
      controls: {
        toggleField: {
          type: 'text',
          label: 'Type "show" to reveal field in Branch B',
          defaultValue: '',
        },
      },
    },
    branchB: {
      type: 'group',
      legend: 'Branch B',
      controls: {
        nestedGroup: {
          type: 'group',
          legend: 'Nested Group',
          controls: {
            dependentField: {
              type: 'text',
              label: 'Dependent Field',
              hidden: 'branchA.toggleField !== "show"',
              defaultValue: 'I depend on Branch A field',
            },
          },
        },
      },
    },
  }),
  play: async ({ canvas, userEvent }) => {
    // Initially dependent field should be hidden
    await waitFor(async () => {
      await expect(
        canvas.queryByRole('textbox', { name: 'Dependent Field' }),
      ).not.toBeInTheDocument();
    });

    // Set the toggle field value to "show"
    const toggleField = canvas.getByRole('textbox', { name: 'Type "show" to reveal field in Branch B' });
    await userEvent.clear(toggleField);
    await userEvent.type(toggleField, 'show');

    // Dependent field should now be visible
    await waitFor(async () => {
      await expect(
        canvas.getByRole('textbox', { name: 'Dependent Field' }),
      ).toBeInTheDocument();
    });

    // Change toggle field to something else
    await userEvent.clear(toggleField);
    await userEvent.type(toggleField, 'hide');

    // Dependent field should be hidden again
    await waitFor(async () => {
      await expect(
        canvas.queryByRole('textbox', { name: 'Dependent Field' }),
      ).not.toBeInTheDocument();
    });
  },
};

// ---------------------------------------------------------------------------
// Computed Values
// ---------------------------------------------------------------------------

export const ComputedValue: Story = {
  parameters: {
    docs: { description: { story: 'String concatenation, numeric computation, and fallback expressions.' } },
  },
  args: formConfig({
    firstName: {
      type: 'text',
      label: 'First',
      defaultValue: 'Jane',
    },
    lastName: {
      type: 'text',
      label: 'Last',
      defaultValue: 'Doe',
    },
    fullName: {
      type: 'text',
      label: 'Full Name',
      computedValue: 'firstName + " " + lastName',
    },
    base: {
      type: 'text',
      label: 'Base',
      defaultValue: '5',
    },
    square: {
      type: 'text',
      label: 'Square',
      computedValue: (ctx: FormContext): number => {
        const b = Number(ctx['base']);
        return b * b;
      },
    },
    maybeEmpty: {
      type: 'text',
      label: 'Maybe Empty',
      defaultValue: '',
    },
    fallback: {
      type: 'text',
      label: 'Fallback',
      computedValue: 'maybeEmpty || "DEFAULT"',
    },
  }),
  play: async ({ canvas, userEvent }) => {
    const fullName = canvas.getByRole('textbox', { name: 'Full Name' });
    const square = canvas.getByRole('textbox', { name: 'Square' });
    const fallback = canvas.getByRole('textbox', { name: 'Fallback' });

    // String concatenation
    await waitFor(async () => {
      await expect(fullName).toHaveValue('Jane Doe');
    });

    const firstName = canvas.getByRole('textbox', { name: 'First' });
    await userEvent.clear(firstName);
    await userEvent.type(firstName, 'John');
    await waitFor(async () => {
      await expect(fullName).toHaveValue('John Doe');
    });

    const lastName = canvas.getByRole('textbox', { name: 'Last' });
    await userEvent.clear(lastName);
    await userEvent.type(lastName, 'Smith');
    await waitFor(async () => {
      await expect(fullName).toHaveValue('John Smith');
    });

    // Numeric computation
    await waitFor(async () => {
      await expect(square).toHaveValue('25');
    });

    const base = canvas.getByRole('textbox', { name: 'Base' });
    await userEvent.clear(base);
    await userEvent.type(base, '7');
    await waitFor(async () => {
      await expect(square).toHaveValue('49');
    });

    // Fallback when empty
    await waitFor(async () => {
      await expect(fallback).toHaveValue('DEFAULT');
    });

    await userEvent.type(canvas.getByRole('textbox', { name: 'Maybe Empty' }), 'Foo');
    await waitFor(async () => {
      await expect(fallback).toHaveValue('Foo');
    });
  },
};

export const CascadingComputed: Story = {
  parameters: {
    docs: { description: { story: 'Computed values cascade through five levels.' } },
  },
  args: formConfig({
    level0: {
      type: 'text',
      label: 'Level 0 Input',
      defaultValue: 'Start',
    },
    level1: {
      type: 'text',
      label: 'Level 1 Computed',
      computedValue: 'level0 + "-L1"',
    },
    level2: {
      type: 'text',
      label: 'Level 2 Computed',
      computedValue: 'level1 + "-L2"',
    },
    level3: {
      type: 'text',
      label: 'Level 3 Computed',
      computedValue: 'level2 + "-L3"',
    },
    level4: {
      type: 'text',
      label: 'Level 4 Computed',
      computedValue: 'level3 + "-L4"',
    },
    level5: {
      type: 'text',
      label: 'Level 5 Computed',
      computedValue: 'level4 + "-L5"',
    },
  }),
  play: async ({ canvas, userEvent }) => {
    const level0 = canvas.getByRole('textbox', { name: 'Level 0 Input' });
    const level1 = canvas.getByRole('textbox', { name: 'Level 1 Computed' });
    const level2 = canvas.getByRole('textbox', { name: 'Level 2 Computed' });
    const level3 = canvas.getByRole('textbox', { name: 'Level 3 Computed' });
    const level4 = canvas.getByRole('textbox', { name: 'Level 4 Computed' });
    const level5 = canvas.getByRole('textbox', { name: 'Level 5 Computed' });

    // Verify initial cascaded values
    await waitFor(async () => {
      await expect(level0).toHaveValue('Start');
      await expect(level1).toHaveValue('Start-L1');
      await expect(level2).toHaveValue('Start-L1-L2');
      await expect(level3).toHaveValue('Start-L1-L2-L3');
      await expect(level4).toHaveValue(
        'Start-L1-L2-L3-L4',
      );
      await expect(level5).toHaveValue(
        'Start-L1-L2-L3-L4-L5',
      );
    });

    // Update the base value
    await userEvent.clear(level0);
    await userEvent.type(level0, 'Updated');

    // Verify all dependent values are updated
    await waitFor(async () => {
      await expect(level1).toHaveValue('Updated-L1');
      await expect(level2).toHaveValue('Updated-L1-L2');
      await expect(level3).toHaveValue(
        'Updated-L1-L2-L3',
      );
      await expect(level4).toHaveValue(
        'Updated-L1-L2-L3-L4',
      );
      await expect(level5).toHaveValue(
        'Updated-L1-L2-L3-L4-L5',
      );
    });
  },
};

export const ComputedWithValueStrategy: Story = {
  parameters: {
    docs: { description: { story: 'Computed values interact with keep + last/default/reset strategies.' } },
  },
  args: formConfig({
    toggle: { type: 'text', label: 'Toggle (type "hide")' },
    dep: {
      type: 'text',
      label: 'Dependency',
      defaultValue: 'D',
    },
    compLast: {
      type: 'text',
      label: 'Computed (keep + last)',
      computedValue: 'dep + "Z"',
      hidden: 'toggle === "hide"',
      hideStrategy: 'keep',
      valueStrategy: 'last',
    },
    compDefault: {
      type: 'text',
      label: 'Computed (keep + default)',
      defaultValue: 'DEFAULT',
      computedValue: 'dep + "Z"',
      hidden: 'toggle === "hide"',
      hideStrategy: 'keep',
      valueStrategy: 'default',
    },
    compReset: {
      type: 'text',
      label: 'Computed (keep + reset)',
      computedValue: 'dep + "Z"',
      hidden: 'toggle === "hide"',
      hideStrategy: 'keep',
      valueStrategy: 'reset',
    },
  }),
  play: async ({ canvas, userEvent }) => {
    const compLast = canvas.getByRole('textbox', { name: 'Computed (keep + last)' });
    const compDefault = canvas.getByRole('textbox', { name: 'Computed (keep + default)' });
    const compReset = canvas.getByRole('textbox', { name: 'Computed (keep + reset)' });

    // Initial computed values
    await waitFor(async () => {
      await expect(compLast).toHaveValue('DZ');
      await expect(compDefault).toHaveValue('DZ');
      await expect(compReset).toHaveValue('DZ');
    });

    // Update dependency
    const dep = canvas.getByRole('textbox', { name: 'Dependency' });
    await userEvent.clear(dep);
    await userEvent.type(dep, 'X');
    await waitFor(async () => {
      await expect(compLast).toHaveValue('XZ');
      await expect(compDefault).toHaveValue('XZ');
      await expect(compReset).toHaveValue('XZ');
    });

    // Hide all computed controls
    const toggle = canvas.getByRole('textbox', { name: 'Toggle (type "hide")' });
    await userEvent.clear(toggle);
    await userEvent.type(toggle, 'hide');
    await waitFor(async () => {
      await expect(
        canvas.queryByRole('textbox', { name: 'Computed (keep + last)' }),
      ).not.toBeInTheDocument();
      await expect(
        canvas.queryByRole('textbox', { name: 'Computed (keep + default)' }),
      ).not.toBeInTheDocument();
      await expect(
        canvas.queryByRole('textbox', { name: 'Computed (keep + reset)' }),
      ).not.toBeInTheDocument();
    });

    // Show again: each strategy produces a different result
    await userEvent.clear(toggle);
    await waitFor(async () => {
      // "last" preserves the last computed value
      await expect(canvas.getByRole('textbox', { name: 'Computed (keep + last)' })).toHaveValue('XZ');
      // "default" reverts to defaultValue
      await expect(canvas.getByRole('textbox', { name: 'Computed (keep + default)' })).toHaveValue('DEFAULT');
      // "reset" clears the value
      await expect(canvas.getByRole('textbox', { name: 'Computed (keep + reset)' })).toHaveValue('');
    });
  },
};

// ---------------------------------------------------------------------------
// Dynamic Properties
// ---------------------------------------------------------------------------

export const DynamicLabels: Story = {
  parameters: {
    docs: { description: { story: 'Dynamic label expressions update when the source field changes.' } },
  },
  args: formConfig({
    source: {
      type: 'text',
      label: 'Source',
      defaultValue: 'Initial',
    },
    target: {
      type: 'text',
      label: 'Static Target Label',
      dynamicLabel: "source + ' Dynamic Label'",
    },
    staticTarget: {
      type: 'text',
      label: 'Purely Static Label',
    },
  }),
  play: async ({ canvas, userEvent }) => {
    // Dynamic label shows evaluated expression
    await waitFor(async () => {
      await expect(canvas.getByText('Initial Dynamic Label')).toBeInTheDocument();
    });

    // Static label remains unchanged
    await expect(canvas.getByText('Purely Static Label')).toBeInTheDocument();

    // Update source changes dynamic label
    const source = canvas.getByRole('textbox', { name: 'Source' });
    await userEvent.clear(source);
    await userEvent.type(source, 'Updated');
    await waitFor(async () => {
      await expect(canvas.getByText('Updated Dynamic Label')).toBeInTheDocument();
    });
  },
};

// ---------------------------------------------------------------------------
// Helper functions for stories
// ---------------------------------------------------------------------------

function getGreeting(name: string): string {
  return `Greeting for ${name.length > 0 ? name : 'Guest'}`;
}

export const DynamicTitles: Story = {
  parameters: {
    docs: { description: { story: 'Dynamic titles on groups and labels on controls update reactively.' } },
  },
  args: formConfig({
    source: {
      type: 'text',
      label: 'Source',
      defaultValue: 'Initial',
    },
    targetGroup: {
      type: 'group',
      title: 'Static Group Title',
      dynamicTitle: "source + ' Dynamic Title'",
      legend: 'Target Group',
      controls: {},
    },
    parentGroup: {
      type: 'group',
      title: 'Static Parent Title',
      dynamicTitle: "'Parent: ' + source",
      legend: 'Parent Group',
      controls: {
        childControl: {
          type: 'text',
          label: 'Static Child Label',
          dynamicLabel: "'Child: ' + source",
        },
      },
    },
  }),
  play: async ({ canvas, userEvent }) => {
    // Dynamic title shows evaluated expression
    await waitFor(async () => {
      await expect(canvas.getByRole('group', { name: 'Initial Dynamic Title' })).toBeInTheDocument();
    });

    // Nested dynamic title and label
    await waitFor(async () => {
      await expect(canvas.getByRole('group', { name: 'Parent: Initial' })).toBeInTheDocument();
      await expect(canvas.getByText('Child: Initial')).toBeInTheDocument();
    });

    // Update source changes all dynamic properties
    const source = canvas.getByRole('textbox', { name: 'Source' });
    await userEvent.clear(source);
    await userEvent.type(source, 'Updated');
    await waitFor(async () => {
      await expect(canvas.getByRole('group', { name: 'Updated Dynamic Title' })).toBeInTheDocument();
      await expect(canvas.getByRole('group', { name: 'Parent: Updated' })).toBeInTheDocument();
      await expect(canvas.getByText('Child: Updated')).toBeInTheDocument();
    });
  },
};

// ---------------------------------------------------------------------------
// Computed Value – Additional Stories
// ---------------------------------------------------------------------------

export const BuiltInFunctionCalls: Story = {
  parameters: {
    docs: { description: { story: 'Computed expression calls .toUpperCase() on a field value.' } },
  },
  args: formConfig({
    raw: { type: 'text', label: 'Raw', defaultValue: 'mixedCase' },
    upper: { type: 'text', label: 'Uppercase', computedValue: 'raw.toUpperCase()' },
  }),
  play: async ({ canvas }) => {
    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'Uppercase' })).toHaveValue('MIXEDCASE');
    });
  },
};

export const ComputedPriority: Story = {
  parameters: {
    docs: { description: { story: 'computedValue takes priority over defaultValue.' } },
  },
  args: formConfig({
    mix: { type: 'text', label: 'Mix', defaultValue: 'INIT', computedValue: '"SHUTDOWN"' },
  }),
  play: async ({ canvas }) => {
    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'Mix' })).toHaveValue('SHUTDOWN');
    });
  },
};

export const ManualOverride: Story = {
  parameters: {
    docs: { description: { story: 'User can override a computed value; changing a dependency resets it.' } },
  },
  args: formConfig({
    part1: { type: 'text', label: 'Part 1', defaultValue: 'A' },
    part2: { type: 'text', label: 'Part 2', defaultValue: 'B' },
    combo: { type: 'text', label: 'Combo', computedValue: 'part1 + part2' },
  }),
  play: async ({ canvas, userEvent }) => {
    const combo = canvas.getByRole('textbox', { name: 'Combo' });

    // Verify initial computed value
    await waitFor(async () => {
      await expect(combo).toHaveValue('AB');
    });

    // Manually override the computed field
    await userEvent.clear(combo);
    await userEvent.type(combo, 'CUSTOM');
    await userEvent.tab();

    await waitFor(async () => {
      await expect(combo).toHaveValue('CUSTOM');
    });

    // Change a dependency – combo should revert to computed
    await userEvent.type(canvas.getByRole('textbox', { name: 'Part 1' }), 'X');

    await waitFor(async () => {
      await expect(combo).toHaveValue('AXB');
    });
  },
};

export const ManualOverridePersistence: Story = {
  parameters: {
    docs: { description: { story: 'Manual override persists when changing unrelated fields.' } },
  },
  args: formConfig({
    part1: { type: 'text', label: 'Part 1', defaultValue: 'A' },
    part2: { type: 'text', label: 'Part 2', defaultValue: 'B' },
    combo: { type: 'text', label: 'Combo', computedValue: 'part1 + part2' },
    unrelated: { type: 'text', label: 'Unrelated' },
  }),
  play: async ({ canvas, userEvent }) => {
    const combo = canvas.getByRole('textbox', { name: 'Combo' });

    // Verify initial computed value
    await waitFor(async () => {
      await expect(combo).toHaveValue('AB');
    });

    // Manually override the computed field
    await userEvent.clear(combo);
    await userEvent.type(combo, 'ManualEntry');
    await userEvent.tab();

    await waitFor(async () => {
      await expect(combo).toHaveValue('ManualEntry');
    });

    // Typing into an unrelated field should NOT reset the override
    const unrelated = canvas.getByRole('textbox', { name: 'Unrelated' });
    await userEvent.clear(unrelated);
    await userEvent.type(unrelated, 'Not relevant');

    await waitFor(async () => {
      await expect(combo).toHaveValue('ManualEntry');
    });

    // Changing a dependency resets the override
    const part1 = canvas.getByRole('textbox', { name: 'Part 1' });
    await userEvent.clear(part1);
    await userEvent.type(part1, 'X');

    await waitFor(async () => {
      await expect(combo).toHaveValue('XB');
    });
  },
};

export const CascadingManualOverride: Story = {
  parameters: {
    docs: { description: { story: 'Manual override on the deepest cascading level resets on base change.' } },
  },
  args: formConfig({
    level0_override: { type: 'text', label: 'Level 0', defaultValue: 'Initial' },
    level1_override: { type: 'text', label: 'Level 1', computedValue: 'level0_override + "-L1"' },
    level2_override: { type: 'text', label: 'Level 2', computedValue: 'level1_override + "-L2"' },
    level3_override: { type: 'text', label: 'Level 3', computedValue: 'level2_override + "-L3"' },
    level4_override: { type: 'text', label: 'Level 4', computedValue: 'level3_override + "-L4"' },
    level5_override: { type: 'text', label: 'Level 5', computedValue: 'level4_override + "-L5"' },
  }),
  play: async ({ canvas, userEvent }) => {
    const level0 = canvas.getByRole('textbox', { name: 'Level 0' });
    const level1 = canvas.getByRole('textbox', { name: 'Level 1' });
    const level2 = canvas.getByRole('textbox', { name: 'Level 2' });
    const level3 = canvas.getByRole('textbox', { name: 'Level 3' });
    const level4 = canvas.getByRole('textbox', { name: 'Level 4' });
    const level5 = canvas.getByRole('textbox', { name: 'Level 5' });

    // Verify initial cascaded values
    await waitFor(async () => {
      await expect(level5).toHaveValue(
        'Initial-L1-L2-L3-L4-L5',
      );
    });

    // Manually override level5
    await userEvent.clear(level5);
    await userEvent.type(level5, 'ManualOverride');
    await userEvent.tab();

    await waitFor(async () => {
      await expect(level5).toHaveValue('ManualOverride');
    });

    // Change the base – level5 should revert to computed
    await userEvent.clear(level0);
    await userEvent.type(level0, 'ChangedBase');

    await waitFor(async () => {
      await expect(level5).toHaveValue(
        'ChangedBase-L1-L2-L3-L4-L5',
      );
      // Verify all intermediate levels updated too
      await expect(level1).toHaveValue('ChangedBase-L1');
      await expect(level2).toHaveValue('ChangedBase-L1-L2');
      await expect(level3).toHaveValue('ChangedBase-L1-L2-L3');
      await expect(level4).toHaveValue(
        'ChangedBase-L1-L2-L3-L4',
      );
    });
  },
};

// ---------------------------------------------------------------------------
// Expression – Additional Stories
// ---------------------------------------------------------------------------

export const ComplexArithmeticExpressions: Story = {
  parameters: {
    docs: { description: { story: 'Arithmetic operators in hidden expressions (+, *, comparisons).' } },
  },
  args: formConfig({
    valueA: { type: 'text', label: 'Value A', defaultValue: '10' },
    valueB: { type: 'text', label: 'Value B', defaultValue: '20' },
    valueC: { type: 'text', label: 'Value C', defaultValue: '30' },
    hiddenByComplexExpression: {
      type: 'text',
      label: 'Hidden by complex expression',
      hidden: '+valueA + +valueB > +valueC',
      defaultValue: 'Should be hidden initially',
    },
    visibleByComplexExpression: {
      type: 'text',
      label: 'Visible by complex expression',
      hidden: '+valueA * +valueB < +valueC',
      defaultValue: 'Should be visible initially',
    },
  }),
  play: async ({ canvas, userEvent }) => {
    // Initial: 10+20>30 is false → visible. 10*20<30 is false → visible.
    await waitFor(async () => {
      await expect(
        canvas.getByRole('textbox', { name: 'Hidden by complex expression' }),
      ).toBeInTheDocument();
      await expect(
        canvas.getByRole('textbox', { name: 'Visible by complex expression' }),
      ).toBeInTheDocument();
    });

    // Set valueA to 20: 20+20>30=true → hidden. 20*20<30=false → visible.
    const valueA = canvas.getByRole('textbox', { name: 'Value A' });
    await userEvent.clear(valueA);
    await userEvent.type(valueA, '20');

    await waitFor(async () => {
      await expect(
        canvas.queryByRole('textbox', { name: 'Hidden by complex expression' }),
      ).not.toBeInTheDocument();
      await expect(
        canvas.getByRole('textbox', { name: 'Visible by complex expression' }),
      ).toBeInTheDocument();
    });

    // Set valueC to 500: 20*20<500=true → hidden.
    const valueC = canvas.getByRole('textbox', { name: 'Value C' });
    await userEvent.clear(valueC);
    await userEvent.type(valueC, '500');

    await waitFor(async () => {
      await expect(
        canvas.queryByRole('textbox', { name: 'Visible by complex expression' }),
      ).not.toBeInTheDocument();
    });
  },
};

export const MultipleDependencies: Story = {
  parameters: {
    docs: { description: { story: 'Multiple conditions with logical OR in a hidden expression.' } },
  },
  args: formConfig({
    showCondition: { type: 'text', label: 'Show Condition', defaultValue: 'no' },
    secondCondition: { type: 'text', label: 'Second Condition', defaultValue: 'no' },
    conditionalField: {
      type: 'text',
      label: 'Conditional Field',
      hidden: 'showCondition !== "yes" || secondCondition !== "yes"',
      defaultValue: 'Only visible when both conditions are "yes"',
    },
  }),
  play: async ({ canvas, userEvent }) => {
    // Initially hidden (both 'no')
    await waitFor(async () => {
      await expect(
        canvas.queryByRole('textbox', { name: 'Conditional Field' }),
      ).not.toBeInTheDocument();
    });

    // Set showCondition to 'yes' → still hidden (secondCondition is 'no')
    const showCondition = canvas.getByRole('textbox', { name: 'Show Condition' });
    await userEvent.clear(showCondition);
    await userEvent.type(showCondition, 'yes');

    await waitFor(async () => {
      await expect(
        canvas.queryByRole('textbox', { name: 'Conditional Field' }),
      ).not.toBeInTheDocument();
    });

    // Set secondCondition to 'yes' → now visible
    const secondCondition = canvas.getByRole('textbox', { name: 'Second Condition' });
    await userEvent.clear(secondCondition);
    await userEvent.type(secondCondition, 'yes');

    await waitFor(async () => {
      await expect(
        canvas.getByRole('textbox', { name: 'Conditional Field' }),
      ).toBeInTheDocument();
    });

    // Set showCondition to 'no' → hidden again
    await userEvent.clear(showCondition);
    await userEvent.type(showCondition, 'no');

    await waitFor(async () => {
      await expect(
        canvas.queryByRole('textbox', { name: 'Conditional Field' }),
      ).not.toBeInTheDocument();
    });
  },
};

export const FunctionHiddenKeepStrategy: Story = {
  parameters: {
    docs: { description: { story: 'Function-based hidden expression with keep strategy.' } },
  },
  args: formConfig({
    triggerFieldFuncKeep: {
      type: 'text',
      label: 'Type "hide" to hide target (keep)',
      defaultValue: '',
    },
    targetFieldFuncKeep: {
      type: 'text',
      label: 'Target Field (Function Hidden, Keep)',
      hidden: (formValue: FormContext) => formValue['triggerFieldFuncKeep'] === 'hide',
      hideStrategy: 'keep',
      defaultValue: 'I can be hidden by a function (kept in DOM)',
    },
  }),
  play: async ({ canvas, userEvent }) => {
    // Initially visible
    await waitFor(async () => {
      await expect(
        canvas.getByRole('textbox', { name: 'Target Field (Function Hidden, Keep)' }),
      ).toBeInTheDocument();
    });

    // Type 'hide' → hidden (not in document)
    const triggerField = canvas.getByRole('textbox', { name: 'Type "hide" to hide target (keep)' });
    await userEvent.clear(triggerField);
    await userEvent.type(triggerField, 'hide');

    await waitFor(async () => {
      await expect(
        canvas.queryByRole('textbox', { name: 'Target Field (Function Hidden, Keep)' }),
      ).not.toBeInTheDocument();
    });

    // Clear → visible again
    await userEvent.clear(triggerField);

    await waitFor(async () => {
      await expect(
        canvas.getByRole('textbox', { name: 'Target Field (Function Hidden, Keep)' }),
      ).toBeInTheDocument();
    });
  },
};

export const ExternalFunctionCall: Story = {
  parameters: {
    docs: { description: { story: 'Dynamic label uses an external helper function.' } },
  },
  args: formConfig({
    nameForLabel: { type: 'text', label: 'Name', defaultValue: 'User' },
    targetFieldLabelFunc: {
      type: 'text',
      dynamicLabel: (formValue: FormContext): string => {
        const name = (formValue['nameForLabel'] as string | undefined) ?? '';
        return getGreeting(name);
      },
      defaultValue: 'Some value',
    },
  }),
  play: async ({ canvas, userEvent }) => {
    // Verify initial label
    await waitFor(async () => {
      await expect(canvas.getByText('Greeting for User')).toBeInTheDocument();
    });

    // Clear name, type 'Alice' → label updates
    const nameForLabel = canvas.getByRole('textbox', { name: 'Name' });
    await userEvent.clear(nameForLabel);
    await userEvent.type(nameForLabel, 'Alice');

    await waitFor(async () => {
      await expect(canvas.getByText('Greeting for Alice')).toBeInTheDocument();
    });

    // Clear name → label shows Guest
    await userEvent.clear(nameForLabel);

    await waitFor(async () => {
      await expect(canvas.getByText('Greeting for Guest')).toBeInTheDocument();
    });
  },
};

// ---------------------------------------------------------------------------
// Disabled/Readonly – Additional Stories
// ---------------------------------------------------------------------------

export const GroupDisabledWithOverride: Story = {
  parameters: {
    docs: { description: { story: 'Group disabled with individual controls overriding to enabled.' } },
  },
  args: formConfig({
    first: {
      type: 'text',
      label: 'First',
      defaultValue: 'default-first',
      disabled: true,
    },
    'first-group': {
      type: 'group',
      legend: 'First Group',
      disabled: true,
      controls: {
        'grouped-first': {
          type: 'text',
          label: 'Grouped First',
          defaultValue: 'default-grouped-first',
        },
        'grouped-overwritten': {
          type: 'text',
          label: 'Grouped Overwritten',
          defaultValue: 'default-grouped-overwritten',
          disabled: false,
        },
        'nested-group': {
          type: 'group',
          legend: 'Nested Group',
          controls: {
            'nested-second': {
              type: 'text',
              label: 'Nested Second',
              defaultValue: 'default-nested-second',
            },
            'nested-overwritten': {
              type: 'text',
              label: 'Nested Overwritten',
              defaultValue: 'default-nested-overwritten',
              disabled: false,
            },
          },
        },
      },
    },
  }),
  play: async ({ canvas }) => {
    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'First' })).toBeDisabled();
      await expect(canvas.getByRole('textbox', { name: 'Grouped First' })).toBeDisabled();
      await expect(canvas.getByRole('textbox', { name: 'Nested Second' })).toBeDisabled();
      await expect(canvas.getByRole('textbox', { name: 'Grouped Overwritten' })).not.toBeDisabled();
      await expect(canvas.getByRole('textbox', { name: 'Nested Overwritten' })).not.toBeDisabled();
    });
  },
};

export const InitialDisabledState: Story = {
  parameters: {
    docs: { description: { story: 'Initial state matches disabled condition from default value.' } },
  },
  args: formConfig({
    disableControl: {
      type: 'text',
      label: 'Type "disable"',
      defaultValue: 'disable',
    },
    first: {
      type: 'text',
      label: 'First',
      defaultValue: 'default-first',
      disabled: 'disableControl === "disable"',
    },
    'first-group': {
      type: 'group',
      legend: 'First Group',
      disabled: 'disableControl === "disable"',
      controls: {
        'grouped-first': {
          type: 'text',
          label: 'Grouped First',
          defaultValue: 'default-grouped-first',
        },
        'nested-group': {
          type: 'group',
          legend: 'Nested Group',
          controls: {
            'nested-second': {
              type: 'text',
              label: 'Nested Second',
              defaultValue: 'default-nested-second',
            },
          },
        },
      },
    },
  }),
  play: async ({ canvas, userEvent }) => {
    // Initially all disabled (defaultValue matches condition)
    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'First' })).toBeDisabled();
      await expect(canvas.getByRole('textbox', { name: 'Grouped First' })).toBeDisabled();
      await expect(canvas.getByRole('textbox', { name: 'Nested Second' })).toBeDisabled();
    });

    // Clear disableControl → all become enabled
    await userEvent.clear(canvas.getByRole('textbox', { name: 'Type "disable"' }));

    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'First' })).not.toBeDisabled();
      await expect(canvas.getByRole('textbox', { name: 'Grouped First' })).not.toBeDisabled();
      await expect(canvas.getByRole('textbox', { name: 'Nested Second' })).not.toBeDisabled();
    });
  },
};

export const GroupReadonlyWithOverride: Story = {
  parameters: {
    docs: { description: { story: 'Group readonly with individual controls overriding to editable.' } },
  },
  args: formConfig({
    first: {
      type: 'text',
      label: 'First',
      defaultValue: 'default-first',
      readonly: true,
    },
    'first-group': {
      type: 'group',
      legend: 'First Group',
      readonly: true,
      controls: {
        'grouped-first': {
          type: 'text',
          label: 'Grouped First',
          defaultValue: 'default-grouped-first',
        },
        'grouped-overwritten': {
          type: 'text',
          label: 'Grouped Overwritten',
          defaultValue: 'default-grouped-overwritten',
          readonly: false,
        },
        'nested-group': {
          type: 'group',
          legend: 'Nested Group',
          controls: {
            'nested-second': {
              type: 'text',
              label: 'Nested Second',
              defaultValue: 'default-nested-second',
            },
            'nested-overwritten': {
              type: 'text',
              label: 'Nested Overwritten',
              defaultValue: 'default-nested-overwritten',
              readonly: false,
            },
          },
        },
      },
    },
  }),
  play: async ({ canvas }) => {
    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'First' })).toHaveAttribute('readonly');
      await expect(canvas.getByRole('textbox', { name: 'Grouped First' })).toHaveAttribute(
        'readonly',
      );
      await expect(canvas.getByRole('textbox', { name: 'Nested Second' })).toHaveAttribute('readonly');
      await expect(canvas.getByRole('textbox', { name: 'Grouped Overwritten' })).not.toHaveAttribute('readonly');
      await expect(canvas.getByRole('textbox', { name: 'Nested Overwritten' })).not.toHaveAttribute('readonly');
    });
  },
};

export const InitialReadonlyState: Story = {
  parameters: {
    docs: { description: { story: 'Initial state matches readonly condition from default value.' } },
  },
  args: formConfig({
    readonlyControl: {
      type: 'text',
      label: 'Type "readonly"',
      defaultValue: 'readonly',
    },
    first: {
      type: 'text',
      label: 'First',
      defaultValue: 'default-first',
      readonly: 'readonlyControl === "readonly"',
    },
    'first-group': {
      type: 'group',
      legend: 'First Group',
      readonly: 'readonlyControl === "readonly"',
      controls: {
        'grouped-first': {
          type: 'text',
          label: 'Grouped First',
          defaultValue: 'default-grouped-first',
        },
        'nested-group': {
          type: 'group',
          legend: 'Nested Group',
          controls: {
            'nested-second': {
              type: 'text',
              label: 'Nested Second',
              defaultValue: 'default-nested-second',
            },
          },
        },
      },
    },
  }),
  play: async ({ canvas, userEvent }) => {
    // Initially all readonly (defaultValue matches condition)
    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'First' })).toHaveAttribute('readonly');
      await expect(canvas.getByRole('textbox', { name: 'Grouped First' })).toHaveAttribute(
        'readonly',
      );
      await expect(canvas.getByRole('textbox', { name: 'Nested Second' })).toHaveAttribute('readonly');
    });

    // Clear readonlyControl → all become not readonly
    await userEvent.clear(canvas.getByRole('textbox', { name: 'Type "readonly"' }));

    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'First' })).not.toHaveAttribute('readonly');
      await expect(canvas.getByRole('textbox', { name: 'Grouped First' })).not.toHaveAttribute('readonly');
      await expect(canvas.getByRole('textbox', { name: 'Nested Second' })).not.toHaveAttribute('readonly');
    });
  },
};

// ---------------------------------------------------------------------------
// Dynamic Properties – Additional Stories
// ---------------------------------------------------------------------------

export const StaticLabelFallback: Story = {
  parameters: {
    docs: { description: { story: 'Static label renders when no dynamic label is set.' } },
  },
  args: formConfig({
    target: { type: 'text', label: 'Purely Static Label' },
  }),
  play: async ({ canvas }) => {
    await waitFor(async () => {
      await expect(canvas.getByText('Purely Static Label')).toBeInTheDocument();
    });
  },
};

export const StaticTitleFallback: Story = {
  parameters: {
    docs: { description: { story: 'Static group title renders when no dynamic title is set.' } },
  },
  args: formConfig({
    targetGroup: {
      type: 'group',
      legend: 'Purely Static Title',
      controls: {},
    },
  }),
  play: async ({ canvas }) => {
    await waitFor(async () => {
      await expect(canvas.getByRole('group', { name: 'Purely Static Title' })).toBeInTheDocument();
    });
  },
};
