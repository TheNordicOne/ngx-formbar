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

async function clearAndType(
  userEvent: any,
  input: HTMLInputElement,
  value: string,
): Promise<void> {
  await userEvent.clear(input);
  await userEvent.type(input, value);
}

function getInput(canvas: any, testId: string): HTMLInputElement {
  return canvas.getByTestId(testId) as HTMLInputElement;
}

// ---------------------------------------------------------------------------
// Disabling
// ---------------------------------------------------------------------------

export const StaticDisabled: Story = {
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
      await expect(getInput(canvas, 'first-input')).toBeDisabled();
      await expect(getInput(canvas, 'first-group-grouped-first-input')).toBeDisabled();
      await expect(getInput(canvas, 'first-group-nested-group-nested-second-input')).toBeDisabled();
    });
  },
};

export const ConditionalDisabled: Story = {
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
      await expect(getInput(canvas, 'first-input')).not.toBeDisabled();
      await expect(getInput(canvas, 'first-group-grouped-first-input')).not.toBeDisabled();
      await expect(getInput(canvas, 'first-group-nested-group-nested-second-input')).not.toBeDisabled();
    });

    // Type "disable" to trigger the expression
    await clearAndType(userEvent, getInput(canvas, 'disableControl-input'), 'disable');

    await waitFor(async () => {
      await expect(getInput(canvas, 'first-input')).toBeDisabled();
      await expect(getInput(canvas, 'first-group-grouped-first-input')).toBeDisabled();
      await expect(getInput(canvas, 'first-group-nested-group-nested-second-input')).toBeDisabled();
    });

    // Clear the trigger to re-enable
    await clearAndType(
      userEvent,
      getInput(canvas, 'disableControl-input'),
      'something else',
    );

    await waitFor(async () => {
      await expect(getInput(canvas, 'first-input')).not.toBeDisabled();
      await expect(getInput(canvas, 'first-group-grouped-first-input')).not.toBeDisabled();
      await expect(getInput(canvas, 'first-group-nested-group-nested-second-input')).not.toBeDisabled();
    });
  },
};

// ---------------------------------------------------------------------------
// Readonly
// ---------------------------------------------------------------------------

export const StaticReadonly: Story = {
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
      await expect(getInput(canvas, 'first-input')).toHaveAttribute('readonly');
      await expect(getInput(canvas, 'first-group-grouped-first-input')).toHaveAttribute(
        'readonly',
      );
      await expect(getInput(canvas, 'first-group-nested-group-nested-second-input')).toHaveAttribute(
        'readonly',
      );
    });
  },
};

export const ConditionalReadonly: Story = {
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
      await expect(getInput(canvas, 'first-input')).not.toHaveAttribute('readonly');
      await expect(getInput(canvas, 'first-group-grouped-first-input')).not.toHaveAttribute(
        'readonly',
      );
      await expect(getInput(canvas, 'first-group-nested-group-nested-second-input')).not.toHaveAttribute(
        'readonly',
      );
    });

    // Type "readonly" to trigger the expression
    await clearAndType(
      userEvent,
      getInput(canvas, 'readonlyControl-input'),
      'readonly',
    );

    await waitFor(async () => {
      await expect(getInput(canvas, 'first-input')).toHaveAttribute('readonly');
      await expect(getInput(canvas, 'first-group-grouped-first-input')).toHaveAttribute(
        'readonly',
      );
      await expect(getInput(canvas, 'first-group-nested-group-nested-second-input')).toHaveAttribute(
        'readonly',
      );
    });

    // Clear to remove readonly
    await clearAndType(
      userEvent,
      getInput(canvas, 'readonlyControl-input'),
      'something else',
    );

    await waitFor(async () => {
      await expect(getInput(canvas, 'first-input')).not.toHaveAttribute('readonly');
      await expect(getInput(canvas, 'first-group-grouped-first-input')).not.toHaveAttribute(
        'readonly',
      );
      await expect(getInput(canvas, 'first-group-nested-group-nested-second-input')).not.toHaveAttribute(
        'readonly',
      );
    });
  },
};

// ---------------------------------------------------------------------------
// Hidden / Expressions
// ---------------------------------------------------------------------------

export const FunctionExpressions: Story = {
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
        canvas.getByTestId('hiddenTarget-input'),
      ).toBeInTheDocument();
      await expect(getInput(canvas, 'disabledTarget-input')).not.toBeDisabled();
      await expect(getInput(canvas, 'readonlyTarget-input')).not.toHaveAttribute(
        'readonly',
      );
    });

    // Computed value from function
    await waitFor(async () => {
      await expect(getInput(canvas, 'computedTarget-input')).toHaveValue(
        'Hello World!',
      );
    });

    // Dynamic label from function
    await waitFor(async () => {
      await expect(canvas.getByTestId('labelTarget-label')).toHaveTextContent(
        'Greeting for User',
      );
    });

    // Trigger hidden
    await clearAndType(userEvent, getInput(canvas, 'triggerField-input'), 'hide');
    await waitFor(async () => {
      await expect(
        canvas.queryByTestId('hiddenTarget-input'),
      ).not.toBeInTheDocument();
    });

    // Trigger disabled
    await clearAndType(userEvent, getInput(canvas, 'triggerField-input'), 'disable');
    await waitFor(async () => {
      await expect(
        canvas.getByTestId('hiddenTarget-input'),
      ).toBeInTheDocument();
      await expect(getInput(canvas, 'disabledTarget-input')).toBeDisabled();
    });

    // Trigger readonly
    await clearAndType(userEvent, getInput(canvas, 'triggerField-input'), 'readonly');
    await waitFor(async () => {
      await expect(getInput(canvas, 'disabledTarget-input')).not.toBeDisabled();
      await expect(getInput(canvas, 'readonlyTarget-input')).toHaveAttribute(
        'readonly',
      );
    });

    // Update computed sources
    await clearAndType(userEvent, getInput(canvas, 'sourceA-input'), 'Goodbye');
    await waitFor(async () => {
      await expect(getInput(canvas, 'computedTarget-input')).toHaveValue(
        'Goodbye World!',
      );
    });

    // Update dynamic label source
    await clearAndType(userEvent, getInput(canvas, 'nameForLabel-input'), 'Alice');
    await waitFor(async () => {
      await expect(canvas.getByTestId('labelTarget-label')).toHaveTextContent(
        'Greeting for Alice',
      );
    });
  },
};

export const DeepHierarchyVisibility: Story = {
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
      await expect(canvas.getByTestId('level1-level2A-level2AField-input')).toBeInTheDocument();
      await expect(canvas.getByTestId('level1-level2B-level3A-level3AField-input')).toBeInTheDocument();
      await expect(canvas.getByTestId('level1-level2B-level3B-level3BField-input')).toBeInTheDocument();
    });

    // Hide fields with the toggle control
    await clearAndType(userEvent, getInput(canvas, 'toggleControl-input'), 'hide');

    // Fields with hidden condition should be hidden
    await waitFor(async () => {
      await expect(
        canvas.queryByTestId('level1-level2A-level2AField-input'),
      ).not.toBeInTheDocument();
      await expect(
        canvas.queryByTestId('level1-level2B-level3A-level3AField-input'),
      ).not.toBeInTheDocument();
      await expect(
        canvas.queryByTestId('level1-level2B-level3B-group'),
      ).not.toBeInTheDocument();
    });

    // Fields without hidden condition should still be visible
    await expect(canvas.getByTestId('rootField-input')).toBeInTheDocument();
    await expect(canvas.getByTestId('level1-level1Field-input')).toBeInTheDocument();
    await expect(canvas.getByTestId('level1-level2B-level2BField-input')).toBeInTheDocument();

    // Show fields again by clearing the toggle control
    await userEvent.clear(getInput(canvas, 'toggleControl-input'));

    // All fields should be visible again
    await waitFor(async () => {
      await expect(canvas.getByTestId('level1-level2A-level2AField-input')).toBeInTheDocument();
      await expect(canvas.getByTestId('level1-level2B-level3A-level3AField-input')).toBeInTheDocument();
      await expect(canvas.getByTestId('level1-level2B-level3B-level3BField-input')).toBeInTheDocument();
    });
  },
};

export const CrossGroupDependencies: Story = {
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
        canvas.queryByTestId('branchB-nestedGroup-dependentField-input'),
      ).not.toBeInTheDocument();
    });

    // Set the toggle field value to "show"
    await clearAndType(userEvent, getInput(canvas, 'branchA-toggleField-input'), 'show');

    // Dependent field should now be visible
    await waitFor(async () => {
      await expect(
        canvas.getByTestId('branchB-nestedGroup-dependentField-input'),
      ).toBeInTheDocument();
    });

    // Change toggle field to something else
    await clearAndType(userEvent, getInput(canvas, 'branchA-toggleField-input'), 'hide');

    // Dependent field should be hidden again
    await waitFor(async () => {
      await expect(
        canvas.queryByTestId('branchB-nestedGroup-dependentField-input'),
      ).not.toBeInTheDocument();
    });
  },
};

// ---------------------------------------------------------------------------
// Computed Values
// ---------------------------------------------------------------------------

export const ComputedValue: Story = {
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
    // String concatenation
    await waitFor(async () => {
      await expect(getInput(canvas, 'fullName-input')).toHaveValue('Jane Doe');
    });

    await clearAndType(userEvent, getInput(canvas, 'firstName-input'), 'John');
    await waitFor(async () => {
      await expect(getInput(canvas, 'fullName-input')).toHaveValue('John Doe');
    });

    await clearAndType(userEvent, getInput(canvas, 'lastName-input'), 'Smith');
    await waitFor(async () => {
      await expect(getInput(canvas, 'fullName-input')).toHaveValue('John Smith');
    });

    // Numeric computation
    await waitFor(async () => {
      await expect(getInput(canvas, 'square-input')).toHaveValue('25');
    });

    await clearAndType(userEvent, getInput(canvas, 'base-input'), '7');
    await waitFor(async () => {
      await expect(getInput(canvas, 'square-input')).toHaveValue('49');
    });

    // Fallback when empty
    await waitFor(async () => {
      await expect(getInput(canvas, 'fallback-input')).toHaveValue('DEFAULT');
    });

    await userEvent.type(getInput(canvas, 'maybeEmpty-input'), 'Foo');
    await waitFor(async () => {
      await expect(getInput(canvas, 'fallback-input')).toHaveValue('Foo');
    });
  },
};

export const CascadingComputed: Story = {
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
    // Verify initial cascaded values
    await waitFor(async () => {
      await expect(getInput(canvas, 'level0-input')).toHaveValue('Start');
      await expect(getInput(canvas, 'level1-input')).toHaveValue('Start-L1');
      await expect(getInput(canvas, 'level2-input')).toHaveValue('Start-L1-L2');
      await expect(getInput(canvas, 'level3-input')).toHaveValue('Start-L1-L2-L3');
      await expect(getInput(canvas, 'level4-input')).toHaveValue(
        'Start-L1-L2-L3-L4',
      );
      await expect(getInput(canvas, 'level5-input')).toHaveValue(
        'Start-L1-L2-L3-L4-L5',
      );
    });

    // Update the base value
    await clearAndType(userEvent, getInput(canvas, 'level0-input'), 'Updated');

    // Verify all dependent values are updated
    await waitFor(async () => {
      await expect(getInput(canvas, 'level1-input')).toHaveValue('Updated-L1');
      await expect(getInput(canvas, 'level2-input')).toHaveValue('Updated-L1-L2');
      await expect(getInput(canvas, 'level3-input')).toHaveValue(
        'Updated-L1-L2-L3',
      );
      await expect(getInput(canvas, 'level4-input')).toHaveValue(
        'Updated-L1-L2-L3-L4',
      );
      await expect(getInput(canvas, 'level5-input')).toHaveValue(
        'Updated-L1-L2-L3-L4-L5',
      );
    });
  },
};

export const ComputedWithValueStrategy: Story = {
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
    // Initial computed values
    await waitFor(async () => {
      await expect(getInput(canvas, 'compLast-input')).toHaveValue('DZ');
      await expect(getInput(canvas, 'compDefault-input')).toHaveValue('DZ');
      await expect(getInput(canvas, 'compReset-input')).toHaveValue('DZ');
    });

    // Update dependency
    await clearAndType(userEvent, getInput(canvas, 'dep-input'), 'X');
    await waitFor(async () => {
      await expect(getInput(canvas, 'compLast-input')).toHaveValue('XZ');
      await expect(getInput(canvas, 'compDefault-input')).toHaveValue('XZ');
      await expect(getInput(canvas, 'compReset-input')).toHaveValue('XZ');
    });

    // Hide all computed controls
    await clearAndType(userEvent, getInput(canvas, 'toggle-input'), 'hide');
    await waitFor(async () => {
      await expect(
        canvas.queryByTestId('compLast-input'),
      ).not.toBeInTheDocument();
      await expect(
        canvas.queryByTestId('compDefault-input'),
      ).not.toBeInTheDocument();
      await expect(
        canvas.queryByTestId('compReset-input'),
      ).not.toBeInTheDocument();
    });

    // Show again: each strategy produces a different result
    await userEvent.clear(getInput(canvas, 'toggle-input'));
    await waitFor(async () => {
      // "last" preserves the last computed value
      await expect(getInput(canvas, 'compLast-input')).toHaveValue('XZ');
      // "default" reverts to defaultValue
      await expect(getInput(canvas, 'compDefault-input')).toHaveValue('DEFAULT');
      // "reset" clears the value
      await expect(getInput(canvas, 'compReset-input')).toHaveValue('');
    });
  },
};

// ---------------------------------------------------------------------------
// Dynamic Properties
// ---------------------------------------------------------------------------

export const DynamicLabels: Story = {
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
      await expect(canvas.getByTestId('target-label')).toHaveTextContent(
        'Initial Dynamic Label',
      );
    });

    // Static label remains unchanged
    await expect(canvas.getByTestId('staticTarget-label')).toHaveTextContent(
      'Purely Static Label',
    );

    // Update source changes dynamic label
    await clearAndType(userEvent, getInput(canvas, 'source-input'), 'Updated');
    await waitFor(async () => {
      await expect(canvas.getByTestId('target-label')).toHaveTextContent(
        'Updated Dynamic Label',
      );
    });
  },
};

export const DynamicTitles: Story = {
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
      await expect(canvas.getByTestId('targetGroup-title')).toHaveTextContent(
        'Initial Dynamic Title',
      );
    });

    // Nested dynamic title and label
    await waitFor(async () => {
      await expect(canvas.getByTestId('parentGroup-title')).toHaveTextContent(
        'Parent: Initial',
      );
      await expect(canvas.getByTestId('parentGroup-childControl-label')).toHaveTextContent(
        'Child: Initial',
      );
    });

    // Update source changes all dynamic properties
    await clearAndType(userEvent, getInput(canvas, 'source-input'), 'Updated');
    await waitFor(async () => {
      await expect(canvas.getByTestId('targetGroup-title')).toHaveTextContent(
        'Updated Dynamic Title',
      );
      await expect(canvas.getByTestId('parentGroup-title')).toHaveTextContent(
        'Parent: Updated',
      );
      await expect(canvas.getByTestId('parentGroup-childControl-label')).toHaveTextContent(
        'Child: Updated',
      );
    });
  },
};
