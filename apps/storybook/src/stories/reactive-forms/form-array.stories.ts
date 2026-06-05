import type { Meta, StoryObj } from '@storybook/angular';
import { expect, waitFor } from 'storybook/test';
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
