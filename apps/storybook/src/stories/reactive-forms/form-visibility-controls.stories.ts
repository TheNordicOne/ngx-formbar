import type { Meta, StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import { StoryFormHostComponent } from './story-form-host.component';
import { formConfig } from './story-helpers';

const meta: Meta<StoryFormHostComponent> = {
  title: 'Reactive Forms/Visibility Strategies/Controls',
  component: StoryFormHostComponent,
};

export default meta;
type Story = StoryObj<StoryFormHostComponent>;

function getFormValue(): Record<string, unknown> {
  return StoryFormHostComponent.lastInstance!.form.getRawValue();
}

// ---------------------------------------------------------------------------
// Keep
// ---------------------------------------------------------------------------

export const ControlKeepLast: Story = {
  name: 'Keep & Last',
  parameters: {
    docs: {
      description: {
        story:
          'Keep strategy with last value — control is removed from the DOM when hidden, but its value is preserved in the form model.',
      },
    },
  },
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      keepLastField: {
        type: 'text',
        label: 'Keep and use last value',
        defaultValue: 'default-value',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'keep',
        valueStrategy: 'last',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const customValue = 'Custom keep & last value';

    const targetInput = await canvas.findByRole('textbox', {
      name: 'Keep and use last value',
    });
    await userEvent.clear(targetInput);
    await userEvent.type(targetInput, customValue);

    const triggerInput = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide everything',
    });
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // DOM gone (auto visibility detaches/destroys the host view)
    await expect(
      canvas.queryByRole('textbox', { name: 'Keep and use last value' }),
    ).not.toBeInTheDocument();

    // Form model still holds the last-typed value (keep + last)
    await expect(getFormValue()['keepLastField']).toBe(customValue);

    // Re-show — input reappears with the same value
    await userEvent.clear(triggerInput);
    await expect(
      await canvas.findByRole('textbox', { name: 'Keep and use last value' }),
    ).toHaveValue(customValue);
  },
};

export const ControlKeepDefault: Story = {
  name: 'Keep & Default',
  parameters: {
    docs: {
      description: {
        story: 'Keep strategy with default — reverts to default when hidden.',
      },
    },
  },
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      keepDefaultField: {
        type: 'text',
        label: 'Keep but use default value',
        defaultValue: 'default-keep-default',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'keep',
        valueStrategy: 'default',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const customValue = 'Custom keep & default value';
    const defaultValue = 'default-keep-default';

    const targetInput = await canvas.findByRole('textbox', {
      name: 'Keep but use default value',
    });
    await userEvent.clear(targetInput);
    await userEvent.type(targetInput, customValue);

    const triggerInput = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide everything',
    });
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // DOM gone
    await expect(
      canvas.queryByRole('textbox', { name: 'Keep but use default value' }),
    ).not.toBeInTheDocument();

    // Form model holds the defaultValue (keep + default applies setValue(defaultValue) on hide)
    await expect(getFormValue()['keepDefaultField']).toBe(defaultValue);

    // Re-show — input shows the defaultValue
    await userEvent.clear(triggerInput);
    await expect(
      await canvas.findByRole('textbox', {
        name: 'Keep but use default value',
      }),
    ).toHaveValue(defaultValue);
  },
};

export const ControlKeepReset: Story = {
  name: 'Keep & Reset',
  parameters: {
    docs: {
      description: {
        story: 'Keep strategy with reset — clears to null when hidden.',
      },
    },
  },
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      keepResetField: {
        type: 'text',
        label: 'Keep but reset value',
        defaultValue: 'default-keep-reset',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'keep',
        valueStrategy: 'reset',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const customValue = 'Custom keep & reset value';

    const targetInput = await canvas.findByRole('textbox', {
      name: 'Keep but reset value',
    });
    await userEvent.clear(targetInput);
    await userEvent.type(targetInput, customValue);

    const triggerInput = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide everything',
    });
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // DOM gone
    await expect(
      canvas.queryByRole('textbox', { name: 'Keep but reset value' }),
    ).not.toBeInTheDocument();

    // Form model holds null (keep + reset)
    await expect(getFormValue()['keepResetField']).toBeNull();

    // Re-show — input is empty
    await userEvent.clear(triggerInput);
    await expect(
      await canvas.findByRole('textbox', { name: 'Keep but reset value' }),
    ).toHaveValue('');
  },
};

// ---------------------------------------------------------------------------
// Remove
// ---------------------------------------------------------------------------

export const ControlRemoveLast: Story = {
  name: 'Remove & Last',
  parameters: {
    docs: {
      description: {
        story:
          'Remove strategy with last value — control removed from DOM and model, restored on show.',
      },
    },
  },
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      removeLastField: {
        type: 'text',
        label: 'Remove but remember last value',
        defaultValue: 'default-value',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'remove',
        valueStrategy: 'last',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const customValue = 'Custom remove & last value';

    const targetInput = await canvas.findByRole('textbox', {
      name: 'Remove but remember last value',
    });
    await userEvent.clear(targetInput);
    await userEvent.type(targetInput, customValue);

    const triggerInput = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide everything',
    });
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // DOM gone
    await expect(
      canvas.queryByRole('textbox', {
        name: 'Remove but remember last value',
      }),
    ).not.toBeInTheDocument();

    // Form model has the key removed (remove)
    await expect(getFormValue()['removeLastField']).toBeUndefined();

    // Re-show — cached value restored (last)
    await userEvent.clear(triggerInput);
    await expect(
      await canvas.findByRole('textbox', {
        name: 'Remove but remember last value',
      }),
    ).toHaveValue(customValue);
  },
};

export const ControlRemoveDefault: Story = {
  name: 'Remove & Default',
  parameters: {
    docs: {
      description: {
        story:
          'Remove strategy with default — reverts to default value on show.',
      },
    },
  },
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      removeDefaultField: {
        type: 'text',
        label: 'Remove but use default value',
        defaultValue: 'default-remove-default',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'remove',
        valueStrategy: 'default',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const customValue = 'Custom remove & default value';
    const defaultValue = 'default-remove-default';

    const targetInput = await canvas.findByRole('textbox', {
      name: 'Remove but use default value',
    });
    await userEvent.clear(targetInput);
    await userEvent.type(targetInput, customValue);

    const triggerInput = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide everything',
    });
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // DOM gone
    await expect(
      canvas.queryByRole('textbox', { name: 'Remove but use default value' }),
    ).not.toBeInTheDocument();

    // Form model has the key removed
    await expect(getFormValue()['removeDefaultField']).toBeUndefined();

    // Re-show — input shows defaultValue
    await userEvent.clear(triggerInput);
    await expect(
      await canvas.findByRole('textbox', {
        name: 'Remove but use default value',
      }),
    ).toHaveValue(defaultValue);
  },
};

export const ControlRemoveReset: Story = {
  name: 'Remove & Reset',
  parameters: {
    docs: {
      description: {
        story: 'Remove strategy with reset — clears to null on show.',
      },
    },
  },
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      removeResetField: {
        type: 'text',
        label: 'Remove and reset value',
        defaultValue: 'default-remove-reset',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'remove',
        valueStrategy: 'reset',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const customValue = 'Custom remove & reset value';

    const targetInput = await canvas.findByRole('textbox', {
      name: 'Remove and reset value',
    });
    await userEvent.clear(targetInput);
    await userEvent.type(targetInput, customValue);

    const triggerInput = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide everything',
    });
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // DOM gone
    await expect(
      canvas.queryByRole('textbox', { name: 'Remove and reset value' }),
    ).not.toBeInTheDocument();

    // Form model has the key removed
    await expect(getFormValue()['removeResetField']).toBeUndefined();

    // Re-show — input is empty (reset)
    await userEvent.clear(triggerInput);
    await expect(
      await canvas.findByRole('textbox', { name: 'Remove and reset value' }),
    ).toHaveValue('');
  },
};

export const ControlRemoveLastResetClearsCache: Story = {
  name: 'Remove & Last — Reset clears cache',
  parameters: {
    docs: {
      description: {
        story:
          'When the form is reset while a control is hidden, the cached "last" value should be discarded. The control should show its default value on re-show, not the stale cached value.',
      },
    },
  },
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      cachedField: {
        type: 'text',
        label: 'Cached field',
        defaultValue: 'default-cached',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'remove',
        valueStrategy: 'last',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const defaultValue = 'default-cached';

    for (const customValue of ['First', 'Second', 'Third']) {
      const targetInput = await canvas.findByRole('textbox', {
        name: 'Cached field',
      });
      await userEvent.clear(targetInput);
      await userEvent.type(targetInput, customValue);

      const triggerInput = await canvas.findByRole('textbox', {
        name: 'Type "hide" to hide everything',
      });
      await userEvent.clear(triggerInput);
      await userEvent.type(triggerInput, 'hide');

      await expect(
        canvas.queryByRole('textbox', { name: 'Cached field' }),
      ).not.toBeInTheDocument();

      // Reset while hidden — cache must be cleared
      await userEvent.click(
        await canvas.findByRole('button', { name: 'Reset' }),
      );

      // Re-show — input reappears with defaultValue, NOT the stale cached value
      await expect(
        await canvas.findByRole('textbox', { name: 'Cached field' }),
      ).toHaveValue(defaultValue);
    }
  },
};

// ---------------------------------------------------------------------------
// Manual visibility handling
// ---------------------------------------------------------------------------

export const ManualKeep: Story = {
  name: 'Manual — Keep & Last',
  parameters: {
    docs: {
      description: {
        story:
          'Manual visibility = DOM-only opt-out. The component decides DOM presence via @if, but the library still applies hideStrategy and valueStrategy. With keep + last the form value stays as last typed and the input shows it again on re-show. The always-rendered marker proves the component instance survives the hide/show cycle.',
      },
    },
  },
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      manualKeepField: {
        type: 'manual-text',
        label: 'Manual keep field',
        defaultValue: 'default-manual-keep',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'keep',
        valueStrategy: 'last',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const customValue = 'Custom manual value';

    const targetInput = await canvas.findByRole('textbox', {
      name: 'Manual keep field',
    });
    await userEvent.clear(targetInput);
    await userEvent.type(targetInput, customValue);

    const triggerInput = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide everything',
    });
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    // Input gone (component's @if), but the always-rendered marker proves the component is still alive
    await expect(
      canvas.queryByRole('textbox', { name: 'Manual keep field' }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByTestId('manualKeepField-marker'),
    ).toBeInTheDocument();

    // keep + last
    await expect(getFormValue()['manualKeepField']).toBe(customValue);

    // Re-show
    await userEvent.clear(triggerInput);
    await expect(
      await canvas.findByRole('textbox', { name: 'Manual keep field' }),
    ).toHaveValue(customValue);
  },
};

export const ManualKeepDefault: Story = {
  name: 'Manual — Keep & Default',
  parameters: {
    docs: {
      description: {
        story:
          'Manual visibility opts the component out of DOM management only. The library still applies valueStrategy: default on hide, so the form value becomes the defaultValue and the input shows it again on re-show. The marker proves the component survives the hide.',
      },
    },
  },
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      manualKeepDefaultField: {
        type: 'manual-text',
        label: 'Manual keep default field',
        defaultValue: 'default-manual',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'keep',
        valueStrategy: 'default',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const customValue = 'Custom manual default value';
    const defaultValue = 'default-manual';

    const targetInput = await canvas.findByRole('textbox', {
      name: 'Manual keep default field',
    });
    await userEvent.clear(targetInput);
    await userEvent.type(targetInput, customValue);

    const triggerInput = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide everything',
    });
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    await expect(
      canvas.queryByRole('textbox', { name: 'Manual keep default field' }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByTestId('manualKeepDefaultField-marker'),
    ).toBeInTheDocument();

    // keep + default
    await expect(getFormValue()['manualKeepDefaultField']).toBe(defaultValue);

    await userEvent.clear(triggerInput);
    await expect(
      await canvas.findByRole('textbox', { name: 'Manual keep default field' }),
    ).toHaveValue(defaultValue);
  },
};

export const ManualRemove: Story = {
  name: 'Manual — Remove & Last',
  parameters: {
    docs: {
      description: {
        story:
          'Manual visibility opts the component out of DOM management only. The library still applies hideStrategy: remove (form key is absent while hidden) and valueStrategy: last (cached value is restored on show). The marker proves the component survives the hide.',
      },
    },
  },
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      manualRemoveField: {
        type: 'manual-text',
        label: 'Manual remove field',
        defaultValue: 'default-manual-remove',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'remove',
        valueStrategy: 'last',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const customValue = 'Custom manual remove value';

    const targetInput = await canvas.findByRole('textbox', {
      name: 'Manual remove field',
    });
    await userEvent.clear(targetInput);
    await userEvent.type(targetInput, customValue);

    const triggerInput = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide everything',
    });
    await userEvent.clear(triggerInput);
    await userEvent.type(triggerInput, 'hide');

    await expect(
      canvas.queryByRole('textbox', { name: 'Manual remove field' }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByTestId('manualRemoveField-marker'),
    ).toBeInTheDocument();

    // remove
    await expect(getFormValue()['manualRemoveField']).toBeUndefined();

    // Re-show — last cached value restored
    await userEvent.clear(triggerInput);
    await expect(
      await canvas.findByRole('textbox', { name: 'Manual remove field' }),
    ).toHaveValue(customValue);
  },
};

// ---------------------------------------------------------------------------
// Stress
// ---------------------------------------------------------------------------

export const ToggleStorm: Story = {
  name: 'Toggle Storm',
  parameters: {
    docs: {
      description: {
        story:
          'Rapidly flip the trigger between hide and show several times. Only the final observable state is asserted — both controls must end in a state consistent with the final trigger value, regardless of intermediate flips. Catches race conditions in the hide/show pipeline.',
      },
    },
  },
  args: {
    formConfig: formConfig({
      hideControl: {
        type: 'text',
        label: 'Type "hide" to hide everything',
      },
      keepField: {
        type: 'text',
        label: 'Storm keep field',
        defaultValue: 'default-storm-keep',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'keep',
        valueStrategy: 'last',
      },
      removeField: {
        type: 'text',
        label: 'Storm remove field',
        defaultValue: 'default-storm-remove',
        hidden: 'hideControl === "hide"',
        hideStrategy: 'remove',
        valueStrategy: 'last',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const keepInput = await canvas.findByRole('textbox', {
      name: 'Storm keep field',
    });
    const removeInput = await canvas.findByRole('textbox', {
      name: 'Storm remove field',
    });
    await userEvent.clear(keepInput);
    await userEvent.type(keepInput, 'keep typed');
    await userEvent.clear(removeInput);
    await userEvent.type(removeInput, 'remove typed');

    const triggerInput = await canvas.findByRole('textbox', {
      name: 'Type "hide" to hide everything',
    });

    // Storm: hide → show → hide → show → hide. Final state is hidden.
    for (let i = 0; i < 3; i++) {
      await userEvent.clear(triggerInput);
      await userEvent.type(triggerInput, 'hide');
      await userEvent.clear(triggerInput);
    }
    await userEvent.type(triggerInput, 'hide');

    // Final state — both gone from DOM
    await expect(
      canvas.queryByRole('textbox', { name: 'Storm keep field' }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole('textbox', { name: 'Storm remove field' }),
    ).not.toBeInTheDocument();

    // Form model reflects the final hideStrategy of each control
    await expect(getFormValue()['keepField']).toBe('keep typed');
    await expect(getFormValue()['removeField']).toBeUndefined();

    // Storm back to visible: show → hide → show → hide → show. Final state is visible.
    for (let i = 0; i < 3; i++) {
      await userEvent.clear(triggerInput);
      await userEvent.type(triggerInput, 'hide');
    }
    await userEvent.clear(triggerInput);

    await expect(
      await canvas.findByRole('textbox', { name: 'Storm keep field' }),
    ).toHaveValue('keep typed');
    await expect(
      await canvas.findByRole('textbox', { name: 'Storm remove field' }),
    ).toHaveValue('remove typed');
  },
};
