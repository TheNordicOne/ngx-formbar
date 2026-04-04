import type { Meta, StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import type { FormContext } from '@ngx-formbar/core';
import { StoryFormHostComponent } from './story-form-host.component';
import { formConfig } from './story-helpers';

const meta: Meta<StoryFormHostComponent> = {
  title: 'Reactive Forms/Computed Values',
  component: StoryFormHostComponent,
};

export default meta;
type Story = StoryObj<StoryFormHostComponent>;

// ---------------------------------------------------------------------------
// Computed Values
// ---------------------------------------------------------------------------

export const ComputedValue: Story = {
  parameters: {
    docs: { description: { story: 'String concatenation, numeric computation, and fallback expressions.' } },
  },
  args: {
    formConfig: formConfig({
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
  },
  play: async ({ canvas, userEvent }) => {
    const fullName = await canvas.findByRole('textbox', { name: 'Full Name' });
    const square = await canvas.findByRole('textbox', { name: 'Square' });
    const fallback = await canvas.findByRole('textbox', { name: 'Fallback' });

    // String concatenation
    await expect(fullName).toHaveValue('Jane Doe');

    const firstName = await canvas.findByRole('textbox', { name: 'First' });
    await userEvent.clear(firstName);
    await userEvent.type(firstName, 'John');
    await expect(fullName).toHaveValue('John Doe');

    const lastName = await canvas.findByRole('textbox', { name: 'Last' });
    await userEvent.clear(lastName);
    await userEvent.type(lastName, 'Smith');
    await expect(fullName).toHaveValue('John Smith');

    // Numeric computation
    await expect(square).toHaveValue('25');

    const base = await canvas.findByRole('textbox', { name: 'Base' });
    await userEvent.clear(base);
    await userEvent.type(base, '7');
    await expect(square).toHaveValue('49');

    // Fallback when empty
    await expect(fallback).toHaveValue('DEFAULT');

    await userEvent.type(await canvas.findByRole('textbox', { name: 'Maybe Empty' }), 'Foo');
    await expect(fallback).toHaveValue('Foo');
  },
};

export const CascadingComputed: Story = {
  parameters: {
    docs: { description: { story: 'Computed values cascade through five levels.' } },
  },
  args: {
    formConfig: formConfig({
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
  },
  play: async ({ canvas, userEvent }) => {
    const level0 = await canvas.findByRole('textbox', { name: 'Level 0 Input' });
    const level1 = await canvas.findByRole('textbox', { name: 'Level 1 Computed' });
    const level2 = await canvas.findByRole('textbox', { name: 'Level 2 Computed' });
    const level3 = await canvas.findByRole('textbox', { name: 'Level 3 Computed' });
    const level4 = await canvas.findByRole('textbox', { name: 'Level 4 Computed' });
    const level5 = await canvas.findByRole('textbox', { name: 'Level 5 Computed' });

    // Verify initial cascaded values
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

    // Update the base value
    await userEvent.clear(level0);
    await userEvent.type(level0, 'Updated');

    // Verify all dependent values are updated
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
  },
};

export const ComputedWithValueStrategy: Story = {
  parameters: {
    docs: { description: { story: 'Computed values interact with keep + last/default/reset strategies.' } },
  },
  args: {
    formConfig: formConfig({
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
  },
  play: async ({ canvas, userEvent }) => {
    const compLast = await canvas.findByRole('textbox', { name: 'Computed (keep + last)' });
    const compDefault = await canvas.findByRole('textbox', { name: 'Computed (keep + default)' });
    const compReset = await canvas.findByRole('textbox', { name: 'Computed (keep + reset)' });

    // Initial computed values
    await expect(compLast).toHaveValue('DZ');
    await expect(compDefault).toHaveValue('DZ');
    await expect(compReset).toHaveValue('DZ');

    // Update dependency
    const dep = await canvas.findByRole('textbox', { name: 'Dependency' });
    await userEvent.clear(dep);
    await userEvent.type(dep, 'X');
    await expect(compLast).toHaveValue('XZ');
    await expect(compDefault).toHaveValue('XZ');
    await expect(compReset).toHaveValue('XZ');

    // Hide all computed controls
    const toggle = await canvas.findByRole('textbox', { name: 'Toggle (type "hide")' });
    await userEvent.clear(toggle);
    await userEvent.type(toggle, 'hide');
    await expect(
      canvas.queryByRole('textbox', { name: 'Computed (keep + last)' }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole('textbox', { name: 'Computed (keep + default)' }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole('textbox', { name: 'Computed (keep + reset)' }),
    ).not.toBeInTheDocument();

    // Show again: each strategy produces a different result
    await userEvent.clear(toggle);
    // "last" preserves the last computed value
    await expect(await canvas.findByRole('textbox', { name: 'Computed (keep + last)' })).toHaveValue('XZ');
    // "default" reverts to defaultValue
    await expect(await canvas.findByRole('textbox', { name: 'Computed (keep + default)' })).toHaveValue('DEFAULT');
    // "reset" clears the value
    await expect(await canvas.findByRole('textbox', { name: 'Computed (keep + reset)' })).toHaveValue('');
  },
};

// ---------------------------------------------------------------------------
// Computed Value – Additional Stories
// ---------------------------------------------------------------------------

export const BuiltInFunctionCalls: Story = {
  parameters: {
    docs: { description: { story: 'Computed expression calls .toUpperCase() on a field value.' } },
  },
  args: {
    formConfig: formConfig({
      raw: { type: 'text', label: 'Raw', defaultValue: 'mixedCase' },
      upper: { type: 'text', label: 'Uppercase', computedValue: 'raw.toUpperCase()' },
    }),
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('textbox', { name: 'Uppercase' })).toHaveValue('MIXEDCASE');
  },
};

export const ComputedPriority: Story = {
  parameters: {
    docs: { description: { story: 'computedValue takes priority over defaultValue.' } },
  },
  args: {
    formConfig: formConfig({
      mix: { type: 'text', label: 'Mix', defaultValue: 'INIT', computedValue: '"SHUTDOWN"' },
    }),
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('textbox', { name: 'Mix' })).toHaveValue('SHUTDOWN');
  },
};

export const ManualOverride: Story = {
  parameters: {
    docs: { description: { story: 'User can override a computed value; changing a dependency resets it.' } },
  },
  args: {
    formConfig: formConfig({
      part1: { type: 'text', label: 'Part 1', defaultValue: 'A' },
      part2: { type: 'text', label: 'Part 2', defaultValue: 'B' },
      combo: { type: 'text', label: 'Combo', computedValue: 'part1 + part2' },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const combo = await canvas.findByRole('textbox', { name: 'Combo' });

    // Verify initial computed value
    await expect(combo).toHaveValue('AB');

    // Manually override the computed field
    await userEvent.clear(combo);
    await userEvent.type(combo, 'CUSTOM');
    await userEvent.tab();

    await expect(combo).toHaveValue('CUSTOM');

    // Change a dependency – combo should revert to computed
    await userEvent.type(await canvas.findByRole('textbox', { name: 'Part 1' }), 'X');

    await expect(combo).toHaveValue('AXB');
  },
};

export const ManualOverridePersistence: Story = {
  parameters: {
    docs: { description: { story: 'Manual override persists when changing unrelated fields.' } },
  },
  args: {
    formConfig: formConfig({
      part1: { type: 'text', label: 'Part 1', defaultValue: 'A' },
      part2: { type: 'text', label: 'Part 2', defaultValue: 'B' },
      combo: { type: 'text', label: 'Combo', computedValue: 'part1 + part2' },
      unrelated: { type: 'text', label: 'Unrelated' },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const combo = await canvas.findByRole('textbox', { name: 'Combo' });

    // Verify initial computed value
    await expect(combo).toHaveValue('AB');

    // Manually override the computed field
    await userEvent.clear(combo);
    await userEvent.type(combo, 'ManualEntry');
    await userEvent.tab();

    await expect(combo).toHaveValue('ManualEntry');

    // Typing into an unrelated field should NOT reset the override
    const unrelated = await canvas.findByRole('textbox', { name: 'Unrelated' });
    await userEvent.clear(unrelated);
    await userEvent.type(unrelated, 'Not relevant');

    await expect(combo).toHaveValue('ManualEntry');

    // Changing a dependency resets the override
    const part1 = await canvas.findByRole('textbox', { name: 'Part 1' });
    await userEvent.clear(part1);
    await userEvent.type(part1, 'X');

    await expect(combo).toHaveValue('XB');
  },
};

export const CascadingManualOverride: Story = {
  parameters: {
    docs: { description: { story: 'Manual override on the deepest cascading level resets on base change.' } },
  },
  args: {
    formConfig: formConfig({
      level0_override: { type: 'text', label: 'Level 0', defaultValue: 'Initial' },
      level1_override: { type: 'text', label: 'Level 1', computedValue: 'level0_override + "-L1"' },
      level2_override: { type: 'text', label: 'Level 2', computedValue: 'level1_override + "-L2"' },
      level3_override: { type: 'text', label: 'Level 3', computedValue: 'level2_override + "-L3"' },
      level4_override: { type: 'text', label: 'Level 4', computedValue: 'level3_override + "-L4"' },
      level5_override: { type: 'text', label: 'Level 5', computedValue: 'level4_override + "-L5"' },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const level0 = await canvas.findByRole('textbox', { name: 'Level 0' });
    const level1 = await canvas.findByRole('textbox', { name: 'Level 1' });
    const level2 = await canvas.findByRole('textbox', { name: 'Level 2' });
    const level3 = await canvas.findByRole('textbox', { name: 'Level 3' });
    const level4 = await canvas.findByRole('textbox', { name: 'Level 4' });
    const level5 = await canvas.findByRole('textbox', { name: 'Level 5' });

    // Verify initial cascaded values
    await expect(level5).toHaveValue(
      'Initial-L1-L2-L3-L4-L5',
    );

    // Manually override level5
    await userEvent.clear(level5);
    await userEvent.type(level5, 'ManualOverride');
    await userEvent.tab();

    await expect(level5).toHaveValue('ManualOverride');

    // Change the base – level5 should revert to computed
    await userEvent.clear(level0);
    await userEvent.type(level0, 'ChangedBase');

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
  },
};

// ---------------------------------------------------------------------------
// Computed Value – Edge Cases
// ---------------------------------------------------------------------------

export const ComputedWithRemoveStrategy: Story = {
  parameters: {
    docs: { description: { story: 'Computed value is re-applied after remove/re-create, reflecting dependency changes made while hidden.' } },
  },
  args: {
    formConfig: formConfig({
      toggle: { type: 'text', label: 'Toggle (type "hide")' },
      dep: { type: 'text', label: 'Dependency', defaultValue: 'D' },
      compRemove: {
        type: 'text',
        label: 'Computed (remove)',
        computedValue: 'dep + "Z"',
        hidden: 'toggle === "hide"',
        hideStrategy: 'remove',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const compRemove = await canvas.findByRole('textbox', { name: 'Computed (remove)' });

    // Verify initial computed value
    await expect(compRemove).toHaveValue('DZ');

    // Hide → control is destroyed
    const toggle = await canvas.findByRole('textbox', { name: 'Toggle (type "hide")' });
    await userEvent.clear(toggle);
    await userEvent.type(toggle, 'hide');
    await expect(
      canvas.queryByRole('textbox', { name: 'Computed (remove)' }),
    ).not.toBeInTheDocument();

    // Change dependency while control doesn't exist
    const dep = await canvas.findByRole('textbox', { name: 'Dependency' });
    await userEvent.clear(dep);
    await userEvent.type(dep, 'NEW');

    // Show → control is re-created with current computed value
    await userEvent.clear(toggle);
    await expect(
      await canvas.findByRole('textbox', { name: 'Computed (remove)' }),
    ).toHaveValue('NEWZ');
  },
};

export const ReadonlyComputedValue: Story = {
  parameters: {
    docs: { description: { story: 'Readonly computed field displays and updates reactively but cannot be edited.' } },
  },
  args: {
    formConfig: formConfig({
      source: { type: 'text', label: 'Source', defaultValue: 'Hello' },
      derived: {
        type: 'text',
        label: 'Derived (readonly)',
        readonly: true,
        computedValue: 'source + " World"',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const derived = await canvas.findByRole('textbox', { name: 'Derived (readonly)' });

    // Computed value displayed and control is readonly
    await expect(derived).toHaveValue('Hello World');
    await expect(derived).toHaveAttribute('readonly');

    // Update source → computed field updates reactively
    const source = await canvas.findByRole('textbox', { name: 'Source' });
    await userEvent.clear(source);
    await userEvent.type(source, 'Goodbye');
    await expect(derived).toHaveValue('Goodbye World');
  },
};

/**
 * Cross-group computed values require optional chaining (`?.`) in string
 * expressions because the effect fires before sibling groups register
 * their children (#83). Without `?.`, the expression throws on initial
 * render. With `?.`, it safely returns `undefined` for missing groups.
 *
 * When #83 is fixed, replace with non-optional access:
 *   computedValue: 'groupA.fieldA + " " + groupB.fieldB'
 * and add an initial assertion:
 *   await expect(result).toHaveValue('Hello World');
 *
 * @see https://github.com/TheNordicOne/ngx-formbar/issues/83
 */
export const CrossGroupComputedValue: Story = {
  parameters: {
    docs: { description: { story: 'Computed expression references fields in sibling groups via dot notation (uses ?. workaround, see #83).' } },
  },
  args: {
    formConfig: formConfig({
      groupA: {
        type: 'group',
        legend: 'Group A',
        controls: {
          fieldA: { type: 'text', label: 'Field A', defaultValue: 'Hello' },
        },
      },
      groupB: {
        type: 'group',
        legend: 'Group B',
        controls: {
          fieldB: { type: 'text', label: 'Field B', defaultValue: 'World' },
        },
      },
      crossGroupResult: {
        type: 'text',
        label: 'Cross-Group Result',
        // #83: requires ?. — without it the expression throws on initial render
        computedValue: 'groupA?.fieldA + " " + groupB?.fieldB',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const result = await canvas.findByRole('textbox', { name: 'Cross-Group Result' });

    // Change field in Group A → triggers valueChanges with full form context
    const fieldA = await canvas.findByRole('textbox', { name: 'Field A' });
    await userEvent.clear(fieldA);
    await userEvent.type(fieldA, 'Goodbye');
    await expect(result).toHaveValue('Goodbye World');

    // Change field in Group B
    const fieldB = await canvas.findByRole('textbox', { name: 'Field B' });
    await userEvent.clear(fieldB);
    await userEvent.type(fieldB, 'Moon');
    await expect(result).toHaveValue('Goodbye Moon');
  },
};

export const IntermediateCascadeOverride: Story = {
  parameters: {
    docs: { description: { story: 'Manual override at an intermediate cascade level affects downstream and resets when the base changes.' } },
  },
  args: {
    formConfig: formConfig({
      base: { type: 'text', label: 'Base', defaultValue: 'X' },
      mid1: { type: 'text', label: 'Mid 1', computedValue: 'base + "-M1"' },
      mid2: { type: 'text', label: 'Mid 2', computedValue: 'mid1 + "-M2"' },
      leaf: { type: 'text', label: 'Leaf', computedValue: 'mid2 + "-LEAF"' },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const base = await canvas.findByRole('textbox', { name: 'Base' });
    const mid1 = await canvas.findByRole('textbox', { name: 'Mid 1' });
    const mid2 = await canvas.findByRole('textbox', { name: 'Mid 2' });
    const leaf = await canvas.findByRole('textbox', { name: 'Leaf' });

    // Verify initial cascade
    await expect(mid1).toHaveValue('X-M1');
    await expect(mid2).toHaveValue('X-M1-M2');
    await expect(leaf).toHaveValue('X-M1-M2-LEAF');

    // Override mid1 (intermediate level)
    await userEvent.clear(mid1);
    await userEvent.type(mid1, 'CUSTOM');
    await userEvent.tab();

    // Downstream fields compute from the overridden value
    await expect(mid1).toHaveValue('CUSTOM');
    await expect(mid2).toHaveValue('CUSTOM-M2');
    await expect(leaf).toHaveValue('CUSTOM-M2-LEAF');

    // Change the base → mid1 override resets, full cascade restores
    await userEvent.clear(base);
    await userEvent.type(base, 'Y');

    await expect(mid1).toHaveValue('Y-M1');
    await expect(mid2).toHaveValue('Y-M1-M2');
    await expect(leaf).toHaveValue('Y-M1-M2-LEAF');
  },
};

export const ComputedWithDisabled: Story = {
  parameters: {
    docs: { description: { story: 'Disabled computed field still receives computed value updates.' } },
  },
  args: {
    formConfig: formConfig({
      source: { type: 'text', label: 'Source', defaultValue: 'Input' },
      disabledComputed: {
        type: 'text',
        label: 'Disabled Computed',
        disabled: true,
        computedValue: 'source + " (computed)"',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const disabledComputed = await canvas.findByRole('textbox', { name: 'Disabled Computed' });

    // Control is disabled but has computed value
    await expect(disabledComputed).toBeDisabled();
    await expect(disabledComputed).toHaveValue('Input (computed)');

    // Change source → disabled field updates
    const source = await canvas.findByRole('textbox', { name: 'Source' });
    await userEvent.clear(source);
    await userEvent.type(source, 'Updated');
    await expect(disabledComputed).toHaveValue('Updated (computed)');
  },
};

export const ComputedFanOut: Story = {
  parameters: {
    docs: { description: { story: 'Multiple computed fields derive from the same source independently.' } },
  },
  args: {
    formConfig: formConfig({
      source: { type: 'text', label: 'Source', defaultValue: 'Hello' },
      upper: { type: 'text', label: 'Uppercase', computedValue: 'source.toUpperCase()' },
      prefixed: { type: 'text', label: 'Prefixed', computedValue: '">> " + source' },
      reversed: {
        type: 'text',
        label: 'Reversed',
        computedValue: (ctx: FormContext): string => {
          const s = (ctx['source'] as string | undefined) ?? '';
          return s.split('').reverse().join('');
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    // All three have initial computed values
    await expect(await canvas.findByRole('textbox', { name: 'Uppercase' })).toHaveValue('HELLO');
    await expect(await canvas.findByRole('textbox', { name: 'Prefixed' })).toHaveValue('>> Hello');
    await expect(await canvas.findByRole('textbox', { name: 'Reversed' })).toHaveValue('olleH');

    // Change source → all three update
    const source = await canvas.findByRole('textbox', { name: 'Source' });
    await userEvent.clear(source);
    await userEvent.type(source, 'World');
    await expect(await canvas.findByRole('textbox', { name: 'Uppercase' })).toHaveValue('WORLD');
    await expect(await canvas.findByRole('textbox', { name: 'Prefixed' })).toHaveValue('>> World');
    await expect(await canvas.findByRole('textbox', { name: 'Reversed' })).toHaveValue('dlroW');
  },
};

export const ComputedNullishResult: Story = {
  parameters: {
    docs: { description: { story: 'Computed expression evaluating to null clears the field value.' } },
  },
  args: {
    formConfig: formConfig({
      source: { type: 'text', label: 'Source', defaultValue: 'Hello' },
      nullish: {
        type: 'text',
        label: 'Nullish Result',
        computedValue: (ctx: FormContext): string | null => {
          const s = ctx['source'] as string | undefined;
          return s === 'clear' ? null : (s ?? '') + '!';
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const nullish = await canvas.findByRole('textbox', { name: 'Nullish Result' });

    // Initial: non-null computed value
    await expect(nullish).toHaveValue('Hello!');

    // Set source to "clear" → computed returns null → field is empty
    const source = await canvas.findByRole('textbox', { name: 'Source' });
    await userEvent.clear(source);
    await userEvent.type(source, 'clear');
    await expect(nullish).toHaveValue('');

    // Set source back → computed returns non-null
    await userEvent.clear(source);
    await userEvent.type(source, 'Back');
    await expect(nullish).toHaveValue('Back!');
  },
};

export const ComputedTernaryExpression: Story = {
  parameters: {
    docs: { description: { story: 'Ternary expression in computedValue toggles between two results.' } },
  },
  args: {
    formConfig: formConfig({
      age: { type: 'text', label: 'Age', defaultValue: '25' },
      category: {
        type: 'text',
        label: 'Category',
        computedValue: '+age >= 18 ? "Adult" : "Minor"',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const category = await canvas.findByRole('textbox', { name: 'Category' });

    // Initial: 25 >= 18 → Adult
    await expect(category).toHaveValue('Adult');

    // Change to 10 → Minor
    const age = await canvas.findByRole('textbox', { name: 'Age' });
    await userEvent.clear(age);
    await userEvent.type(age, '10');
    await expect(category).toHaveValue('Minor');

    // Boundary: 18 → Adult
    await userEvent.clear(age);
    await userEvent.type(age, '18');
    await expect(category).toHaveValue('Adult');
  },
};

export const FunctionComputedManualOverride: Story = {
  parameters: {
    docs: { description: { story: 'Manual override on a function-based computed value persists until a dependency changes.' } },
  },
  args: {
    formConfig: formConfig({
      first: { type: 'text', label: 'First', defaultValue: 'A' },
      second: { type: 'text', label: 'Second', defaultValue: 'B' },
      funcComputed: {
        type: 'text',
        label: 'Function Computed',
        computedValue: (ctx: FormContext): string => {
          const a = (ctx['first'] as string | undefined) ?? '';
          const b = (ctx['second'] as string | undefined) ?? '';
          return `${a}-${b}`;
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const funcComputed = await canvas.findByRole('textbox', { name: 'Function Computed' });

    // Initial function-computed value
    await expect(funcComputed).toHaveValue('A-B');

    // Manual override persists
    await userEvent.clear(funcComputed);
    await userEvent.type(funcComputed, 'OVERRIDE');
    await userEvent.tab();

    await expect(funcComputed).toHaveValue('OVERRIDE');

    // Change dependency → override resets
    const first = await canvas.findByRole('textbox', { name: 'First' });
    await userEvent.clear(first);
    await userEvent.type(first, 'X');

    await expect(funcComputed).toHaveValue('X-B');
  },
};

export const ComputedWithBlurUpdateStrategy: Story = {
  parameters: {
    docs: { description: { story: 'Programmatic computed value updates bypass the blur update strategy.' } },
  },
  args: {
    formConfig: formConfig({
      source: { type: 'text', label: 'Source', defaultValue: 'A' },
      blurComputed: {
        type: 'text',
        label: 'Blur Computed',
        computedValue: 'source + "!"',
        updateOn: 'blur',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const blurComputed = await canvas.findByRole('textbox', { name: 'Blur Computed' });

    // Initial computed value applied despite blur strategy
    await expect(blurComputed).toHaveValue('A!');

    // Changing source updates computed field (programmatic setValue bypasses blur)
    const source = await canvas.findByRole('textbox', { name: 'Source' });
    await userEvent.clear(source);
    await userEvent.type(source, 'B');
    await expect(blurComputed).toHaveValue('B!');
  },
};

export const SelfReferencingComputed: Story = {
  parameters: {
    docs: { description: { story: 'Idempotent self-referencing expression stabilizes without infinite loop.' } },
  },
  args: {
    formConfig: formConfig({
      selfRef: {
        type: 'text',
        label: 'Self Reference',
        defaultValue: '',
        computedValue: 'selfRef || "FALLBACK"',
      },
    }),
  },
  play: async ({ canvas }) => {
    // Self-referencing expression stabilizes: "" || "FALLBACK" → "FALLBACK"
    await expect(
      await canvas.findByRole('textbox', { name: 'Self Reference' }),
    ).toHaveValue('FALLBACK');
  },
};

// ---------------------------------------------------------------------------
// Expression – Additional Stories
// ---------------------------------------------------------------------------

export const ComplexArithmeticExpressions: Story = {
  parameters: {
    docs: { description: { story: 'Arithmetic operators in hidden expressions (+, *, comparisons).' } },
  },
  args: {
    formConfig: formConfig({
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
  },
  play: async ({ canvas, userEvent }) => {
    // Initial: 10+20>30 is false → visible. 10*20<30 is false → visible.
    await expect(
      await canvas.findByRole('textbox', { name: 'Hidden by complex expression' }),
    ).toBeInTheDocument();
    await expect(
      await canvas.findByRole('textbox', { name: 'Visible by complex expression' }),
    ).toBeInTheDocument();

    // Set valueA to 20: 20+20>30=true → hidden. 20*20<30=false → visible.
    const valueA = await canvas.findByRole('textbox', { name: 'Value A' });
    await userEvent.clear(valueA);
    await userEvent.type(valueA, '20');

    await expect(
      canvas.queryByRole('textbox', { name: 'Hidden by complex expression' }),
    ).not.toBeInTheDocument();
    await expect(
      await canvas.findByRole('textbox', { name: 'Visible by complex expression' }),
    ).toBeInTheDocument();

    // Set valueC to 500: 20*20<500=true → hidden.
    const valueC = await canvas.findByRole('textbox', { name: 'Value C' });
    await userEvent.clear(valueC);
    await userEvent.type(valueC, '500');

    await expect(
      canvas.queryByRole('textbox', { name: 'Visible by complex expression' }),
    ).not.toBeInTheDocument();
  },
};

export const MultipleDependencies: Story = {
  parameters: {
    docs: { description: { story: 'Multiple conditions with logical OR in a hidden expression.' } },
  },
  args: {
    formConfig: formConfig({
      showCondition: { type: 'text', label: 'Show Condition', defaultValue: 'no' },
      secondCondition: { type: 'text', label: 'Second Condition', defaultValue: 'no' },
      conditionalField: {
        type: 'text',
        label: 'Conditional Field',
        hidden: 'showCondition !== "yes" || secondCondition !== "yes"',
        defaultValue: 'Only visible when both conditions are "yes"',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    // Initially hidden (both 'no')
    await expect(
      canvas.queryByRole('textbox', { name: 'Conditional Field' }),
    ).not.toBeInTheDocument();

    // Set showCondition to 'yes' → still hidden (secondCondition is 'no')
    const showCondition = await canvas.findByRole('textbox', { name: 'Show Condition' });
    await userEvent.clear(showCondition);
    await userEvent.type(showCondition, 'yes');

    await expect(
      canvas.queryByRole('textbox', { name: 'Conditional Field' }),
    ).not.toBeInTheDocument();

    // Set secondCondition to 'yes' → now visible
    const secondCondition = await canvas.findByRole('textbox', { name: 'Second Condition' });
    await userEvent.clear(secondCondition);
    await userEvent.type(secondCondition, 'yes');

    await expect(
      await canvas.findByRole('textbox', { name: 'Conditional Field' }),
    ).toBeInTheDocument();

    // Set showCondition to 'no' → hidden again
    await userEvent.clear(showCondition);
    await userEvent.type(showCondition, 'no');

    await expect(
      canvas.queryByRole('textbox', { name: 'Conditional Field' }),
    ).not.toBeInTheDocument();
  },
};

// ---------------------------------------------------------------------------
// Function Computed
// ---------------------------------------------------------------------------

export const FunctionComputed: Story = {
  parameters: {
    docs: { description: { story: 'Function-based computed value reacts to source field changes.' } },
  },
  args: {
    formConfig: formConfig({
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
      computed: {
        type: 'text',
        label: 'Computed',
        computedValue: (formValue: FormContext): string => {
          const a = (formValue['sourceA'] as string | undefined) ?? '';
          const b = (formValue['sourceB'] as string | undefined) ?? '';
          return `${a} ${b}!`.trim();
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    // Initial computed value
    await expect(await canvas.findByRole('textbox', { name: 'Computed' })).toHaveValue('Hello World!');

    // Update source A
    const sourceA = await canvas.findByRole('textbox', { name: 'Source A' });
    await userEvent.clear(sourceA);
    await userEvent.type(sourceA, 'Goodbye');
    await expect(await canvas.findByRole('textbox', { name: 'Computed' })).toHaveValue('Goodbye World!');

    // Update source B
    const sourceB = await canvas.findByRole('textbox', { name: 'Source B' });
    await userEvent.clear(sourceB);
    await userEvent.type(sourceB, 'Moon');
    await expect(await canvas.findByRole('textbox', { name: 'Computed' })).toHaveValue('Goodbye Moon!');
  },
};
