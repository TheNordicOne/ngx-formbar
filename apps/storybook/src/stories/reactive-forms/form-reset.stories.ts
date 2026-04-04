import type { Meta, StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { StoryFormHostComponent } from './story-form-host.component';
import { formConfig } from './story-helpers';

const meta: Meta<StoryFormHostComponent> = {
  title: 'Reactive Forms/Form Reset',
  component: StoryFormHostComponent,
};

export default meta;
type Story = StoryObj<StoryFormHostComponent>;

// ---------------------------------------------------------------------------
// Reset + Computed Values
// ---------------------------------------------------------------------------

export const ResetReappliesComputedValues: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'After form.reset(), computed values re-evaluate against the reset form values.',
      },
    },
  },
  args: {
    formConfig: formConfig({
      source: {
        type: 'text',
        label: 'Source',
        defaultValue: 'Hello',
        nonNullable: true,
      },
      derived: {
        type: 'text',
        label: 'Derived',
        computedValue: 'source + " World"',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const source = await canvas.findByRole('textbox', { name: 'Source' });
    const derived = await canvas.findByRole('textbox', { name: 'Derived' });

    // Initial computed value
    await expect(derived).toHaveValue('Hello World');

    // Change source
    await userEvent.clear(source);
    await userEvent.type(source, 'Goodbye');
    await expect(derived).toHaveValue('Goodbye World');

    // Reset — source reverts to 'Hello', derived should recompute
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Reset' }),
    );
    await expect(source).toHaveValue('Hello');
    await expect(derived).toHaveValue('Hello World');
  },
};

// ---------------------------------------------------------------------------
// Reset + Manual Override on Computed (dependencies changed)
// ---------------------------------------------------------------------------

export const ResetClearsManualOverride: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'After form.reset(), a manual override on a computed field is cleared and the computed value is re-applied (dependencies were changed before override).',
      },
    },
  },
  args: {
    formConfig: formConfig({
      part1: {
        type: 'text',
        label: 'Part 1',
        defaultValue: 'A',
        nonNullable: true,
      },
      part2: {
        type: 'text',
        label: 'Part 2',
        defaultValue: 'B',
        nonNullable: true,
      },
      combo: {
        type: 'text',
        label: 'Combo',
        computedValue: 'part1 + part2',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const combo = await canvas.findByRole('textbox', { name: 'Combo' });

    // Initial computed value
    await expect(combo).toHaveValue('AB');

    // Change a dependency so the computed signal has a different history
    const part1 = await canvas.findByRole('textbox', { name: 'Part 1' });
    await userEvent.clear(part1);
    await userEvent.type(part1, 'X');
    await expect(combo).toHaveValue('XB');

    // Override combo manually
    await userEvent.clear(combo);
    await userEvent.type(combo, 'MANUAL');
    await userEvent.tab();
    await expect(combo).toHaveValue('MANUAL');

    // Reset — part1 reverts to 'A', computed becomes 'AB' (different from 'XB')
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Reset' }),
    );
    await expect(combo).toHaveValue('AB');
  },
};

// ---------------------------------------------------------------------------
// Reset + Manual Override (dependencies unchanged — edge case)
// ---------------------------------------------------------------------------

export const ResetWithUnchangedComputedDependencies: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Edge case: form.reset() with a manually overridden computed field whose dependencies were never changed. The computed signal value is identical before and after reset, so the effect may not re-fire.',
      },
    },
  },
  args: {
    formConfig: formConfig({
      part1: {
        type: 'text',
        label: 'Part 1',
        defaultValue: 'A',
        nonNullable: true,
      },
      part2: {
        type: 'text',
        label: 'Part 2',
        defaultValue: 'B',
        nonNullable: true,
      },
      combo: {
        type: 'text',
        label: 'Combo',
        computedValue: 'part1 + part2',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const combo = await canvas.findByRole('textbox', { name: 'Combo' });

    // Initial computed value
    await expect(combo).toHaveValue('AB');

    // Override combo WITHOUT changing any dependency
    await userEvent.clear(combo);
    await userEvent.type(combo, 'MANUAL');
    await userEvent.tab();
    await expect(combo).toHaveValue('MANUAL');

    // Reset — dependencies are unchanged (A + B = AB, same as initial).
    // combo should still show 'AB' (computed re-applied).
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Reset' }),
    );
    await expect(combo).toHaveValue('AB');
  },
};

// ---------------------------------------------------------------------------
// Reset + Disabled Expression
// ---------------------------------------------------------------------------

export const ResetReEvaluatesDisabledExpression: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'After form.reset(), a conditional disabled expression re-evaluates, re-enabling the field.',
      },
    },
  },
  args: {
    formConfig: formConfig({
      toggle: {
        type: 'text',
        label: 'Toggle',
        defaultValue: '',
        nonNullable: true,
      },
      target: {
        type: 'text',
        label: 'Target',
        defaultValue: 'Editable',
        disabled: 'toggle === "yes"',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const target = await canvas.findByRole('textbox', { name: 'Target' });

    // Initially enabled
    await expect(target).toBeEnabled();

    // Type 'yes' to disable target
    const toggle = await canvas.findByRole('textbox', { name: 'Toggle' });
    await userEvent.type(toggle, 'yes');
    await expect(target).toBeDisabled();

    // Reset — toggle reverts to '', target should re-enable
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Reset' }),
    );
    await expect(
      await canvas.findByRole('textbox', { name: 'Target' }),
    ).toBeEnabled();
  },
};

// ---------------------------------------------------------------------------
// Reset + Hidden Expression (Keep Strategy)
// ---------------------------------------------------------------------------

export const ResetReEvaluatesHiddenExpression: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'After form.reset(), a conditional hidden expression re-evaluates, making the field visible again.',
      },
    },
  },
  args: {
    formConfig: formConfig({
      toggle: {
        type: 'text',
        label: 'Toggle',
        defaultValue: '',
        nonNullable: true,
      },
      target: {
        type: 'text',
        label: 'Hideable Target',
        defaultValue: 'Visible',
        hidden: 'toggle === "hide"',
        hideStrategy: 'keep',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    // Initially visible
    await expect(
      await canvas.findByRole('textbox', { name: 'Hideable Target' }),
    ).toBeInTheDocument();

    // Type 'hide' — target becomes hidden (keep strategy: in DOM but not accessible)
    const toggle = await canvas.findByRole('textbox', { name: 'Toggle' });
    await userEvent.type(toggle, 'hide');
    await expect(
      canvas.queryByRole('textbox', { name: 'Hideable Target' }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole('textbox', {
        name: 'Hideable Target',
        hidden: true,
      }),
    ).toBeInTheDocument();

    // Reset — toggle reverts to '', target should become visible again
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Reset' }),
    );
    await expect(
      await canvas.findByRole('textbox', { name: 'Hideable Target' }),
    ).toBeInTheDocument();
  },
};

// ---------------------------------------------------------------------------
// Reset + Readonly Expression
// ---------------------------------------------------------------------------

export const ResetReEvaluatesReadonlyExpression: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'After form.reset(), a conditional readonly expression re-evaluates, removing readonly.',
      },
    },
  },
  args: {
    formConfig: formConfig({
      toggle: {
        type: 'text',
        label: 'Toggle',
        defaultValue: '',
        nonNullable: true,
      },
      target: {
        type: 'text',
        label: 'Target',
        defaultValue: 'Editable',
        readonly: 'toggle === "lock"',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const target = await canvas.findByRole('textbox', { name: 'Target' });

    // Initially not readonly
    await expect(target).not.toHaveAttribute('readonly');

    // Type 'lock' — target becomes readonly
    const toggle = await canvas.findByRole('textbox', { name: 'Toggle' });
    await userEvent.type(toggle, 'lock');
    await expect(target).toHaveAttribute('readonly');

    // Reset — toggle reverts to '', target should lose readonly
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Reset' }),
    );
    await expect(
      await canvas.findByRole('textbox', { name: 'Target' }),
    ).not.toHaveAttribute('readonly');
  },
};

// ---------------------------------------------------------------------------
// Reset + Dynamic Labels
// ---------------------------------------------------------------------------

export const ResetUpdatesDynamicLabels: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'After form.reset(), dynamic labels re-evaluate against the reset form values.',
      },
    },
  },
  args: {
    formConfig: formConfig({
      source: {
        type: 'text',
        label: 'Source',
        defaultValue: 'Initial',
        nonNullable: true,
      },
      target: {
        type: 'text',
        label: 'Static Fallback',
        dynamicLabel: "source + ' Label'",
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    // Initial dynamic label
    await expect(
      await canvas.findByText('Initial Label'),
    ).toBeInTheDocument();

    // Change source
    const source = await canvas.findByRole('textbox', { name: 'Source' });
    await userEvent.clear(source);
    await userEvent.type(source, 'Custom');
    await expect(await canvas.findByText('Custom Label')).toBeInTheDocument();

    // Reset — source reverts to 'Initial', label should update
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Reset' }),
    );
    await expect(
      await canvas.findByText('Initial Label'),
    ).toBeInTheDocument();
  },
};

// ---------------------------------------------------------------------------
// Reset + Validators
// ---------------------------------------------------------------------------

export const ResetPreservesValidators: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'After form.reset(), validators still function. Errors disappear because the form is pristine, but re-appear on new input.',
      },
    },
  },
  args: {
    formConfig: formConfig({
      field: {
        type: 'text',
        label: 'Validated Field',
        validators: ['min-chars'],
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const field = await canvas.findByRole('textbox', {
      name: 'Validated Field',
    });

    // Type invalid value and blur — error shows (control is dirty)
    await userEvent.type(field, 'X');
    await userEvent.tab();
    await expect(
      await canvas.findByText('Minimum 3 characters required'),
    ).toBeInTheDocument();

    // Reset — form becomes pristine, error message disappears
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Reset' }),
    );
    await expect(
      canvas.queryByText('Minimum 3 characters required'),
    ).not.toBeInTheDocument();

    // Type invalid value again — error re-appears (validator still active)
    const resetField = await canvas.findByRole('textbox', {
      name: 'Validated Field',
    });
    await userEvent.type(resetField, 'A');
    await userEvent.tab();
    await expect(
      await canvas.findByText('Minimum 3 characters required'),
    ).toBeInTheDocument();
  },
};
