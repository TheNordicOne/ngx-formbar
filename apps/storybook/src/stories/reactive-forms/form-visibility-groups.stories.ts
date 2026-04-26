import type { Meta, StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { StoryFormHostComponent } from './story-form-host.component';
import { formConfig } from './story-helpers';

const meta: Meta<StoryFormHostComponent> = {
  title: 'Reactive Forms/Visibility Strategies/Groups',
  component: StoryFormHostComponent,
};

export default meta;
type Story = StoryObj<StoryFormHostComponent>;

function getFormValue(): Record<string, unknown> {
  return StoryFormHostComponent.lastInstance!.form.getRawValue();
}

function getFormPath(...path: string[]): unknown {
  let current: unknown = getFormValue();
  for (const key of path) {
    if (typeof current !== 'object' || current === null) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

// ---------------------------------------------------------------------------
// Keep
// ---------------------------------------------------------------------------

export const GroupKeepLast: Story = {
  name: 'Keep & Last',
  parameters: {
    docs: {
      description: {
        story:
          'Keep parent — group is removed from the DOM but kept in the form model. Each leaf applies its own (or inherited) valueStrategy.',
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

    await userEvent.clear(
      await canvas.findByRole('textbox', { name: 'Child field' }),
    );
    await userEvent.type(
      await canvas.findByRole('textbox', { name: 'Child field' }),
      'Custom child value',
    );
    await userEvent.clear(
      await canvas.findByRole('textbox', {
        name: 'Child with default strategy',
      }),
    );
    await userEvent.type(
      await canvas.findByRole('textbox', {
        name: 'Child with default strategy',
      }),
      'Custom child default value',
    );
    await userEvent.clear(
      await canvas.findByRole('textbox', { name: 'Child with reset strategy' }),
    );
    await userEvent.type(
      await canvas.findByRole('textbox', { name: 'Child with reset strategy' }),
      'Custom child reset value',
    );

    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Group's DOM is gone
    await expect(
      canvas.queryByText('Keep and use last value'),
    ).not.toBeInTheDocument();

    // Group is still in the form model (keep), each leaf reflects its strategy
    await expect(getFormPath('keepLastGroup', 'childField')).toBe(
      'Custom child value',
    );
    await expect(getFormPath('keepLastGroup', 'childDefaultField')).toBe(
      'default-child-default',
    );
    await expect(getFormPath('keepLastGroup', 'childResetField')).toBeNull();

    // Re-show — values are unchanged
    await userEvent.clear(triggerInput);
    await expect(
      await canvas.findByRole('textbox', { name: 'Child field' }),
    ).toHaveValue('Custom child value');
    await expect(
      await canvas.findByRole('textbox', {
        name: 'Child with default strategy',
      }),
    ).toHaveValue('default-child-default');
    await expect(
      await canvas.findByRole('textbox', { name: 'Child with reset strategy' }),
    ).toHaveValue('');
  },
};

export const GroupKeepDefault: Story = {
  name: 'Keep & Default',
  parameters: {
    docs: {
      description: {
        story:
          'Keep parent with default — children that inherit revert to defaultValue, child overrides take effect.',
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

    await userEvent.clear(
      await canvas.findByRole('textbox', { name: 'Child field' }),
    );
    await userEvent.type(
      await canvas.findByRole('textbox', { name: 'Child field' }),
      'Custom child value',
    );
    await userEvent.clear(
      await canvas.findByRole('textbox', { name: 'Child with last strategy' }),
    );
    await userEvent.type(
      await canvas.findByRole('textbox', { name: 'Child with last strategy' }),
      'Custom child last value',
    );
    await userEvent.clear(
      await canvas.findByRole('textbox', { name: 'Child with reset strategy' }),
    );
    await userEvent.type(
      await canvas.findByRole('textbox', { name: 'Child with reset strategy' }),
      'Custom child reset value',
    );

    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    await expect(
      canvas.queryByText('Keep but use default value'),
    ).not.toBeInTheDocument();

    await expect(getFormPath('keepDefaultGroup', 'childField')).toBe(
      'default-child',
    );
    await expect(getFormPath('keepDefaultGroup', 'childLastField')).toBe(
      'Custom child last value',
    );
    await expect(getFormPath('keepDefaultGroup', 'childResetField')).toBeNull();

    await userEvent.clear(triggerInput);
    await expect(
      await canvas.findByRole('textbox', { name: 'Child field' }),
    ).toHaveValue('default-child');
    await expect(
      await canvas.findByRole('textbox', { name: 'Child with last strategy' }),
    ).toHaveValue('Custom child last value');
    await expect(
      await canvas.findByRole('textbox', { name: 'Child with reset strategy' }),
    ).toHaveValue('');
  },
};

export const GroupKeepReset: Story = {
  name: 'Keep & Reset',
  parameters: {
    docs: {
      description: {
        story:
          'Keep parent with reset — children that inherit clear to null, child overrides take effect.',
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

    await userEvent.clear(
      await canvas.findByRole('textbox', { name: 'Child field' }),
    );
    await userEvent.type(
      await canvas.findByRole('textbox', { name: 'Child field' }),
      'Custom child value',
    );
    await userEvent.clear(
      await canvas.findByRole('textbox', { name: 'Child with last strategy' }),
    );
    await userEvent.type(
      await canvas.findByRole('textbox', { name: 'Child with last strategy' }),
      'Custom child last value',
    );
    await userEvent.clear(
      await canvas.findByRole('textbox', {
        name: 'Child with default strategy',
      }),
    );
    await userEvent.type(
      await canvas.findByRole('textbox', {
        name: 'Child with default strategy',
      }),
      'Custom child default value',
    );

    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    await expect(
      canvas.queryByText('Keep but reset value'),
    ).not.toBeInTheDocument();

    await expect(getFormPath('keepResetGroup', 'childField')).toBeNull();
    await expect(getFormPath('keepResetGroup', 'childLastField')).toBe(
      'Custom child last value',
    );
    await expect(getFormPath('keepResetGroup', 'childDefaultField')).toBe(
      'default-child-default',
    );

    await userEvent.clear(triggerInput);
    await expect(
      await canvas.findByRole('textbox', { name: 'Child field' }),
    ).toHaveValue('');
    await expect(
      await canvas.findByRole('textbox', { name: 'Child with last strategy' }),
    ).toHaveValue('Custom child last value');
    await expect(
      await canvas.findByRole('textbox', {
        name: 'Child with default strategy',
      }),
    ).toHaveValue('default-child-default');
  },
};

// ---------------------------------------------------------------------------
// Remove
// ---------------------------------------------------------------------------

export const GroupRemoveLast: Story = {
  name: 'Remove & Last',
  parameters: {
    docs: {
      description: {
        story:
          'Remove parent — group is gone from both DOM and form model while hidden, leaves restore on show per their strategies.',
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

    await userEvent.clear(
      await canvas.findByRole('textbox', { name: 'Child field' }),
    );
    await userEvent.type(
      await canvas.findByRole('textbox', { name: 'Child field' }),
      'Custom child value',
    );
    await userEvent.clear(
      await canvas.findByRole('textbox', {
        name: 'Child with default strategy',
      }),
    );
    await userEvent.type(
      await canvas.findByRole('textbox', {
        name: 'Child with default strategy',
      }),
      'Custom child default value',
    );
    await userEvent.clear(
      await canvas.findByRole('textbox', { name: 'Child with reset strategy' }),
    );
    await userEvent.type(
      await canvas.findByRole('textbox', { name: 'Child with reset strategy' }),
      'Custom child reset value',
    );

    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Group's DOM is gone
    await expect(
      canvas.queryByText('Remove but remember last value'),
    ).not.toBeInTheDocument();

    // Group is gone from the form model
    await expect(getFormValue()['removeLastGroup']).toBeUndefined();

    // Re-show — leaves apply their strategies
    await userEvent.clear(triggerInput);
    await expect(
      await canvas.findByRole('textbox', { name: 'Child field' }),
    ).toHaveValue('Custom child value');
    await expect(
      await canvas.findByRole('textbox', {
        name: 'Child with default strategy',
      }),
    ).toHaveValue('default-child-default');
    await expect(
      await canvas.findByRole('textbox', { name: 'Child with reset strategy' }),
    ).toHaveValue('');
  },
};

export const GroupRemoveDefault: Story = {
  name: 'Remove & Default',
  parameters: {
    docs: {
      description: {
        story:
          'Remove parent with default — leaves render their (inherited or own) strategy on re-show.',
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

    await userEvent.clear(
      await canvas.findByRole('textbox', { name: 'Child field' }),
    );
    await userEvent.type(
      await canvas.findByRole('textbox', { name: 'Child field' }),
      'Custom child value',
    );
    await userEvent.clear(
      await canvas.findByRole('textbox', { name: 'Child with last strategy' }),
    );
    await userEvent.type(
      await canvas.findByRole('textbox', { name: 'Child with last strategy' }),
      'Custom child last value',
    );
    await userEvent.clear(
      await canvas.findByRole('textbox', { name: 'Child with reset strategy' }),
    );
    await userEvent.type(
      await canvas.findByRole('textbox', { name: 'Child with reset strategy' }),
      'Custom child reset value',
    );

    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    await expect(
      canvas.queryByText('Remove but use default value'),
    ).not.toBeInTheDocument();
    await expect(getFormValue()['removeDefaultGroup']).toBeUndefined();

    await userEvent.clear(triggerInput);
    await expect(
      await canvas.findByRole('textbox', { name: 'Child field' }),
    ).toHaveValue('default-child');
    await expect(
      await canvas.findByRole('textbox', { name: 'Child with last strategy' }),
    ).toHaveValue('Custom child last value');
    await expect(
      await canvas.findByRole('textbox', { name: 'Child with reset strategy' }),
    ).toHaveValue('');
  },
};

export const GroupRemoveReset: Story = {
  name: 'Remove & Reset',
  parameters: {
    docs: {
      description: {
        story:
          'Remove parent with reset — leaves render their (inherited or own) strategy on re-show.',
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

    await userEvent.clear(
      await canvas.findByRole('textbox', { name: 'Child field' }),
    );
    await userEvent.type(
      await canvas.findByRole('textbox', { name: 'Child field' }),
      'Custom child value',
    );
    await userEvent.clear(
      await canvas.findByRole('textbox', { name: 'Child with last strategy' }),
    );
    await userEvent.type(
      await canvas.findByRole('textbox', { name: 'Child with last strategy' }),
      'Custom child last value',
    );
    await userEvent.clear(
      await canvas.findByRole('textbox', {
        name: 'Child with default strategy',
      }),
    );
    await userEvent.type(
      await canvas.findByRole('textbox', {
        name: 'Child with default strategy',
      }),
      'Custom child default value',
    );

    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    await expect(
      canvas.queryByText('Remove and reset value'),
    ).not.toBeInTheDocument();
    await expect(getFormValue()['removeResetGroup']).toBeUndefined();

    await userEvent.clear(triggerInput);
    await expect(
      await canvas.findByRole('textbox', { name: 'Child field' }),
    ).toHaveValue('');
    await expect(
      await canvas.findByRole('textbox', { name: 'Child with last strategy' }),
    ).toHaveValue('Custom child last value');
    await expect(
      await canvas.findByRole('textbox', {
        name: 'Child with default strategy',
      }),
    ).toHaveValue('default-child-default');
  },
};

export const GroupRemoveLastResetClearsCache: Story = {
  name: 'Remove & Last — Reset clears cache',
  parameters: {
    docs: {
      description: {
        story:
          'When form.reset() runs while a remove-hidden group is gone, the cached "last" values for its leaves are discarded. On re-show, leaves render their defaultValue.',
      },
    },
  },
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      cachedGroup: {
        type: 'group',
        legend: 'Cached group',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'remove',
        valueStrategy: 'last',

        controls: {
          childA: {
            type: 'text',
            label: 'Cached child A',
            defaultValue: 'default-a',
          },
          childB: {
            type: 'text',
            label: 'Cached child B',
            defaultValue: 'default-b',
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    for (const round of ['First', 'Second']) {
      const childA = await canvas.findByRole('textbox', {
        name: 'Cached child A',
      });
      const childB = await canvas.findByRole('textbox', {
        name: 'Cached child B',
      });

      await userEvent.clear(childA);
      await userEvent.type(childA, `${round} A`);
      await userEvent.clear(childB);
      await userEvent.type(childB, `${round} B`);

      const triggerInput = await canvas.findByRole('textbox', {
        name: 'Type "hide" to hide everything',
      });
      await userEvent.clear(triggerInput);
      await userEvent.type(triggerInput, 'hide');

      await expect(
        canvas.queryByText('Cached group'),
      ).not.toBeInTheDocument();

      await userEvent.click(
        await canvas.findByRole('button', { name: 'Reset' }),
      );

      // Re-show — leaves render their defaults, NOT the stale cached values
      await expect(
        await canvas.findByRole('textbox', { name: 'Cached child A' }),
      ).toHaveValue('default-a');
      await expect(
        await canvas.findByRole('textbox', { name: 'Cached child B' }),
      ).toHaveValue('default-b');
    }
  },
};

// ---------------------------------------------------------------------------
// Composition
// ---------------------------------------------------------------------------

export const ParentRemovePrecedence: Story = {
  name: 'Parent Remove Precedence',
  parameters: {
    docs: {
      description: {
        story:
          'Parent remove takes precedence — a keep child inside a remove parent is gone with the parent regardless of its own strategy.',
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

    await userEvent.clear(
      await canvas.findByRole('textbox', { name: 'Parent field' }),
    );
    await userEvent.type(
      await canvas.findByRole('textbox', { name: 'Parent field' }),
      'Custom parent value',
    );
    await userEvent.clear(
      await canvas.findByRole('textbox', { name: 'Child field' }),
    );
    await userEvent.type(
      await canvas.findByRole('textbox', { name: 'Child field' }),
      'Custom child value',
    );

    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Whole subtree gone from DOM
    await expect(
      canvas.queryByText('Parent with Remove Strategy'),
    ).not.toBeInTheDocument();
    // Whole subtree gone from form model
    await expect(getFormValue()['parentRemove']).toBeUndefined();

    // Re-show — last values restored
    await userEvent.clear(triggerInput);
    await expect(
      await canvas.findByRole('textbox', { name: 'Parent field' }),
    ).toHaveValue('Custom parent value');
    await expect(
      await canvas.findByRole('textbox', { name: 'Child field' }),
    ).toHaveValue('Custom child value');
  },
};

export const InheritedStrategies: Story = {
  name: 'Inherited Strategies',
  parameters: {
    docs: {
      description: {
        story:
          "Child group with no own valueStrategy inherits the parent's keep + last semantics.",
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

    await userEvent.clear(
      await canvas.findByRole('textbox', { name: 'Parent field' }),
    );
    await userEvent.type(
      await canvas.findByRole('textbox', { name: 'Parent field' }),
      'Custom parent value',
    );
    await userEvent.clear(
      await canvas.findByRole('textbox', { name: 'Child field' }),
    );
    await userEvent.type(
      await canvas.findByRole('textbox', { name: 'Child field' }),
      'Custom child value',
    );

    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    await expect(
      canvas.queryByText('Parent Group - Keep & Last'),
    ).not.toBeInTheDocument();

    // Both leaves preserved (last)
    await expect(getFormPath('parentGroup', 'parentField')).toBe(
      'Custom parent value',
    );
    await expect(getFormPath('parentGroup', 'childGroup', 'childField')).toBe(
      'Custom child value',
    );

    await userEvent.clear(triggerInput);
    await expect(
      await canvas.findByRole('textbox', { name: 'Parent field' }),
    ).toHaveValue('Custom parent value');
    await expect(
      await canvas.findByRole('textbox', { name: 'Child field' }),
    ).toHaveValue('Custom child value');
  },
};

export const StrategyOverride: Story = {
  name: 'Strategy Override',
  parameters: {
    docs: {
      description: {
        story:
          "Child group declares its own valueStrategy and overrides the parent's.",
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

    await userEvent.clear(
      await canvas.findByRole('textbox', { name: 'Parent field' }),
    );
    await userEvent.type(
      await canvas.findByRole('textbox', { name: 'Parent field' }),
      'Custom parent value',
    );
    await userEvent.clear(
      await canvas.findByRole('textbox', { name: 'Child field' }),
    );
    await userEvent.type(
      await canvas.findByRole('textbox', { name: 'Child field' }),
      'Custom child value',
    );

    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    await expect(
      canvas.queryByText('Parent Group - Keep & Last'),
    ).not.toBeInTheDocument();

    // Parent leaf preserved (last); child leaf reverts (default — overridden by child group)
    await expect(getFormPath('parentGroup', 'parentField')).toBe(
      'Custom parent value',
    );
    await expect(getFormPath('parentGroup', 'childGroup', 'childField')).toBe(
      'default-child',
    );

    await userEvent.clear(triggerInput);
    await expect(
      await canvas.findByRole('textbox', { name: 'Parent field' }),
    ).toHaveValue('Custom parent value');
    await expect(
      await canvas.findByRole('textbox', { name: 'Child field' }),
    ).toHaveValue('default-child');
  },
};

export const ThreeLevelInheritance: Story = {
  name: 'Three-Level Inheritance',
  parameters: {
    docs: {
      description: {
        story:
          'Three-level hierarchy with strategy overrides at each level — each leaf resolves to the closest declared valueStrategy.',
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

    await userEvent.clear(
      await canvas.findByRole('textbox', { name: 'Grandparent field' }),
    );
    await userEvent.type(
      await canvas.findByRole('textbox', { name: 'Grandparent field' }),
      'Custom grandparent value',
    );
    await userEvent.clear(
      await canvas.findByRole('textbox', { name: 'Parent field' }),
    );
    await userEvent.type(
      await canvas.findByRole('textbox', { name: 'Parent field' }),
      'Custom parent value',
    );
    await userEvent.clear(
      await canvas.findByRole('textbox', { name: 'Child field' }),
    );
    await userEvent.type(
      await canvas.findByRole('textbox', { name: 'Child field' }),
      'Custom child value',
    );
    await userEvent.clear(
      await canvas.findByRole('textbox', { name: 'Child override field' }),
    );
    await userEvent.type(
      await canvas.findByRole('textbox', { name: 'Child override field' }),
      'Custom child override value',
    );

    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    await expect(
      canvas.queryByText('Grandparent Group - Keep & Default'),
    ).not.toBeInTheDocument();

    // grandparent's default applies to its direct leaf
    await expect(
      getFormPath('grandparentGroup', 'grandparentField'),
    ).toBe('default-grandparent');
    // parent overrides to last → parent's leaves preserve their typed values
    await expect(
      getFormPath('grandparentGroup', 'parentGroup', 'parentField'),
    ).toBe('Custom parent value');
    await expect(
      getFormPath(
        'grandparentGroup',
        'parentGroup',
        'childGroup',
        'childField',
      ),
    ).toBe('Custom child value');
    // childGroupWithOverride.reset wins for its leaf
    await expect(
      getFormPath(
        'grandparentGroup',
        'parentGroup',
        'childGroupWithOverride',
        'childOverrideField',
      ),
    ).toBeNull();

    await userEvent.clear(triggerInput);
    await expect(
      await canvas.findByRole('textbox', { name: 'Grandparent field' }),
    ).toHaveValue('default-grandparent');
    await expect(
      await canvas.findByRole('textbox', { name: 'Parent field' }),
    ).toHaveValue('Custom parent value');
    await expect(
      await canvas.findByRole('textbox', { name: 'Child field' }),
    ).toHaveValue('Custom child value');
    await expect(
      await canvas.findByRole('textbox', { name: 'Child override field' }),
    ).toHaveValue('');
  },
};

export const MixedChildStrategies: Story = {
  name: 'Mixed Child Strategies',
  parameters: {
    docs: {
      description: {
        story:
          'A keep parent contains two children with different hideStrategy values, each driven by its own hidden expression. Asserts hideStrategy is per-control (no inheritance) and the children flip independently of each other and of the parent.',
      },
    },
  },
  args: {
    formConfig: formConfig({
      toggleA: {
        type: 'text',
        label: 'Type "hide" to hide A',
      },
      toggleB: {
        type: 'text',
        label: 'Type "hide" to hide B',
      },
      parentVisible: {
        type: 'group',
        legend: 'Always-visible parent',
        hideStrategy: 'keep',
        valueStrategy: 'last',

        controls: {
          childKeep: {
            type: 'text',
            label: 'Child keep',
            defaultValue: 'default-keep',
            hidden: 'toggleA === "hide"',
            hideStrategy: 'keep',
            valueStrategy: 'last',
          },
          childRemove: {
            type: 'text',
            label: 'Child remove',
            defaultValue: 'default-remove',
            hidden: 'toggleB === "hide"',
            hideStrategy: 'remove',
            valueStrategy: 'last',
          },
        },
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const toggleA = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide A',
    });
    const toggleB = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide B',
    });

    await userEvent.clear(
      await canvas.findByRole('textbox', { name: 'Child keep' }),
    );
    await userEvent.type(
      await canvas.findByRole('textbox', { name: 'Child keep' }),
      'keep value',
    );
    await userEvent.clear(
      await canvas.findByRole('textbox', { name: 'Child remove' }),
    );
    await userEvent.type(
      await canvas.findByRole('textbox', { name: 'Child remove' }),
      'remove value',
    );

    // Hide only the keep child — remove child untouched
    await userEvent.type(toggleA, 'hide');

    await expect(
      canvas.queryByRole('textbox', { name: 'Child keep' }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByRole('textbox', { name: 'Child remove' }),
    ).toBeInTheDocument();

    // childKeep stays in the form model with its last-typed value
    await expect(getFormPath('parentVisible', 'childKeep')).toBe('keep value');
    // childRemove unaffected
    await expect(getFormPath('parentVisible', 'childRemove')).toBe(
      'remove value',
    );

    // Now also hide the remove child
    await userEvent.type(toggleB, 'hide');

    await expect(
      canvas.queryByRole('textbox', { name: 'Child remove' }),
    ).not.toBeInTheDocument();

    await expect(getFormPath('parentVisible', 'childKeep')).toBe('keep value');
    await expect(getFormPath('parentVisible', 'childRemove')).toBeUndefined();

    // Show only the remove child — childKeep stays hidden
    await userEvent.clear(toggleB);
    await expect(
      canvas.queryByRole('textbox', { name: 'Child keep' }),
    ).not.toBeInTheDocument();
    await expect(
      await canvas.findByRole('textbox', { name: 'Child remove' }),
    ).toHaveValue('remove value');

    // Show the keep child too
    await userEvent.clear(toggleA);
    await expect(
      await canvas.findByRole('textbox', { name: 'Child keep' }),
    ).toHaveValue('keep value');
  },
};
