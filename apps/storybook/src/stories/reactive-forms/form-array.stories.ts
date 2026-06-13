import type { Meta, StoryObj } from '@storybook/angular';
import { expect, waitFor } from 'storybook/test';
import type { FormContext } from '@ngx-formbar/core';
import { StoryFormHostComponent } from './story-form-host.component';
import { formConfig } from './story-helpers';

const meta: Meta<StoryFormHostComponent> = {
  title: 'Reactive Forms/Form Array',
  component: StoryFormHostComponent,
};

export default meta;
type Story = StoryObj<StoryFormHostComponent>;

function getFormValue(): Record<string, unknown> {
  return StoryFormHostComponent.lastInstance!.form.getRawValue();
}

// ---------------------------------------------------------------------------
// Scalar rows: add, fill, remove
// ---------------------------------------------------------------------------

export const ScalarRowsAddFillRemove: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A scalar array (text rows). Adding a row renders a new input, values flow into the form, and removing a row drops the correct one.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      tags: {
        type: 'array',
        label: 'Tags',
        rowControl: { type: 'text', label: 'Tag' },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    // Starts empty
    await expect(canvas.queryByRole('textbox')).not.toBeInTheDocument();

    // Add two rows
    const add = await canvas.findByTestId('tags-add');
    await userEvent.click(add);
    await userEvent.click(add);

    const inputs = await canvas.findAllByRole('textbox');
    await expect(inputs).toHaveLength(2);

    // Fill them
    await userEvent.type(inputs[0], 'alpha');
    await userEvent.type(inputs[1], 'beta');
    await expect(inputs[0]).toHaveValue('alpha');
    await expect(inputs[1]).toHaveValue('beta');

    // Remove the first row; the survivor keeps its value
    await userEvent.click(await canvas.findByTestId('tags-0-remove'));
    const remaining = await canvas.findAllByRole('textbox');
    await expect(remaining).toHaveLength(1);
    await expect(remaining[0]).toHaveValue('beta');
  },
};

// ---------------------------------------------------------------------------
// Group rows: each row is a sub-form
// ---------------------------------------------------------------------------

export const GroupRows: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'An array whose row is a group. Each row renders its nested controls and contributes an object to the array value.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      contacts: {
        type: 'array',
        label: 'Contacts',
        rowControl: {
          type: 'group',
          controls: {
            name: { type: 'text', label: 'Name' },
            email: { type: 'text', label: 'Email' },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('contacts-add'));

    const name = await canvas.findByRole('textbox', { name: 'Name' });
    const email = await canvas.findByRole('textbox', { name: 'Email' });
    await userEvent.type(name, 'Ada');
    await userEvent.type(email, 'ada@example.com');

    await expect(name).toHaveValue('Ada');
    await expect(email).toHaveValue('ada@example.com');
  },
};

// ---------------------------------------------------------------------------
// Remove a middle row re-keys survivors
// ---------------------------------------------------------------------------

export const RemoveKeepsOrder: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Removing a middle row re-keys the survivors so each row keeps its own value.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      tags: {
        type: 'array',
        label: 'Tags',
        rowControl: { type: 'text', label: 'Tag' },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const add = await canvas.findByTestId('tags-add');
    await userEvent.click(add);
    await userEvent.click(add);
    await userEvent.click(add);

    const inputs = await canvas.findAllByRole('textbox');
    await userEvent.type(inputs[0], 'a');
    await userEvent.type(inputs[1], 'b');
    await userEvent.type(inputs[2], 'c');

    // Remove the middle row
    await userEvent.click(await canvas.findByTestId('tags-1-remove'));

    const remaining = await canvas.findAllByRole('textbox');
    await expect(remaining).toHaveLength(2);
    await expect(remaining[0]).toHaveValue('a');
    await expect(remaining[1]).toHaveValue('c');
  },
};

// ---------------------------------------------------------------------------
// Insert at a position
// ---------------------------------------------------------------------------

export const InsertAtPosition: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Inserting a row at a position pushes the existing rows down and keeps their values, via the array context insertAt operation.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      tags: {
        type: 'array',
        label: 'Tags',
        rowControl: { type: 'text', label: 'Tag' },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const add = await canvas.findByTestId('tags-add');
    await userEvent.click(add);
    await userEvent.click(add);

    const inputs = await canvas.findAllByRole('textbox');
    await userEvent.type(inputs[0], 'a');
    await userEvent.type(inputs[1], 'c');

    // Insert a new row above index 1; 'a' stays at 0, 'c' shifts to 2
    await userEvent.click(await canvas.findByTestId('tags-1-insert'));

    const afterInsert = await canvas.findAllByRole('textbox');
    await expect(afterInsert).toHaveLength(3);
    await expect(afterInsert[0]).toHaveValue('a');
    await expect(afterInsert[1]).toHaveValue('');
    await expect(afterInsert[2]).toHaveValue('c');

    await userEvent.type(afterInsert[1], 'b');
    await expect(
      (await canvas.findAllByRole('textbox')).map((i) => (i as HTMLInputElement).value),
    ).toEqual(['a', 'b', 'c']);
  },
};

// ---------------------------------------------------------------------------
// Move reorders rows and carries their values
// ---------------------------------------------------------------------------

export const MoveReorders: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Moving a row reorders it via the array context move operation. The moved row keeps its own value because the control instance (its identity) is preserved across the move.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      tags: {
        type: 'array',
        label: 'Tags',
        rowControl: { type: 'text', label: 'Tag' },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const add = await canvas.findByTestId('tags-add');
    await userEvent.click(add);
    await userEvent.click(add);
    await userEvent.click(add);

    const inputs = await canvas.findAllByRole('textbox');
    await userEvent.type(inputs[0], 'a');
    await userEvent.type(inputs[1], 'b');
    await userEvent.type(inputs[2], 'c');

    // Move the last row up one: [a, b, c] -> [a, c, b]
    await userEvent.click(await canvas.findByTestId('tags-2-move-up'));
    await expect(
      (await canvas.findAllByRole('textbox')).map(
        (i) => (i as HTMLInputElement).value,
      ),
    ).toEqual(['a', 'c', 'b']);

    // Move the first row down one: [a, c, b] -> [c, a, b]
    await userEvent.click(await canvas.findByTestId('tags-0-move-down'));
    await expect(
      (await canvas.findAllByRole('textbox')).map(
        (i) => (i as HTMLInputElement).value,
      ),
    ).toEqual(['c', 'a', 'b']);
  },
};

// ---------------------------------------------------------------------------
// Array-level hidden + hideStrategy: keep
// ---------------------------------------------------------------------------

export const ArrayHiddenKeep: Story = {
  name: 'Array Hidden — Keep',
  parameters: {
    docs: {
      description: {
        story:
          'Hiding the whole array with hideStrategy keep removes it from the DOM but preserves the FormArray (and its rows) in the form model.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      toggle: {
        type: 'text',
        label: 'Type "hide" to hide the array',
      },
      tags: {
        type: 'array',
        label: 'Tags',
        hidden: 'toggle === "hide"',
        hideStrategy: 'keep',
        rowControl: { type: 'text', label: 'Tag' },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('tags-add'));
    const input = await canvas.findByRole('textbox', { name: 'Tag' });
    await userEvent.type(input, 'kept');

    const toggle = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide the array',
    });
    await userEvent.type(toggle, 'hide');

    // DOM gone, but the array (with its row value) stays in the model
    await expect(
      canvas.queryByRole('textbox', { name: 'Tag' }),
    ).not.toBeInTheDocument();
    await expect(getFormValue()['tags']).toEqual(['kept']);

    // Re-show — the row reappears with its value
    await userEvent.clear(toggle);
    await expect(await canvas.findByRole('textbox', { name: 'Tag' })).toHaveValue(
      'kept',
    );
  },
};

// ---------------------------------------------------------------------------
// Array-level hidden + hideStrategy: remove
// ---------------------------------------------------------------------------

export const ArrayHiddenRemove: Story = {
  name: 'Array Hidden — Remove',
  parameters: {
    docs: {
      description: {
        story:
          'Hiding the whole array with hideStrategy remove detaches the FormArray from the parent group; the key is absent while hidden and re-attaches on show.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      toggle: {
        type: 'text',
        label: 'Type "hide" to hide the array',
      },
      tags: {
        type: 'array',
        label: 'Tags',
        hidden: 'toggle === "hide"',
        hideStrategy: 'remove',
        rowControl: { type: 'text', label: 'Tag' },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('tags-add'));

    const toggle = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide the array',
    });
    await userEvent.type(toggle, 'hide');

    await expect(
      canvas.queryByRole('textbox', { name: 'Tag' }),
    ).not.toBeInTheDocument();
    // The whole array key is removed from the model while hidden
    await expect(getFormValue()['tags']).toBeUndefined();

    // Re-show — the array re-attaches and its rows render again
    await userEvent.clear(toggle);
    await expect(await canvas.findByRole('textbox', { name: 'Tag' })).toBeInTheDocument();
    await expect(getFormValue()['tags']).toBeDefined();
  },
};

// ---------------------------------------------------------------------------
// Row top keep-only at runtime
// ---------------------------------------------------------------------------

export const RowTopHiddenKeep: Story = {
  name: 'Row Top Hidden — Keep',
  parameters: {
    docs: {
      description: {
        story:
          'A row top may use hideStrategy keep. When its hidden expression becomes true the row stays in the FormArray (indices unchanged) while its control hides from the DOM.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      toggle: {
        type: 'text',
        label: 'Type "hide" to hide rows',
      },
      tags: {
        type: 'array',
        label: 'Tags',
        rowControl: {
          type: 'text',
          label: 'Tag',
          hidden: 'toggle === "hide"',
          hideStrategy: 'keep',
          valueStrategy: 'last',
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const add = await canvas.findByTestId('tags-add');
    await userEvent.click(add);
    await userEvent.click(add);

    const inputs = await canvas.findAllByRole('textbox', { name: 'Tag' });
    await userEvent.type(inputs[0], 'a');
    await userEvent.type(inputs[1], 'b');

    const toggle = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide rows',
    });
    await userEvent.type(toggle, 'hide');

    // Row controls hidden from DOM, but both rows kept in the model (indices
    // stable) with their last values preserved.
    await expect(
      canvas.queryByRole('textbox', { name: 'Tag' }),
    ).not.toBeInTheDocument();
    await expect(getFormValue()['tags']).toEqual(['a', 'b']);

    // Re-show — rows return with their values in order
    await userEvent.clear(toggle);
    const shown = await canvas.findAllByRole('textbox', { name: 'Tag' });
    await expect(shown.map((i) => (i as HTMLInputElement).value)).toEqual([
      'a',
      'b',
    ]);
  },
};

// ---------------------------------------------------------------------------
// valueStrategy 'last' inside a row survives removal of an earlier row
// ---------------------------------------------------------------------------

export const RowChildLastSurvivesRemoval: Story = {
  name: 'Row Child Last — Survives Removal',
  parameters: {
    docs: {
      description: {
        story:
          "A row child with hideStrategy keep + valueStrategy last keeps its cached value tied to the row's identity, not its index. After an earlier row is removed (shifting indices), the cached value still follows the original row.",
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      toggle: {
        type: 'text',
        label: 'Type "hide" to hide rows',
      },
      contacts: {
        type: 'array',
        label: 'Contacts',
        rowControl: {
          type: 'group',
          controls: {
            name: {
              type: 'text',
              label: 'Name',
              hidden: 'toggle === "hide"',
              hideStrategy: 'keep',
              valueStrategy: 'last',
            },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const add = await canvas.findByTestId('contacts-add');
    await userEvent.click(add);
    await userEvent.click(add);

    // Both group rows render asynchronously; wait for both inputs before
    // typing so the second row's control is present.
    const names = await waitFor(async () => {
      const found = canvas.getAllByRole('textbox', { name: 'Name' });
      await expect(found).toHaveLength(2);
      return found;
    });
    await userEvent.type(names[0], 'first');
    await userEvent.type(names[1], 'second');

    // Hide the child in every row; values are cached by row identity
    const toggle = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide rows',
    });
    await userEvent.type(toggle, 'hide');
    await expect(
      canvas.queryByRole('textbox', { name: 'Name' }),
    ).not.toBeInTheDocument();

    // Remove row 0 while hidden — the surviving row shifts from index 1 to 0
    await userEvent.click(await canvas.findByTestId('contacts-0-remove'));

    // Re-show — the surviving row must still show 'second', not 'first'
    await userEvent.clear(toggle);
    const shown = await canvas.findAllByRole('textbox', { name: 'Name' });
    await expect(shown).toHaveLength(1);
    await expect(shown[0]).toHaveValue('second');
  },
};

// ---------------------------------------------------------------------------
// Disabled cascades from the array to its rows
// ---------------------------------------------------------------------------

export const ArrayDisabledCascades: Story = {
  name: 'Array Disabled — Cascades',
  parameters: {
    docs: {
      description: {
        story:
          'Disabling the array disables all its row controls (FormArray.disable cascades).',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      toggle: {
        type: 'text',
        label: 'Type "off" to disable',
      },
      tags: {
        type: 'array',
        label: 'Tags',
        disabled: 'toggle === "off"',
        rowControl: { type: 'text', label: 'Tag' },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('tags-add'));
    await expect(await canvas.findByRole('textbox', { name: 'Tag' })).toBeEnabled();

    const toggle = await canvas.findByRole('textbox', {
      name: 'Type "off" to disable',
    });
    await userEvent.type(toggle, 'off');

    await expect(
      await canvas.findByRole('textbox', { name: 'Tag' }),
    ).toBeDisabled();

    await userEvent.clear(toggle);
    await expect(
      await canvas.findByRole('textbox', { name: 'Tag' }),
    ).toBeEnabled();
  },
};

// ---------------------------------------------------------------------------
// Disabled on a control inside a row
// ---------------------------------------------------------------------------

export const RowChildDisabled: Story = {
  name: 'Row Child Disabled',
  parameters: {
    docs: {
      description: {
        story:
          'A control inside a row honors its own conditional disabled expression independent of the array.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      toggle: {
        type: 'text',
        label: 'Type "lock" to disable rows',
      },
      contacts: {
        type: 'array',
        label: 'Contacts',
        rowControl: {
          type: 'group',
          controls: {
            name: {
              type: 'text',
              label: 'Name',
              disabled: 'toggle === "lock"',
            },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('contacts-add'));
    await expect(
      await canvas.findByRole('textbox', { name: 'Name' }),
    ).toBeEnabled();

    const toggle = await canvas.findByRole('textbox', {
      name: 'Type "lock" to disable rows',
    });
    await userEvent.type(toggle, 'lock');

    await expect(
      await canvas.findByRole('textbox', { name: 'Name' }),
    ).toBeDisabled();
  },
};

// ---------------------------------------------------------------------------
// Validator on a control inside a row
// ---------------------------------------------------------------------------

export const RowChildValidator: Story = {
  name: 'Row Child Validator',
  parameters: {
    docs: {
      description: {
        story:
          'A validator on a row control shows its error when the row value is invalid and clears when satisfied.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      tags: {
        type: 'array',
        label: 'Tags',
        rowControl: {
          type: 'text',
          label: 'Tag',
          validators: ['min-chars'],
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('tags-add'));
    const input = await canvas.findByRole('textbox', { name: 'Tag' });

    await userEvent.type(input, 'X');
    await userEvent.tab();
    await expect(
      await canvas.findByText('Minimum 3 characters required'),
    ).toBeInTheDocument();

    await userEvent.clear(input);
    await userEvent.type(input, 'XYZ');
    await expect(
      canvas.queryByText('Minimum 3 characters required'),
    ).not.toBeInTheDocument();
  },
};

// ---------------------------------------------------------------------------
// load() shrinks arrays on reload with fewer rows
// ---------------------------------------------------------------------------

export const LoadShrinks: Story = {
  name: 'Load — Shrinks',
  parameters: {
    docs: {
      description: {
        story:
          'Loading data with fewer rows than currently present shrinks the array to match before patching.',
      },
    },
  },
  args: {
    autoUpdate: true,
    patchData: { tags: ['x'] },
    formConfig: formConfig({
      tags: {
        type: 'array',
        label: 'Tags',
        rowControl: { type: 'text', label: 'Tag' },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const add = await canvas.findByTestId('tags-add');
    await userEvent.click(add);
    await userEvent.click(add);
    await userEvent.click(add);
    await expect(await canvas.findAllByRole('textbox', { name: 'Tag' })).toHaveLength(
      3,
    );

    // Load fewer rows than present
    await userEvent.click(await canvas.findByRole('button', { name: 'Patch' }));

    const after = await canvas.findAllByRole('textbox', { name: 'Tag' });
    await expect(after).toHaveLength(1);
    await expect(after[0]).toHaveValue('x');
  },
};

// ---------------------------------------------------------------------------
// load() into a nested array inside a group row
// ---------------------------------------------------------------------------

export const LoadNestedArray: Story = {
  name: 'Load — Nested Array',
  parameters: {
    docs: {
      description: {
        story:
          'Loading recurses through group rows into a nested array, growing the inner array to match the data.',
      },
    },
  },
  args: {
    autoUpdate: true,
    patchData: {
      people: [{ name: 'Ada', nicknames: ['Ace', 'Addie'] }],
    },
    formConfig: formConfig({
      people: {
        type: 'array',
        label: 'People',
        rowControl: {
          type: 'group',
          controls: {
            name: { type: 'text', label: 'Name' },
            nicknames: {
              type: 'array',
              label: 'Nicknames',
              rowControl: { type: 'text', label: 'Nickname' },
            },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole('button', { name: 'Patch' }));

    await expect(await canvas.findByRole('textbox', { name: 'Name' })).toHaveValue(
      'Ada',
    );
    const nicknames = await canvas.findAllByRole('textbox', {
      name: 'Nickname',
    });
    await expect(nicknames).toHaveLength(2);
    await expect(nicknames[0]).toHaveValue('Ace');
    await expect(nicknames[1]).toHaveValue('Addie');
  },
};

// ---------------------------------------------------------------------------
// load() with partial group-row data
// ---------------------------------------------------------------------------

export const LoadPartialRow: Story = {
  name: 'Load — Partial Row Data',
  parameters: {
    docs: {
      description: {
        story:
          'Loading group rows with partial objects patches the present keys and leaves absent keys at their default.',
      },
    },
  },
  args: {
    autoUpdate: true,
    patchData: { contacts: [{ name: 'Ada' }] },
    formConfig: formConfig({
      contacts: {
        type: 'array',
        label: 'Contacts',
        rowControl: {
          type: 'group',
          controls: {
            name: { type: 'text', label: 'Name' },
            email: { type: 'text', label: 'Email', defaultValue: 'none' },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole('button', { name: 'Patch' }));

    await expect(await canvas.findByRole('textbox', { name: 'Name' })).toHaveValue(
      'Ada',
    );
    await expect(await canvas.findByRole('textbox', { name: 'Email' })).toHaveValue(
      'none',
    );
  },
};

// ---------------------------------------------------------------------------
// Reset keeps row count and blanks values
// ---------------------------------------------------------------------------

export const ResetKeepsRowCount: Story = {
  name: 'Reset — Keeps Count, Blanks Values',
  parameters: {
    docs: {
      description: {
        story:
          'Resetting the form keeps the existing rows (native FormArray.reset behavior) and clears their values.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      tags: {
        type: 'array',
        label: 'Tags',
        rowControl: { type: 'text', label: 'Tag' },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const add = await canvas.findByTestId('tags-add');
    await userEvent.click(add);
    await userEvent.click(add);

    const inputs = await canvas.findAllByRole('textbox', { name: 'Tag' });
    await userEvent.type(inputs[0], 'a');
    await userEvent.type(inputs[1], 'b');

    await userEvent.click(await canvas.findByRole('button', { name: 'Reset' }));

    const afterReset = await canvas.findAllByRole('textbox', { name: 'Tag' });
    await expect(afterReset).toHaveLength(2);
    await expect(afterReset[0]).toHaveValue('');
    await expect(afterReset[1]).toHaveValue('');
  },
};

// ---------------------------------------------------------------------------
// Dynamic label on an array
// ---------------------------------------------------------------------------

export const ArrayDynamicLabel: Story = {
  name: 'Array Dynamic Label',
  parameters: {
    docs: {
      description: {
        story:
          "The array's dynamicLabel expression updates the rendered label as the form value changes.",
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      source: {
        type: 'text',
        label: 'Source',
        defaultValue: 'Initial',
        nonNullable: true,
      },
      tags: {
        type: 'array',
        label: 'Static Fallback',
        dynamicLabel: "source + ' Tags'",
        rowControl: { type: 'text', label: 'Tag' },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await expect(await canvas.findByText('Initial Tags')).toBeInTheDocument();

    const source = await canvas.findByRole('textbox', { name: 'Source' });
    await userEvent.clear(source);
    await userEvent.type(source, 'Custom');

    await expect(await canvas.findByText('Custom Tags')).toBeInTheDocument();
  },
};

// ---------------------------------------------------------------------------
// Update strategy on a row control (blur)
// ---------------------------------------------------------------------------

export const RowUpdateOnBlur: Story = {
  name: 'Row Update Strategy — Blur',
  parameters: {
    docs: {
      description: {
        story:
          'A row control with updateOn blur commits its value to the model only on blur, not per keystroke.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      tags: {
        type: 'array',
        label: 'Tags',
        rowControl: { type: 'text', label: 'Tag', updateOn: 'blur' },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('tags-add'));
    const input = await canvas.findByRole('textbox', { name: 'Tag' });

    await userEvent.type(input, 'typed');
    // Keystrokes land in the input, but updateOn 'blur' withholds them from the
    // model until the field is blurred — so the input shows the text while the
    // form value does not yet carry it.
    await expect(input).toHaveValue('typed');
    await expect(getFormValue()['tags']).not.toEqual(['typed']);

    await userEvent.tab();
    await expect(getFormValue()['tags']).toEqual(['typed']);
  },
};

// ---------------------------------------------------------------------------
// Readonly — static on a row child
// ---------------------------------------------------------------------------

export const RowChildReadonlyStatic: Story = {
  name: 'Row Child Readonly — Static',
  parameters: {
    docs: {
      description: {
        story:
          'A group row child with readonly true gets the readonly attribute; its sibling stays editable.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      contacts: {
        type: 'array',
        label: 'Contacts',
        rowControl: {
          type: 'group',
          controls: {
            name: { type: 'text', label: 'Name', readonly: true },
            email: { type: 'text', label: 'Email' },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('contacts-add'));

    await expect(
      await canvas.findByRole('textbox', { name: 'Name' }),
    ).toHaveAttribute('readonly');
    await expect(
      await canvas.findByRole('textbox', { name: 'Email' }),
    ).not.toHaveAttribute('readonly');
  },
};

// ---------------------------------------------------------------------------
// Readonly — conditional on a row child
// ---------------------------------------------------------------------------

export const RowChildReadonlyConditional: Story = {
  name: 'Row Child Readonly — Conditional',
  parameters: {
    docs: {
      description: {
        story:
          'A row child readonly expression toggles the readonly attribute on and off reactively.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      toggle: {
        type: 'text',
        label: 'Type "lock" to lock rows',
      },
      contacts: {
        type: 'array',
        label: 'Contacts',
        rowControl: {
          type: 'group',
          controls: {
            name: {
              type: 'text',
              label: 'Name',
              readonly: 'toggle === "lock"',
            },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('contacts-add'));
    await expect(
      await canvas.findByRole('textbox', { name: 'Name' }),
    ).not.toHaveAttribute('readonly');

    const toggle = await canvas.findByRole('textbox', {
      name: 'Type "lock" to lock rows',
    });
    await userEvent.type(toggle, 'lock');
    await expect(
      await canvas.findByRole('textbox', { name: 'Name' }),
    ).toHaveAttribute('readonly');

    await userEvent.clear(toggle);
    await expect(
      await canvas.findByRole('textbox', { name: 'Name' }),
    ).not.toHaveAttribute('readonly');
  },
};

// ---------------------------------------------------------------------------
// Readonly — array cascades to rows
// ---------------------------------------------------------------------------

export const ArrayReadonlyCascadesToRows: Story = {
  name: 'Array Readonly — Cascades',
  parameters: {
    docs: {
      description: {
        story: 'A readonly array marks its row children readonly.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      tags: {
        type: 'array',
        label: 'Tags',
        readonly: true,
        rowControl: { type: 'text', label: 'Tag' },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('tags-add'));
    await expect(
      await canvas.findByRole('textbox', { name: 'Tag' }),
    ).toHaveAttribute('readonly');
  },
};

// ---------------------------------------------------------------------------
// Readonly — row child overrides array readonly
// ---------------------------------------------------------------------------

export const RowChildReadonlyOverridesArray: Story = {
  name: 'Row Child Readonly — Overrides Array',
  parameters: {
    docs: {
      description: {
        story:
          'A readonly array with one row child set to readonly false leaves that child editable while siblings stay readonly.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      contacts: {
        type: 'array',
        label: 'Contacts',
        readonly: true,
        rowControl: {
          type: 'group',
          controls: {
            name: { type: 'text', label: 'Name' },
            email: { type: 'text', label: 'Email', readonly: false },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('contacts-add'));

    await expect(
      await canvas.findByRole('textbox', { name: 'Name' }),
    ).toHaveAttribute('readonly');
    await expect(
      await canvas.findByRole('textbox', { name: 'Email' }),
    ).not.toHaveAttribute('readonly');
  },
};

// ---------------------------------------------------------------------------
// Readonly — initial state from default value
// ---------------------------------------------------------------------------

export const RowChildReadonlyInitialState: Story = {
  name: 'Row Child Readonly — Initial State',
  parameters: {
    docs: {
      description: {
        story:
          'A toggle defaultValue that satisfies the readonly expression makes the row child readonly on first render.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      toggle: {
        type: 'text',
        label: 'Lock toggle',
        defaultValue: 'lock',
      },
      contacts: {
        type: 'array',
        label: 'Contacts',
        rowControl: {
          type: 'group',
          controls: {
            name: {
              type: 'text',
              label: 'Name',
              readonly: 'toggle === "lock"',
            },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('contacts-add'));
    await expect(
      await canvas.findByRole('textbox', { name: 'Name' }),
    ).toHaveAttribute('readonly');

    await userEvent.clear(await canvas.findByRole('textbox', { name: 'Lock toggle' }));
    await expect(
      await canvas.findByRole('textbox', { name: 'Name' }),
    ).not.toHaveAttribute('readonly');
  },
};

// ---------------------------------------------------------------------------
// Disabled — function-based on a row child
// ---------------------------------------------------------------------------

export const RowChildDisabledFunction: Story = {
  name: 'Row Child Disabled — Function',
  parameters: {
    docs: {
      description: {
        story:
          'A function-based disabled expression on a row child toggles the disabled state reactively.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      toggle: {
        type: 'text',
        label: 'Type "off" to disable rows',
        defaultValue: '',
      },
      contacts: {
        type: 'array',
        label: 'Contacts',
        rowControl: {
          type: 'group',
          controls: {
            name: {
              type: 'text',
              label: 'Name',
              disabled: (ctx: FormContext) => ctx['toggle'] === 'off',
            },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('contacts-add'));
    await expect(
      await canvas.findByRole('textbox', { name: 'Name' }),
    ).not.toBeDisabled();

    const toggle = await canvas.findByRole('textbox', {
      name: 'Type "off" to disable rows',
    });
    await userEvent.type(toggle, 'off');
    await expect(
      await canvas.findByRole('textbox', { name: 'Name' }),
    ).toBeDisabled();

    await userEvent.clear(toggle);
    await expect(
      await canvas.findByRole('textbox', { name: 'Name' }),
    ).not.toBeDisabled();
  },
};

// ---------------------------------------------------------------------------
// Disabled — row child overrides array disabled
// ---------------------------------------------------------------------------

export const RowChildDisabledOverridesArrayDisabled: Story = {
  name: 'Row Child Disabled — Overrides Array',
  parameters: {
    docs: {
      description: {
        story:
          'A disabled array with one row child set to disabled false leaves that child enabled while siblings stay disabled.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      contacts: {
        type: 'array',
        label: 'Contacts',
        disabled: true,
        rowControl: {
          type: 'group',
          controls: {
            name: { type: 'text', label: 'Name' },
            email: { type: 'text', label: 'Email', disabled: false },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('contacts-add'));

    await expect(
      await canvas.findByRole('textbox', { name: 'Name' }),
    ).toBeDisabled();
    await expect(
      await canvas.findByRole('textbox', { name: 'Email' }),
    ).not.toBeDisabled();
  },
};

// ---------------------------------------------------------------------------
// Disabled — initial state from default value
// ---------------------------------------------------------------------------

export const RowChildInitialDisabledState: Story = {
  name: 'Row Child Disabled — Initial State',
  parameters: {
    docs: {
      description: {
        story:
          'A toggle defaultValue that satisfies the disabled expression disables the row child on first render.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      toggle: {
        type: 'text',
        label: 'Disable toggle',
        defaultValue: 'off',
      },
      contacts: {
        type: 'array',
        label: 'Contacts',
        rowControl: {
          type: 'group',
          controls: {
            name: {
              type: 'text',
              label: 'Name',
              disabled: 'toggle === "off"',
            },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('contacts-add'));
    await expect(
      await canvas.findByRole('textbox', { name: 'Name' }),
    ).toBeDisabled();

    await userEvent.clear(
      await canvas.findByRole('textbox', { name: 'Disable toggle' }),
    );
    await expect(
      await canvas.findByRole('textbox', { name: 'Name' }),
    ).not.toBeDisabled();
  },
};

// ---------------------------------------------------------------------------
// Computed value on a row child driven by a root field
// ---------------------------------------------------------------------------

export const RowChildComputedValue: Story = {
  name: 'Row Child Computed Value',
  parameters: {
    docs: {
      description: {
        story:
          'A row child computedValue reacts to a root field. Expressions resolve against the root form value, so every row computes the same derived value from that shared source.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      source: { type: 'text', label: 'Source', defaultValue: 'Hello' },
      people: {
        type: 'array',
        label: 'People',
        rowControl: {
          type: 'group',
          controls: {
            name: { type: 'text', label: 'Name' },
            greeting: {
              type: 'text',
              label: 'Greeting',
              computedValue: 'source + " World"',
            },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const add = await canvas.findByTestId('people-add');
    await userEvent.click(add);
    await userEvent.click(add);

    const greetings = await waitFor(async () => {
      const found = canvas.getAllByRole('textbox', { name: 'Greeting' });
      await expect(found).toHaveLength(2);
      return found;
    });

    // Both rows compute from the shared root source on first render.
    await expect(greetings[0]).toHaveValue('Hello World');
    await expect(greetings[1]).toHaveValue('Hello World');

    // Updating the root source updates every row's computed child.
    const source = await canvas.findByRole('textbox', { name: 'Source' });
    await userEvent.clear(source);
    await userEvent.type(source, 'Goodbye');

    const updated = canvas.getAllByRole('textbox', { name: 'Greeting' });
    await expect(updated[0]).toHaveValue('Goodbye World');
    await expect(updated[1]).toHaveValue('Goodbye World');
  },
};

// ---------------------------------------------------------------------------
// Async validator on a row child
// ---------------------------------------------------------------------------

export const RowChildAsyncValidator: Story = {
  name: 'Row Child Async Validator',
  parameters: {
    docs: {
      description: {
        story:
          'An async validator on a row control shows its error then clears once the value contains "async".',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      tags: {
        type: 'array',
        label: 'Tags',
        rowControl: {
          type: 'text',
          label: 'Tag',
          asyncValidators: ['async'],
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('tags-add'));
    const input = await canvas.findByRole('textbox', { name: 'Tag' });

    await userEvent.type(input, 'nope');
    await userEvent.tab();
    await waitFor(
      async () => {
        await expect(
          await canvas.findByText('Value must contain "async"'),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    await userEvent.clear(input);
    await userEvent.type(input, 'async');
    await waitFor(
      async () => {
        await expect(
          canvas.queryByText('Value must contain "async"'),
        ).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  },
};

// ---------------------------------------------------------------------------
// Array-level validator (minimum rows)
// ---------------------------------------------------------------------------

export const ArrayLevelValidator: Story = {
  name: 'Array Level Validator — Min Rows',
  parameters: {
    docs: {
      description: {
        story:
          'An array-level validator receives the FormArray and requires a minimum number of rows. The error shows when there are too few rows and clears once enough are present.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      tags: {
        type: 'array',
        label: 'Tags',
        validators: ['min-rows'],
        rowControl: { type: 'text', label: 'Tag' },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const add = await canvas.findByTestId('tags-add');

    // One row — below the minimum of two. Typing marks the array dirty so the
    // array-level error renders.
    await userEvent.click(add);
    await userEvent.type(
      await canvas.findByRole('textbox', { name: 'Tag' }),
      'one',
    );
    await expect(
      await canvas.findByText('At least 2 rows required'),
    ).toBeInTheDocument();

    // Second row reaches the minimum and clears the error
    await userEvent.click(add);
    await expect(
      canvas.queryByText('At least 2 rows required'),
    ).not.toBeInTheDocument();

    // Removing back below the minimum brings the error back
    await userEvent.click(await canvas.findByTestId('tags-1-remove'));
    await expect(
      await canvas.findByText('At least 2 rows required'),
    ).toBeInTheDocument();
  },
};

// ---------------------------------------------------------------------------
// Row child valueStrategy reset (keep)
// ---------------------------------------------------------------------------

export const RowChildValueStrategyReset: Story = {
  name: 'Row Child Value Strategy — Reset',
  parameters: {
    docs: {
      description: {
        story:
          'A row child with hideStrategy keep + valueStrategy reset clears its value to null when hidden and shows empty on re-show.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      toggle: {
        type: 'text',
        label: 'Type "hide" to hide rows',
      },
      contacts: {
        type: 'array',
        label: 'Contacts',
        rowControl: {
          type: 'group',
          controls: {
            name: {
              type: 'text',
              label: 'Name',
              hidden: 'toggle === "hide"',
              hideStrategy: 'keep',
              valueStrategy: 'reset',
            },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('contacts-add'));
    const input = await canvas.findByRole('textbox', { name: 'Name' });
    await userEvent.type(input, 'typed');

    const toggle = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide rows',
    });
    await userEvent.type(toggle, 'hide');

    await expect(
      canvas.queryByRole('textbox', { name: 'Name' }),
    ).not.toBeInTheDocument();
    await expect(getFormValue()['contacts']).toEqual([{ name: null }]);

    await userEvent.clear(toggle);
    await expect(
      await canvas.findByRole('textbox', { name: 'Name' }),
    ).toHaveValue('');
  },
};

// ---------------------------------------------------------------------------
// Row child valueStrategy default (keep)
// ---------------------------------------------------------------------------

export const RowChildValueStrategyDefault: Story = {
  name: 'Row Child Value Strategy — Default',
  parameters: {
    docs: {
      description: {
        story:
          'A row child with hideStrategy keep + valueStrategy default reverts to its defaultValue when hidden and shows the default on re-show.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      toggle: {
        type: 'text',
        label: 'Type "hide" to hide rows',
      },
      contacts: {
        type: 'array',
        label: 'Contacts',
        rowControl: {
          type: 'group',
          controls: {
            name: {
              type: 'text',
              label: 'Name',
              defaultValue: 'default-name',
              hidden: 'toggle === "hide"',
              hideStrategy: 'keep',
              valueStrategy: 'default',
            },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('contacts-add'));
    const input = await canvas.findByRole('textbox', { name: 'Name' });
    await userEvent.clear(input);
    await userEvent.type(input, 'typed');

    const toggle = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide rows',
    });
    await userEvent.type(toggle, 'hide');

    await expect(
      canvas.queryByRole('textbox', { name: 'Name' }),
    ).not.toBeInTheDocument();
    await expect(getFormValue()['contacts']).toEqual([{ name: 'default-name' }]);

    await userEvent.clear(toggle);
    await expect(
      await canvas.findByRole('textbox', { name: 'Name' }),
    ).toHaveValue('default-name');
  },
};

// ---------------------------------------------------------------------------
// Rows inherit hideStrategy from the array
// ---------------------------------------------------------------------------

export const RowInheritsHideStrategyFromArray: Story = {
  name: 'Row Inherits Hide Strategy — Keep',
  parameters: {
    docs: {
      description: {
        story:
          'When the array uses hideStrategy keep, hiding the array keeps its rows in the form model.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      toggle: {
        type: 'text',
        label: 'Type "hide" to hide the array',
      },
      tags: {
        type: 'array',
        label: 'Tags',
        hidden: 'toggle === "hide"',
        hideStrategy: 'keep',
        rowControl: { type: 'text', label: 'Tag' },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const add = await canvas.findByTestId('tags-add');
    await userEvent.click(add);
    await userEvent.click(add);

    const inputs = await canvas.findAllByRole('textbox', { name: 'Tag' });
    await userEvent.type(inputs[0], 'a');
    await userEvent.type(inputs[1], 'b');

    const toggle = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide the array',
    });
    await userEvent.type(toggle, 'hide');

    await expect(
      canvas.queryByRole('textbox', { name: 'Tag' }),
    ).not.toBeInTheDocument();
    await expect(getFormValue()['tags']).toEqual(['a', 'b']);

    await userEvent.clear(toggle);
    const shown = await canvas.findAllByRole('textbox', { name: 'Tag' });
    await expect(shown.map((i) => (i as HTMLInputElement).value)).toEqual([
      'a',
      'b',
    ]);
  },
};

// ---------------------------------------------------------------------------
// Array valueStrategy does not touch its rows
// ---------------------------------------------------------------------------

export const ArrayValueStrategyDoesNotTouchRows: Story = {
  name: 'Array Value Strategy — No Row Cascade',
  parameters: {
    docs: {
      description: {
        story:
          'A valueStrategy on the array itself does not cascade to its rows. With hideStrategy keep, hiding the array preserves the rows and their values unchanged; the array does not reset or default its row values. Per-row controls own their own value strategies.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      toggle: {
        type: 'text',
        label: 'Type "hide" to hide the array',
      },
      tags: {
        type: 'array',
        label: 'Tags',
        hidden: 'toggle === "hide"',
        hideStrategy: 'keep',
        valueStrategy: 'reset',
        rowControl: { type: 'text', label: 'Tag' },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const add = await canvas.findByTestId('tags-add');
    await userEvent.click(add);
    await userEvent.click(add);

    const inputs = await canvas.findAllByRole('textbox', { name: 'Tag' });
    await userEvent.type(inputs[0], 'a');
    await userEvent.type(inputs[1], 'b');

    const toggle = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide the array',
    });
    await userEvent.type(toggle, 'hide');

    await expect(
      canvas.queryByRole('textbox', { name: 'Tag' }),
    ).not.toBeInTheDocument();
    // The array's own valueStrategy is a no-op on its rows: values are kept.
    await expect(getFormValue()['tags']).toEqual(['a', 'b']);

    await userEvent.clear(toggle);
    const shown = await canvas.findAllByRole('textbox', { name: 'Tag' });
    await expect(shown.map((i) => (i as HTMLInputElement).value)).toEqual([
      'a',
      'b',
    ]);
  },
};

// ---------------------------------------------------------------------------
// Rows inherit updateOn from the array
// ---------------------------------------------------------------------------

export const RowInheritsUpdateOnFromArray: Story = {
  name: 'Row Inherits Update On — Blur',
  parameters: {
    docs: {
      description: {
        story:
          'When the array sets updateOn blur, its row controls commit to the model only on blur, not per keystroke.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      tags: {
        type: 'array',
        label: 'Tags',
        updateOn: 'blur',
        rowControl: { type: 'text', label: 'Tag' },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('tags-add'));
    const input = await canvas.findByRole('textbox', { name: 'Tag' });

    await userEvent.type(input, 'typed');
    await expect(input).toHaveValue('typed');
    await expect(getFormValue()['tags']).not.toEqual(['typed']);

    await userEvent.tab();
    await expect(getFormValue()['tags']).toEqual(['typed']);
  },
};

// ---------------------------------------------------------------------------
// Row child updateOn submit
// ---------------------------------------------------------------------------

export const RowChildUpdateOnSubmit: Story = {
  name: 'Row Child Update On — Submit',
  parameters: {
    docs: {
      description: {
        story:
          'A row child with updateOn submit commits its value to the model only when the form is submitted.',
      },
    },
  },
  args: {
    formConfig: formConfig({
      tags: {
        type: 'array',
        label: 'Tags',
        rowControl: { type: 'text', label: 'Tag', updateOn: 'submit' },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('tags-add'));
    const input = await canvas.findByRole('textbox', { name: 'Tag' });

    await userEvent.type(input, 'submit-text');
    await userEvent.tab();
    await expect(getFormValue()['tags']).not.toEqual(['submit-text']);

    await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
    await expect(getFormValue()['tags']).toEqual(['submit-text']);
  },
};

// ---------------------------------------------------------------------------
// Dynamic title on a group row
// ---------------------------------------------------------------------------

export const RowDynamicTitle: Story = {
  name: 'Row Dynamic Title',
  parameters: {
    docs: {
      description: {
        story:
          "A group row's dynamicTitle expression is driven by a root field and updates reactively. Expressions resolve against the root form value, so the title reflects that shared source.",
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      source: { type: 'text', label: 'Source', defaultValue: 'Ada' },
      contacts: {
        type: 'array',
        label: 'Contacts',
        rowControl: {
          type: 'group',
          title: 'Static Row Title',
          dynamicTitle: "source + ' contact'",
          controls: {
            name: { type: 'text', label: 'Name' },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('contacts-add'));

    await expect(
      await canvas.findByRole('group', { name: 'Ada contact' }),
    ).toBeInTheDocument();

    const source = await canvas.findByRole('textbox', { name: 'Source' });
    await userEvent.clear(source);
    await userEvent.type(source, 'Alan');
    await expect(
      await canvas.findByRole('group', { name: 'Alan contact' }),
    ).toBeInTheDocument();
  },
};

// ---------------------------------------------------------------------------
// Dynamic label on a row child
// ---------------------------------------------------------------------------

export const RowChildDynamicLabel: Story = {
  name: 'Row Child Dynamic Label',
  parameters: {
    docs: {
      description: {
        story:
          "A row child's dynamicLabel expression is driven by another field and updates reactively.",
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      source: {
        type: 'text',
        label: 'Source',
        defaultValue: 'Initial',
      },
      tags: {
        type: 'array',
        label: 'Tags',
        rowControl: {
          type: 'text',
          label: 'Static Fallback',
          dynamicLabel: "source + ' Tag'",
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('tags-add'));
    await expect(await canvas.findByText('Initial Tag')).toBeInTheDocument();

    const source = await canvas.findByRole('textbox', { name: 'Source' });
    await userEvent.clear(source);
    await userEvent.type(source, 'Custom');
    await expect(await canvas.findByText('Custom Tag')).toBeInTheDocument();
  },
};

// ---------------------------------------------------------------------------
// data-testid composition for array rows and children
// ---------------------------------------------------------------------------

export const ArrayRowTestIdComposition: Story = {
  name: 'Array Row TestId Composition',
  parameters: {
    docs: {
      description: {
        story:
          'Array rows compose their data-testids from the array key, the row index, and the child name: scalar rows expose `<key>-<i>-input` and group-row children expose `<key>-<i>-<child>-input`. Row operation buttons follow `<key>-<i>-remove` etc.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      tags: {
        type: 'array',
        label: 'Tags',
        rowControl: { type: 'text', label: 'Tag' },
      },
      contacts: {
        type: 'array',
        label: 'Contacts',
        rowControl: {
          type: 'group',
          controls: {
            name: { type: 'text', label: 'Name' },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const tagsAdd = await canvas.findByTestId('tags-add');
    await userEvent.click(tagsAdd);

    // Scalar row: input and row operation buttons
    await expect(await canvas.findByTestId('tags-0-input')).toBeInTheDocument();
    await expect(await canvas.findByTestId('tags-0-remove')).toBeInTheDocument();
    await expect(await canvas.findByTestId('tags-0-insert')).toBeInTheDocument();
    await expect(
      await canvas.findByTestId('tags-0-move-up'),
    ).toBeInTheDocument();
    await expect(
      await canvas.findByTestId('tags-0-move-down'),
    ).toBeInTheDocument();

    // Group row child: composed under the array key, the index, then the child
    await userEvent.click(await canvas.findByTestId('contacts-add'));
    await expect(
      await canvas.findByTestId('contacts-0-name-input'),
    ).toBeInTheDocument();
  },
};

// ---------------------------------------------------------------------------
// Hide remove on a nested child inside a group row
// ---------------------------------------------------------------------------

export const RowChildHideStrategyRemoveInGroupRow: Story = {
  name: 'Row Child Hide Strategy — Remove (group row)',
  parameters: {
    docs: {
      description: {
        story:
          "A child inside a group row with hideStrategy remove drops its own key from each row object when hidden (siblings and rows remain), and re-attaches the key with its cached value on show.",
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      toggle: {
        type: 'text',
        label: 'Type "hide" to hide the child',
      },
      contacts: {
        type: 'array',
        label: 'Contacts',
        rowControl: {
          type: 'group',
          controls: {
            name: { type: 'text', label: 'Name' },
            note: {
              type: 'text',
              label: 'Note',
              hidden: 'toggle === "hide"',
              hideStrategy: 'remove',
              valueStrategy: 'last',
            },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const add = await canvas.findByTestId('contacts-add');
    await userEvent.click(add);
    await userEvent.click(add);

    const names = await waitFor(async () => {
      const found = canvas.getAllByRole('textbox', { name: 'Name' });
      await expect(found).toHaveLength(2);
      return found;
    });
    const notes = canvas.getAllByRole('textbox', { name: 'Note' });
    await userEvent.type(names[0], 'Ada');
    await userEvent.type(notes[0], 'first note');
    await userEvent.type(names[1], 'Alan');
    await userEvent.type(notes[1], 'second note');

    const toggle = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide the child',
    });
    await userEvent.type(toggle, 'hide');

    // The note input is gone in every row, but the rows and siblings remain.
    await expect(
      canvas.queryByRole('textbox', { name: 'Note' }),
    ).not.toBeInTheDocument();
    await expect(getFormValue()['contacts']).toEqual([
      { name: 'Ada' },
      { name: 'Alan' },
    ]);

    // Re-show — the key returns with its cached value in each row.
    await userEvent.clear(toggle);
    const shownNotes = await canvas.findAllByRole('textbox', { name: 'Note' });
    await expect(shownNotes).toHaveLength(2);
    await expect(shownNotes[0]).toHaveValue('first note');
    await expect(shownNotes[1]).toHaveValue('second note');
    await expect(getFormValue()['contacts']).toEqual([
      { name: 'Ada', note: 'first note' },
      { name: 'Alan', note: 'second note' },
    ]);
  },
};

// ---------------------------------------------------------------------------
// Scalar row top: readonly static
// ---------------------------------------------------------------------------

export const ScalarRowTopReadonlyStatic: Story = {
  name: 'Scalar Row Top Readonly — Static',
  parameters: {
    docs: {
      description: {
        story:
          'A scalar row top with readonly true gets the readonly attribute on its row input. A second scalar array without it stays editable.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      tags: {
        type: 'array',
        label: 'Tags',
        rowControl: { type: 'text', label: 'Tag', readonly: true },
      },
      notes: {
        type: 'array',
        label: 'Notes',
        rowControl: { type: 'text', label: 'Note' },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('tags-add'));
    await userEvent.click(await canvas.findByTestId('notes-add'));

    await expect(
      await canvas.findByRole('textbox', { name: 'Tag' }),
    ).toHaveAttribute('readonly');
    await expect(
      await canvas.findByRole('textbox', { name: 'Note' }),
    ).not.toHaveAttribute('readonly');
  },
};

// ---------------------------------------------------------------------------
// Scalar row top: readonly conditional
// ---------------------------------------------------------------------------

export const ScalarRowTopReadonlyConditional: Story = {
  name: 'Scalar Row Top Readonly — Conditional',
  parameters: {
    docs: {
      description: {
        story:
          'A scalar row top readonly expression toggles the readonly attribute on its row input reactively.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      toggle: {
        type: 'text',
        label: 'Type "lock" to lock rows',
      },
      tags: {
        type: 'array',
        label: 'Tags',
        rowControl: {
          type: 'text',
          label: 'Tag',
          readonly: 'toggle === "lock"',
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('tags-add'));
    await expect(
      await canvas.findByRole('textbox', { name: 'Tag' }),
    ).not.toHaveAttribute('readonly');

    const toggle = await canvas.findByRole('textbox', {
      name: 'Type "lock" to lock rows',
    });
    await userEvent.type(toggle, 'lock');
    await expect(
      await canvas.findByRole('textbox', { name: 'Tag' }),
    ).toHaveAttribute('readonly');

    await userEvent.clear(toggle);
    await expect(
      await canvas.findByRole('textbox', { name: 'Tag' }),
    ).not.toHaveAttribute('readonly');
  },
};

// ---------------------------------------------------------------------------
// Scalar row top: disabled function
// ---------------------------------------------------------------------------

export const ScalarRowTopDisabledFunction: Story = {
  name: 'Scalar Row Top Disabled — Function',
  parameters: {
    docs: {
      description: {
        story:
          'A function-based disabled expression on a scalar row top toggles the disabled state of its row input reactively.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      toggle: {
        type: 'text',
        label: 'Type "off" to disable rows',
        defaultValue: '',
      },
      tags: {
        type: 'array',
        label: 'Tags',
        rowControl: {
          type: 'text',
          label: 'Tag',
          disabled: (ctx: FormContext) => ctx['toggle'] === 'off',
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('tags-add'));
    await expect(
      await canvas.findByRole('textbox', { name: 'Tag' }),
    ).not.toBeDisabled();

    const toggle = await canvas.findByRole('textbox', {
      name: 'Type "off" to disable rows',
    });
    await userEvent.type(toggle, 'off');
    await expect(
      await canvas.findByRole('textbox', { name: 'Tag' }),
    ).toBeDisabled();

    await userEvent.clear(toggle);
    await expect(
      await canvas.findByRole('textbox', { name: 'Tag' }),
    ).not.toBeDisabled();
  },
};

// ---------------------------------------------------------------------------
// Scalar row top: computed value driven by a root field
// ---------------------------------------------------------------------------

export const ScalarRowTopComputedValue: Story = {
  name: 'Scalar Row Top Computed Value',
  parameters: {
    docs: {
      description: {
        story:
          'A scalar row top computedValue reacts to a root field. Expressions resolve against the root form value, so every row computes the same derived value from that shared source.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      prefix: { type: 'text', label: 'Prefix', defaultValue: 'alpha' },
      tags: {
        type: 'array',
        label: 'Tags',
        rowControl: {
          type: 'text',
          label: 'Tag',
          computedValue: 'prefix + "-derived"',
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const add = await canvas.findByTestId('tags-add');
    await userEvent.click(add);
    await userEvent.click(add);

    const tags = await waitFor(async () => {
      const found = canvas.getAllByRole('textbox', { name: 'Tag' });
      await expect(found).toHaveLength(2);
      return found;
    });

    await expect(tags[0]).toHaveValue('alpha-derived');
    await expect(tags[1]).toHaveValue('alpha-derived');

    const prefix = await canvas.findByRole('textbox', { name: 'Prefix' });
    await userEvent.clear(prefix);
    await userEvent.type(prefix, 'beta');

    const updated = canvas.getAllByRole('textbox', { name: 'Tag' });
    await expect(updated[0]).toHaveValue('beta-derived');
    await expect(updated[1]).toHaveValue('beta-derived');
  },
};

// ---------------------------------------------------------------------------
// Scalar row top: valueStrategy reset (keep)
// ---------------------------------------------------------------------------

export const ScalarRowTopValueStrategyReset: Story = {
  name: 'Scalar Row Top Value Strategy — Reset',
  parameters: {
    docs: {
      description: {
        story:
          'A scalar row top with hideStrategy keep + valueStrategy reset clears its value to null when hidden and shows empty on re-show.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      toggle: {
        type: 'text',
        label: 'Type "hide" to hide rows',
      },
      tags: {
        type: 'array',
        label: 'Tags',
        rowControl: {
          type: 'text',
          label: 'Tag',
          hidden: 'toggle === "hide"',
          hideStrategy: 'keep',
          valueStrategy: 'reset',
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('tags-add'));
    const input = await canvas.findByRole('textbox', { name: 'Tag' });
    await userEvent.type(input, 'typed');

    const toggle = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide rows',
    });
    await userEvent.type(toggle, 'hide');

    await expect(
      canvas.queryByRole('textbox', { name: 'Tag' }),
    ).not.toBeInTheDocument();
    await expect(getFormValue()['tags']).toEqual([null]);

    await userEvent.clear(toggle);
    await expect(
      await canvas.findByRole('textbox', { name: 'Tag' }),
    ).toHaveValue('');
  },
};

// ---------------------------------------------------------------------------
// Scalar row top: valueStrategy default (keep)
// ---------------------------------------------------------------------------

export const ScalarRowTopValueStrategyDefault: Story = {
  name: 'Scalar Row Top Value Strategy — Default',
  parameters: {
    docs: {
      description: {
        story:
          'A scalar row top with hideStrategy keep + valueStrategy default reverts to its defaultValue when hidden and shows the default on re-show.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      toggle: {
        type: 'text',
        label: 'Type "hide" to hide rows',
      },
      tags: {
        type: 'array',
        label: 'Tags',
        rowControl: {
          type: 'text',
          label: 'Tag',
          defaultValue: 'default-tag',
          hidden: 'toggle === "hide"',
          hideStrategy: 'keep',
          valueStrategy: 'default',
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('tags-add'));
    const input = await canvas.findByRole('textbox', { name: 'Tag' });
    await userEvent.clear(input);
    await userEvent.type(input, 'typed');

    const toggle = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide rows',
    });
    await userEvent.type(toggle, 'hide');

    await expect(
      canvas.queryByRole('textbox', { name: 'Tag' }),
    ).not.toBeInTheDocument();
    await expect(getFormValue()['tags']).toEqual(['default-tag']);

    await userEvent.clear(toggle);
    await expect(
      await canvas.findByRole('textbox', { name: 'Tag' }),
    ).toHaveValue('default-tag');
  },
};

// ---------------------------------------------------------------------------
// Async validator on a child inside a group row
// ---------------------------------------------------------------------------

export const RowChildAsyncValidatorInGroup: Story = {
  name: 'Row Child Async Validator (group row)',
  parameters: {
    docs: {
      description: {
        story:
          'An async validator on a child inside a group row shows its error after a failing value then clears once the value contains "async".',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      contacts: {
        type: 'array',
        label: 'Contacts',
        rowControl: {
          type: 'group',
          controls: {
            name: {
              type: 'text',
              label: 'Name',
              asyncValidators: ['async'],
            },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('contacts-add'));
    const input = await canvas.findByRole('textbox', { name: 'Name' });

    await userEvent.type(input, 'nope');
    await userEvent.tab();
    await waitFor(
      async () => {
        await expect(
          await canvas.findByText('Value must contain "async"'),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    await userEvent.clear(input);
    await userEvent.type(input, 'async');
    await waitFor(
      async () => {
        await expect(
          canvas.queryByText('Value must contain "async"'),
        ).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  },
};

// ---------------------------------------------------------------------------
// UpdateOn submit on a child inside a group row
// ---------------------------------------------------------------------------

export const RowChildUpdateOnSubmitInGroup: Story = {
  name: 'Row Child Update On — Submit (group row)',
  parameters: {
    docs: {
      description: {
        story:
          'A child inside a group row with updateOn submit commits its value to the model only when the form is submitted.',
      },
    },
  },
  args: {
    formConfig: formConfig({
      contacts: {
        type: 'array',
        label: 'Contacts',
        rowControl: {
          type: 'group',
          controls: {
            name: { type: 'text', label: 'Name', updateOn: 'submit' },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('contacts-add'));
    const input = await canvas.findByRole('textbox', { name: 'Name' });

    await userEvent.type(input, 'Ada');
    await userEvent.tab();
    await expect(getFormValue()['contacts']).not.toEqual([{ name: 'Ada' }]);

    await userEvent.click(await canvas.findByRole('button', { name: 'Submit' }));
    await expect(getFormValue()['contacts']).toEqual([{ name: 'Ada' }]);
  },
};

// ---------------------------------------------------------------------------
// Dynamic label on a child inside a group row
// ---------------------------------------------------------------------------

export const RowChildDynamicLabelInGroup: Story = {
  name: 'Row Child Dynamic Label (group row)',
  parameters: {
    docs: {
      description: {
        story:
          "A group-row child's dynamicLabel expression is driven by a root field and updates reactively.",
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      fieldType: { type: 'text', label: 'Field Type', defaultValue: 'email' },
      contacts: {
        type: 'array',
        label: 'Contacts',
        rowControl: {
          type: 'group',
          controls: {
            value: {
              type: 'text',
              label: 'Static Fallback',
              dynamicLabel: "fieldType + ' address'",
            },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('contacts-add'));
    await expect(await canvas.findByText('email address')).toBeInTheDocument();

    const fieldType = await canvas.findByRole('textbox', { name: 'Field Type' });
    await userEvent.clear(fieldType);
    await userEvent.type(fieldType, 'phone');
    await expect(await canvas.findByText('phone address')).toBeInTheDocument();
  },
};

// ---------------------------------------------------------------------------
// Group row top: hidden keep
// ---------------------------------------------------------------------------

export const RowGroupTopHiddenKeep: Story = {
  name: 'Row Group Top Hidden — Keep',
  parameters: {
    docs: {
      description: {
        story:
          'A group row top with hideStrategy keep keeps each row in the FormArray when hidden; with no valueStrategy the field values revert to their default, the same as a regular group.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      toggle: {
        type: 'text',
        label: 'Type "hide" to hide rows',
      },
      contacts: {
        type: 'array',
        label: 'Contacts',
        rowControl: {
          type: 'group',
          hidden: 'toggle === "hide"',
          hideStrategy: 'keep',
          controls: {
            name: { type: 'text', label: 'Name' },
            email: { type: 'text', label: 'Email' },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const add = await canvas.findByTestId('contacts-add');
    await userEvent.click(add);
    await userEvent.click(add);

    const names = await waitFor(async () => {
      const found = canvas.getAllByRole('textbox', { name: 'Name' });
      await expect(found).toHaveLength(2);
      return found;
    });
    const emails = canvas.getAllByRole('textbox', { name: 'Email' });
    await userEvent.type(names[0], 'Ada');
    await userEvent.type(emails[0], 'ada@example.com');
    await userEvent.type(names[1], 'Alan');
    await userEvent.type(emails[1], 'alan@example.com');

    const toggle = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide rows',
    });
    await userEvent.type(toggle, 'hide');

    await expect(
      canvas.queryByRole('textbox', { name: 'Name' }),
    ).not.toBeInTheDocument();
    await expect(getFormValue()['contacts']).toHaveLength(2);

    await userEvent.clear(toggle);
    const shownNames = await canvas.findAllByRole('textbox', { name: 'Name' });
    const shownEmails = canvas.getAllByRole('textbox', { name: 'Email' });
    await expect(shownNames.map((i) => (i as HTMLInputElement).value)).toEqual([
      '',
      '',
    ]);
    await expect(shownEmails.map((i) => (i as HTMLInputElement).value)).toEqual([
      '',
      '',
    ]);
  },
};

// ---------------------------------------------------------------------------
// Group row top: disabled cascades to both children
// ---------------------------------------------------------------------------

export const RowGroupTopDisabled: Story = {
  name: 'Row Group Top Disabled — Cascades',
  parameters: {
    docs: {
      description: {
        story:
          'A group row top disabled expression cascades to both of its children, toggling them disabled and enabled together.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      toggle: {
        type: 'text',
        label: 'Type "off" to disable rows',
      },
      contacts: {
        type: 'array',
        label: 'Contacts',
        rowControl: {
          type: 'group',
          disabled: 'toggle === "off"',
          controls: {
            name: { type: 'text', label: 'Name' },
            email: { type: 'text', label: 'Email' },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('contacts-add'));
    await expect(
      await canvas.findByRole('textbox', { name: 'Name' }),
    ).not.toBeDisabled();
    await expect(
      await canvas.findByRole('textbox', { name: 'Email' }),
    ).not.toBeDisabled();

    const toggle = await canvas.findByRole('textbox', {
      name: 'Type "off" to disable rows',
    });
    await userEvent.type(toggle, 'off');
    await expect(
      await canvas.findByRole('textbox', { name: 'Name' }),
    ).toBeDisabled();
    await expect(
      await canvas.findByRole('textbox', { name: 'Email' }),
    ).toBeDisabled();

    await userEvent.clear(toggle);
    await expect(
      await canvas.findByRole('textbox', { name: 'Name' }),
    ).not.toBeDisabled();
    await expect(
      await canvas.findByRole('textbox', { name: 'Email' }),
    ).not.toBeDisabled();
  },
};

// ---------------------------------------------------------------------------
// Group row top: readonly cascades to both children
// ---------------------------------------------------------------------------

export const RowGroupTopReadonly: Story = {
  name: 'Row Group Top Readonly — Cascades',
  parameters: {
    docs: {
      description: {
        story:
          'A group row top readonly expression cascades the readonly attribute to both of its children.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      toggle: {
        type: 'text',
        label: 'Type "lock" to lock rows',
      },
      contacts: {
        type: 'array',
        label: 'Contacts',
        rowControl: {
          type: 'group',
          readonly: 'toggle === "lock"',
          controls: {
            name: { type: 'text', label: 'Name' },
            email: { type: 'text', label: 'Email' },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('contacts-add'));
    await expect(
      await canvas.findByRole('textbox', { name: 'Name' }),
    ).not.toHaveAttribute('readonly');
    await expect(
      await canvas.findByRole('textbox', { name: 'Email' }),
    ).not.toHaveAttribute('readonly');

    const toggle = await canvas.findByRole('textbox', {
      name: 'Type "lock" to lock rows',
    });
    await userEvent.type(toggle, 'lock');
    await expect(
      await canvas.findByRole('textbox', { name: 'Name' }),
    ).toHaveAttribute('readonly');
    await expect(
      await canvas.findByRole('textbox', { name: 'Email' }),
    ).toHaveAttribute('readonly');

    await userEvent.clear(toggle);
    await expect(
      await canvas.findByRole('textbox', { name: 'Name' }),
    ).not.toHaveAttribute('readonly');
    await expect(
      await canvas.findByRole('textbox', { name: 'Email' }),
    ).not.toHaveAttribute('readonly');
  },
};

// ---------------------------------------------------------------------------
// Group row top: valueStrategy reset (keep)
// ---------------------------------------------------------------------------

export const RowGroupTopValueStrategyReset: Story = {
  name: 'Row Group Top Value Strategy — Reset',
  parameters: {
    docs: {
      description: {
        story:
          'A group row top with valueStrategy reset clears each child to null when hidden (hideStrategy keep), exactly as a regular group does; children return empty on show.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      toggle: {
        type: 'text',
        label: 'Type "hide" to hide rows',
      },
      contacts: {
        type: 'array',
        label: 'Contacts',
        rowControl: {
          type: 'group',
          hidden: 'toggle === "hide"',
          hideStrategy: 'keep',
          valueStrategy: 'reset',
          controls: {
            name: { type: 'text', label: 'Name' },
            email: { type: 'text', label: 'Email' },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('contacts-add'));
    const name = await canvas.findByRole('textbox', { name: 'Name' });
    const email = await canvas.findByRole('textbox', { name: 'Email' });
    await userEvent.type(name, 'Ada');
    await userEvent.type(email, 'ada@example.com');

    const toggle = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide rows',
    });
    await userEvent.type(toggle, 'hide');

    await expect(
      canvas.queryByRole('textbox', { name: 'Name' }),
    ).not.toBeInTheDocument();
    await expect(getFormValue()['contacts']).toEqual([
      { name: null, email: null },
    ]);

    await userEvent.clear(toggle);
    await expect(
      await canvas.findByRole('textbox', { name: 'Name' }),
    ).toHaveValue('');
    await expect(
      await canvas.findByRole('textbox', { name: 'Email' }),
    ).toHaveValue('');
  },
};

// ---------------------------------------------------------------------------
// Group row top: valueStrategy default (keep)
// ---------------------------------------------------------------------------

export const RowGroupTopValueStrategyDefault: Story = {
  name: 'Row Group Top Value Strategy — Default',
  parameters: {
    docs: {
      description: {
        story:
          'A group row top with valueStrategy default reverts each child to its defaultValue when hidden (hideStrategy keep), exactly as a regular group does; children show their defaults on re-show.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      toggle: {
        type: 'text',
        label: 'Type "hide" to hide rows',
      },
      contacts: {
        type: 'array',
        label: 'Contacts',
        rowControl: {
          type: 'group',
          hidden: 'toggle === "hide"',
          hideStrategy: 'keep',
          valueStrategy: 'default',
          controls: {
            name: { type: 'text', label: 'Name', defaultValue: 'default-name' },
            email: {
              type: 'text',
              label: 'Email',
              defaultValue: 'default-email',
            },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('contacts-add'));
    const name = await canvas.findByRole('textbox', { name: 'Name' });
    const email = await canvas.findByRole('textbox', { name: 'Email' });
    await userEvent.clear(name);
    await userEvent.type(name, 'Ada');
    await userEvent.clear(email);
    await userEvent.type(email, 'ada@example.com');

    const toggle = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide rows',
    });
    await userEvent.type(toggle, 'hide');

    await expect(
      canvas.queryByRole('textbox', { name: 'Name' }),
    ).not.toBeInTheDocument();
    await expect(getFormValue()['contacts']).toEqual([
      { name: 'default-name', email: 'default-email' },
    ]);

    await userEvent.clear(toggle);
    await expect(
      await canvas.findByRole('textbox', { name: 'Name' }),
    ).toHaveValue('default-name');
    await expect(
      await canvas.findByRole('textbox', { name: 'Email' }),
    ).toHaveValue('default-email');
  },
};

// ---------------------------------------------------------------------------
// Group row top: valueStrategy last (keep)
// ---------------------------------------------------------------------------

export const RowGroupTopValueStrategyLast: Story = {
  name: 'Row Group Top Value Strategy — Last',
  parameters: {
    docs: {
      description: {
        story:
          'A group row top with valueStrategy last keeps each child value when hidden (hideStrategy keep), exactly as a regular group does; values return unchanged on show.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      toggle: {
        type: 'text',
        label: 'Type "hide" to hide rows',
      },
      contacts: {
        type: 'array',
        label: 'Contacts',
        rowControl: {
          type: 'group',
          hidden: 'toggle === "hide"',
          hideStrategy: 'keep',
          valueStrategy: 'last',
          controls: {
            name: { type: 'text', label: 'Name' },
            email: { type: 'text', label: 'Email' },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('contacts-add'));
    const name = await canvas.findByRole('textbox', { name: 'Name' });
    const email = await canvas.findByRole('textbox', { name: 'Email' });
    await userEvent.type(name, 'Ada');
    await userEvent.type(email, 'ada@example.com');

    const toggle = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide rows',
    });
    await userEvent.type(toggle, 'hide');

    await expect(
      canvas.queryByRole('textbox', { name: 'Name' }),
    ).not.toBeInTheDocument();
    await expect(getFormValue()['contacts']).toEqual([
      { name: 'Ada', email: 'ada@example.com' },
    ]);

    await userEvent.clear(toggle);
    await expect(
      await canvas.findByRole('textbox', { name: 'Name' }),
    ).toHaveValue('Ada');
    await expect(
      await canvas.findByRole('textbox', { name: 'Email' }),
    ).toHaveValue('ada@example.com');
  },
};

// ---------------------------------------------------------------------------
// Group row top: group-level cross-field validator
// ---------------------------------------------------------------------------

export const RowGroupTopGroupValidator: Story = {
  name: 'Row Group Top Group Validator',
  parameters: {
    docs: {
      description: {
        story:
          'A group row top with a group-level cross-field validator (no duplicate values) shows its error when its children share a value and clears once they differ.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      contacts: {
        type: 'array',
        label: 'Contacts',
        rowControl: {
          type: 'group',
          validators: ['no-duplicates'],
          controls: {
            name: { type: 'text', label: 'Name' },
            email: { type: 'text', label: 'Email' },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('contacts-add'));
    const name = await canvas.findByRole('textbox', { name: 'Name' });
    const email = await canvas.findByRole('textbox', { name: 'Email' });

    await userEvent.type(name, 'same');
    await userEvent.type(email, 'same');
    await expect(
      await canvas.findByText('No duplicate values allowed'),
    ).toBeInTheDocument();

    await userEvent.clear(email);
    await userEvent.type(email, 'different');
    await expect(
      canvas.queryByText('No duplicate values allowed'),
    ).not.toBeInTheDocument();
  },
};

// ---------------------------------------------------------------------------
// Group row top inherits updateOn blur from the array
// ---------------------------------------------------------------------------

export const RowGroupTopUpdateOnBlurInheritance: Story = {
  name: 'Row Group Top Inherits Update On — Blur',
  parameters: {
    docs: {
      description: {
        story:
          'When the array sets updateOn blur and its row is a group, the group children commit to the model only on blur, not per keystroke. The array updateOn propagates through the group row to its children.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      contacts: {
        type: 'array',
        label: 'Contacts',
        updateOn: 'blur',
        rowControl: {
          type: 'group',
          controls: {
            name: { type: 'text', label: 'Name' },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('contacts-add'));
    const input = await canvas.findByRole('textbox', { name: 'Name' });

    await userEvent.type(input, 'Ada');
    await expect(input).toHaveValue('Ada');
    await expect(getFormValue()['contacts']).not.toEqual([{ name: 'Ada' }]);

    await userEvent.tab();
    await expect(getFormValue()['contacts']).toEqual([{ name: 'Ada' }]);
  },
};

// ---------------------------------------------------------------------------
// Group row container exposes its own data-testid
// ---------------------------------------------------------------------------

export const RowGroupTopTestId: Story = {
  name: 'Row Group Top TestId',
  parameters: {
    docs: {
      description: {
        story:
          'A group row container exposes its own composed data-testid (`<key>-<index>`) alongside its child testids.',
      },
    },
  },
  args: {
    autoUpdate: true,
    formConfig: formConfig({
      contacts: {
        type: 'array',
        label: 'Contacts',
        rowControl: {
          type: 'group',
          controls: {
            name: { type: 'text', label: 'Name' },
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByTestId('contacts-add'));
    await expect(await canvas.findByTestId('contacts-0')).toBeInTheDocument();
    await expect(
      await canvas.findByTestId('contacts-0-name-input'),
    ).toBeInTheDocument();
  },
};
