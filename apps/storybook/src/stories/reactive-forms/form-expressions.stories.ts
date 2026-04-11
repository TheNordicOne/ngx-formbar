import type { Meta, StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import type { FormContext } from '@ngx-formbar/core';
import { StoryFormHostComponent } from './story-form-host.component';
import { formConfig } from './story-helpers';

const meta: Meta<StoryFormHostComponent> = {
  title: 'Reactive Forms/Form Expressions',
  component: StoryFormHostComponent,
};

export default meta;
type Story = StoryObj<StoryFormHostComponent>;

// ---------------------------------------------------------------------------
// Function Hidden (Remove Strategy)
// ---------------------------------------------------------------------------

export const FunctionHidden: Story = {
  parameters: {
    docs: { description: { story: 'Function-based hidden expression removes the field from the DOM.' } },
  },
  args: {
    formConfig: formConfig({
      trigger: {
        type: 'text',
        label: 'Type "hide" to hide target',
        defaultValue: '',
      },
      target: {
        type: 'text',
        label: 'Target',
        hidden: (formValue: FormContext) => formValue['trigger'] === 'hide',
        defaultValue: 'I can be hidden',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    // Initially visible
    await expect(
      await canvas.findByRole('textbox', { name: 'Target' }),
    ).toBeInTheDocument();

    // Type "hide" → field removed from DOM
    const trigger = await canvas.findByRole('textbox', { name: 'Type "hide" to hide target' });
    await userEvent.type(trigger, 'hide');
    await expect(
      canvas.queryByRole('textbox', { name: 'Target' }),
    ).not.toBeInTheDocument();

    // Clear → field reappears
    await userEvent.clear(trigger);
    await expect(
      await canvas.findByRole('textbox', { name: 'Target' }),
    ).toBeInTheDocument();
  },
};

// ---------------------------------------------------------------------------
// Deep Hierarchy Visibility
// ---------------------------------------------------------------------------

export const DeepHierarchyVisibility: Story = {
  parameters: {
    docs: { description: { story: 'Hidden expressions across three levels of nesting with mixed strategies.' } },
  },
  args: {
    formConfig: formConfig({
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
  },
  play: async ({ canvas, userEvent }) => {
    // Initially all fields should be visible
    await expect(await canvas.findByRole('textbox', { name: 'Level 2A Field' })).toBeInTheDocument();
    await expect(await canvas.findByRole('textbox', { name: 'Level 3A Field' })).toBeInTheDocument();
    await expect(await canvas.findByRole('textbox', { name: 'Level 3B Field' })).toBeInTheDocument();

    // Hide fields with the toggle control
    const toggleControl = await canvas.findByRole('textbox', { name: 'Type "hide" to hide nested fields' });
    await userEvent.clear(toggleControl);
    await userEvent.type(toggleControl, 'hide');

    // Fields with hidden condition should be hidden
    await expect(
      canvas.queryByRole('textbox', { name: 'Level 2A Field' }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole('textbox', { name: 'Level 3A Field' }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole('group', { name: 'Level 3B' }),
    ).not.toBeInTheDocument();

    // Fields without hidden condition should still be visible
    await expect(await canvas.findByRole('textbox', { name: 'Root level field' })).toBeInTheDocument();
    await expect(await canvas.findByRole('textbox', { name: 'Level 1 Field' })).toBeInTheDocument();
    await expect(await canvas.findByRole('textbox', { name: 'Level 2B Field' })).toBeInTheDocument();

    // Show fields again by clearing the toggle control
    await userEvent.clear(toggleControl);

    // All fields should be visible again
    await expect(await canvas.findByRole('textbox', { name: 'Level 2A Field' })).toBeInTheDocument();
    await expect(await canvas.findByRole('textbox', { name: 'Level 3A Field' })).toBeInTheDocument();
    await expect(await canvas.findByRole('textbox', { name: 'Level 3B Field' })).toBeInTheDocument();
  },
};

// ---------------------------------------------------------------------------
// Cross-Group Dependencies
// ---------------------------------------------------------------------------

export const CrossGroupDependencies: Story = {
  parameters: {
    docs: { description: { story: 'A field in one group depends on a field in another group.' } },
  },
  args: {
    formConfig: formConfig({
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
  },
  play: async ({ canvas, userEvent }) => {
    // Initially dependent field should be hidden
    await expect(
      canvas.queryByRole('textbox', { name: 'Dependent Field' }),
    ).not.toBeInTheDocument();

    // Set the toggle field value to "show"
    const toggleField = await canvas.findByRole('textbox', { name: 'Type "show" to reveal field in Branch B' });
    await userEvent.clear(toggleField);
    await userEvent.type(toggleField, 'show');

    // Dependent field should now be visible
    await expect(
      await canvas.findByRole('textbox', { name: 'Dependent Field' }),
    ).toBeInTheDocument();

    // Change toggle field to something else
    await userEvent.clear(toggleField);
    await userEvent.type(toggleField, 'hide');

    // Dependent field should be hidden again
    await expect(
      canvas.queryByRole('textbox', { name: 'Dependent Field' }),
    ).not.toBeInTheDocument();
  },
};

// ---------------------------------------------------------------------------
// Undefined comparison for missing fields
// ---------------------------------------------------------------------------

export const UndefinedComparisonForMissingField: Story = {
  parameters: {
    docs: { description: { story: 'An expression using === undefined on a field that does not exist in the form.' } },
  },
  args: {
    formConfig: formConfig({
      field: {
        type: 'text',
        label: 'Disabled because "nonExistent" is absent',
        defaultValue: '',
        disabled: 'nonExistent === undefined',
      },
    }),
  },
  play: async ({ canvas }) => {
    const field = await canvas.findByRole('textbox', { name: 'Disabled because "nonExistent" is absent' });
    await expect(field).toBeDisabled();
  },
};

export const UndefinedComparisonForPresentField: Story = {
  parameters: {
    docs: { description: { story: 'An expression using === undefined on a field that exists — should evaluate to false.' } },
  },
  args: {
    formConfig: formConfig({
      existing: {
        type: 'text',
        label: 'This field exists',
        defaultValue: 'hello',
      },
      field: {
        type: 'text',
        label: 'Enabled because "existing" is present',
        defaultValue: '',
        disabled: 'existing === undefined',
      },
    }),
  },
  play: async ({ canvas }) => {
    const field = await canvas.findByRole('textbox', { name: 'Enabled because "existing" is present' });
    await expect(field).toBeEnabled();
  },
};

export const UndefinedComparisonAfterStructuralRemoval: Story = {
  parameters: {
    docs: { description: { story: 'An expression using === undefined on a field that was present but got structurally removed.' } },
  },
  args: {
    formConfig: formConfig({
      trigger: {
        type: 'text',
        label: 'Type "hide" to remove the checked field',
        defaultValue: '',
      },
      checked: {
        type: 'text',
        label: 'Removed when trigger is "hide"',
        defaultValue: 'here',
        hidden: 'trigger === "hide"',
        hideStrategy: 'remove',
      },
      observer: {
        type: 'text',
        label: 'Disabled when checked field is absent',
        defaultValue: '',
        disabled: 'checked === undefined',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const checked = await canvas.findByRole('textbox', { name: 'Removed when trigger is "hide"' });
    const observer = await canvas.findByRole('textbox', { name: 'Disabled when checked field is absent' });
    await expect(checked).toBeInTheDocument();
    await expect(observer).toBeEnabled();

    const trigger = await canvas.findByRole('textbox', { name: 'Type "hide" to remove the checked field' });
    await userEvent.clear(trigger);
    await userEvent.type(trigger, 'hide');

    await expect(
      canvas.queryByRole('textbox', { name: 'Removed when trigger is "hide"' }),
    ).not.toBeInTheDocument();

    const observerAfter = await canvas.findByRole('textbox', { name: 'Disabled when checked field is absent' });
    await expect(observerAfter).toBeDisabled();
  },
};

export const UndefinedComparisonAfterStructuralAddition: Story = {
  parameters: {
    docs: { description: { story: 'An expression using === undefined updates when a structurally hidden field reappears.' } },
  },
  args: {
    formConfig: formConfig({
      trigger: {
        type: 'text',
        label: 'Clear to show the checked field',
        defaultValue: 'hide',
      },
      checked: {
        type: 'text',
        label: 'Removed when trigger is "hide"',
        defaultValue: 'here',
        hidden: 'trigger === "hide"',
        hideStrategy: 'remove',
      },
      observer: {
        type: 'text',
        label: 'Disabled when checked field is absent',
        defaultValue: '',
        disabled: 'checked === undefined',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    // Initially: checked is absent, observer is disabled
    await expect(
      canvas.queryByRole('textbox', { name: 'Removed when trigger is "hide"' }),
    ).not.toBeInTheDocument();

    const observer = await canvas.findByRole('textbox', { name: 'Disabled when checked field is absent' });
    await expect(observer).toBeDisabled();

    // Clear trigger — checked reappears
    const trigger = await canvas.findByRole('textbox', { name: 'Clear to show the checked field' });
    await userEvent.clear(trigger);

    await canvas.findByRole('textbox', { name: 'Removed when trigger is "hide"' });

    // Observer should now be enabled — checked exists in the form
    const observerAfter = await canvas.findByRole('textbox', { name: 'Disabled when checked field is absent' });
    await expect(observerAfter).toBeEnabled();
  },
};

// ---------------------------------------------------------------------------
// Expressions referencing a structurally absent field on initial render
// ---------------------------------------------------------------------------

export const DisabledExpressionWithInitiallyAbsentField: Story = {
  parameters: {
    docs: { description: { story: 'A disabled expression referencing a field that starts structurally hidden evaluates correctly on initial render.' } },
  },
  args: {
    formConfig: formConfig({
      trigger: {
        type: 'text',
        label: 'Clear to show the source field',
        defaultValue: 'hide',
      },
      source: {
        type: 'text',
        label: 'Removed when trigger is "hide"',
        defaultValue: 'lock',
        hidden: 'trigger === "hide"',
        hideStrategy: 'remove',
      },
      target: {
        type: 'text',
        label: 'Disabled while source is "lock"',
        defaultValue: '',
        disabled: 'source === "lock"',
      },
    }),
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByRole('textbox', { name: 'Removed when trigger is "hide"' }),
    ).not.toBeInTheDocument();

    // source is absent (not "lock"), so target should be enabled
    const target = await canvas.findByRole('textbox', { name: 'Disabled while source is "lock"' });
    await expect(target).toBeEnabled();
  },
};

export const ComputedValueWithInitiallyAbsentField: Story = {
  parameters: {
    docs: { description: { story: 'A computed value referencing a field that starts structurally hidden evaluates correctly on initial render.' } },
  },
  args: {
    formConfig: formConfig({
      trigger: {
        type: 'text',
        label: 'Clear to show the source field',
        defaultValue: 'hide',
      },
      source: {
        type: 'text',
        label: 'Removed when trigger is "hide"',
        defaultValue: 'world',
        hidden: 'trigger === "hide"',
        hideStrategy: 'remove',
      },
      computed: {
        type: 'text',
        label: 'Shows greeting using source value',
        computedValue: 'source ? "Hello " + source : "No source"',
      },
    }),
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByRole('textbox', { name: 'Removed when trigger is "hide"' }),
    ).not.toBeInTheDocument();

    const computed = await canvas.findByRole('textbox', { name: 'Shows greeting using source value' });
    await expect(computed).toHaveValue('No source');
  },
};

export const DynamicLabelWithInitiallyAbsentField: Story = {
  parameters: {
    docs: { description: { story: 'A dynamic label referencing a field that starts structurally hidden evaluates correctly on initial render.' } },
  },
  args: {
    formConfig: formConfig({
      trigger: {
        type: 'text',
        label: 'Clear to show the name field',
        defaultValue: 'hide',
      },
      nameField: {
        type: 'text',
        label: 'Removed when trigger is "hide"',
        defaultValue: 'Alice',
        hidden: 'trigger === "hide"',
        hideStrategy: 'remove',
      },
      greeting: {
        type: 'text',
        label: 'Static label',
        defaultValue: '',
        dynamicLabel: 'nameField ? "Greeting for " + nameField : "No recipient"',
      },
    }),
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByRole('textbox', { name: 'Removed when trigger is "hide"' }),
    ).not.toBeInTheDocument();

    const greeting = await canvas.findByRole('textbox', { name: 'No recipient' });
    await expect(greeting).toBeInTheDocument();
  },
};

// ---------------------------------------------------------------------------
// Expressions update after structural removal
// ---------------------------------------------------------------------------

export const DisabledExpressionAfterStructuralRemoval: Story = {
  parameters: {
    docs: { description: { story: 'A disabled expression referencing a removed field\'s value stops matching after removal.' } },
  },
  args: {
    formConfig: formConfig({
      trigger: {
        type: 'text',
        label: 'Type "hide" to remove the source field',
        defaultValue: '',
      },
      source: {
        type: 'text',
        label: 'Removed when trigger is "hide"',
        defaultValue: 'lock',
        hidden: 'trigger === "hide"',
        hideStrategy: 'remove',
      },
      target: {
        type: 'text',
        label: 'Disabled while source is "lock"',
        defaultValue: '',
        disabled: 'source === "lock"',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    // Initially: source="lock", so target is disabled
    const target = await canvas.findByRole('textbox', { name: 'Disabled while source is "lock"' });
    await expect(target).toBeDisabled();

    // Remove source by typing "hide" — source is gone, expression should
    // no longer match (source is undefined, not "lock")
    const trigger = await canvas.findByRole('textbox', { name: 'Type "hide" to remove the source field' });
    await userEvent.clear(trigger);
    await userEvent.type(trigger, 'hide');

    await expect(
      canvas.queryByRole('textbox', { name: 'Removed when trigger is "hide"' }),
    ).not.toBeInTheDocument();

    const targetAfter = await canvas.findByRole('textbox', { name: 'Disabled while source is "lock"' });
    await expect(targetAfter).toBeEnabled();
  },
};

export const ComputedValueAfterStructuralRemoval: Story = {
  parameters: {
    docs: { description: { story: 'A computed value referencing a removed field updates when that field disappears.' } },
  },
  args: {
    formConfig: formConfig({
      trigger: {
        type: 'text',
        label: 'Type "hide" to remove the source field',
        defaultValue: '',
      },
      source: {
        type: 'text',
        label: 'Removed when trigger is "hide"',
        defaultValue: 'world',
        hidden: 'trigger === "hide"',
        hideStrategy: 'remove',
      },
      computed: {
        type: 'text',
        label: 'Shows greeting using source value',
        computedValue: 'source ? "Hello " + source : "No source"',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    // Initially: source="world", computed shows "Hello world"
    const computed = await canvas.findByRole('textbox', { name: 'Shows greeting using source value' });
    await expect(computed).toHaveValue('Hello world');

    // Remove source
    const trigger = await canvas.findByRole('textbox', { name: 'Type "hide" to remove the source field' });
    await userEvent.clear(trigger);
    await userEvent.type(trigger, 'hide');

    await expect(
      canvas.queryByRole('textbox', { name: 'Removed when trigger is "hide"' }),
    ).not.toBeInTheDocument();

    // Computed should now show "No source"
    const computedAfter = await canvas.findByRole('textbox', { name: 'Shows greeting using source value' });
    await expect(computedAfter).toHaveValue('No source');
  },
};

export const DynamicLabelAfterStructuralRemoval: Story = {
  parameters: {
    docs: { description: { story: 'A dynamic label referencing a removed field updates when that field disappears.' } },
  },
  args: {
    formConfig: formConfig({
      trigger: {
        type: 'text',
        label: 'Type "hide" to remove the name field',
        defaultValue: '',
      },
      nameField: {
        type: 'text',
        label: 'Removed when trigger is "hide"',
        defaultValue: 'Alice',
        hidden: 'trigger === "hide"',
        hideStrategy: 'remove',
      },
      greeting: {
        type: 'text',
        label: 'Static label',
        defaultValue: '',
        dynamicLabel: 'nameField ? "Greeting for " + nameField : "No recipient"',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    // Initially: nameField="Alice", label shows "Greeting for Alice"
    const greeting = await canvas.findByRole('textbox', { name: 'Greeting for Alice' });
    await expect(greeting).toBeInTheDocument();

    // Remove nameField
    const trigger = await canvas.findByRole('textbox', { name: 'Type "hide" to remove the name field' });
    await userEvent.clear(trigger);
    await userEvent.type(trigger, 'hide');

    await expect(
      canvas.queryByRole('textbox', { name: 'Removed when trigger is "hide"' }),
    ).not.toBeInTheDocument();

    // Label should now show "No recipient"
    const greetingAfter = await canvas.findByRole('textbox', { name: 'No recipient' });
    await expect(greetingAfter).toBeInTheDocument();
  },
};

// ---------------------------------------------------------------------------
// Function Hidden with Keep Strategy
// ---------------------------------------------------------------------------

export const FunctionHiddenKeepStrategy: Story = {
  parameters: {
    docs: { description: { story: 'Function-based hidden expression with keep strategy.' } },
  },
  args: {
    formConfig: formConfig({
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
  },
  play: async ({ canvas, userEvent }) => {
    // Initially visible
    await expect(
      await canvas.findByRole('textbox', { name: 'Target Field (Function Hidden, Keep)' }),
    ).toBeInTheDocument();

    // Type 'hide' → hidden (not in document)
    const triggerField = await canvas.findByRole('textbox', { name: 'Type "hide" to hide target (keep)' });
    await userEvent.clear(triggerField);
    await userEvent.type(triggerField, 'hide');

    await expect(
      canvas.queryByRole('textbox', { name: 'Target Field (Function Hidden, Keep)' }),
    ).not.toBeInTheDocument();

    // Clear → visible again
    await userEvent.clear(triggerField);

    await expect(
      await canvas.findByRole('textbox', { name: 'Target Field (Function Hidden, Keep)' }),
    ).toBeInTheDocument();
  },
};
