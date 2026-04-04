import type { Meta, StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import type { FormContext } from '@ngx-formbar/core';
import { StoryFormHostComponent } from './story-form-host.component';
import { formConfig } from './story-helpers';

const meta: Meta<StoryFormHostComponent> = {
  title: 'Reactive Forms/Disabled Expressions',
  component: StoryFormHostComponent,
};

export default meta;
type Story = StoryObj<StoryFormHostComponent>;

// ---------------------------------------------------------------------------
// Static Disabled
// ---------------------------------------------------------------------------

export const StaticDisabled: Story = {
  parameters: {
    docs: { description: { story: 'Static disabled: true disables controls and inherits through groups.' } },
  },
  args: {
    formConfig: formConfig({
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
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('textbox', { name: 'First' })).toBeDisabled();
    await expect(await canvas.findByRole('textbox', { name: 'Grouped First label' })).toBeDisabled();
    await expect(await canvas.findByRole('textbox', { name: 'Nested Second label' })).toBeDisabled();
  },
};

// ---------------------------------------------------------------------------
// Conditional Disabled
// ---------------------------------------------------------------------------

export const ConditionalDisabled: Story = {
  parameters: {
    docs: { description: { story: 'Conditional expression toggles disabled state reactively.' } },
  },
  args: {
    formConfig: formConfig({
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
  },
  play: async ({ canvas, userEvent }) => {
    // Initially not disabled
    await expect(await canvas.findByRole('textbox', { name: 'First' })).not.toBeDisabled();
    await expect(await canvas.findByRole('textbox', { name: 'Grouped First label' })).not.toBeDisabled();
    await expect(await canvas.findByRole('textbox', { name: 'Nested Second label' })).not.toBeDisabled();

    // Type "disable" to trigger the expression
    const disableControl = await canvas.findByRole('textbox', { name: 'Type "disable" to disable everything' });
    await userEvent.clear(disableControl);
    await userEvent.type(disableControl, 'disable');

    await expect(await canvas.findByRole('textbox', { name: 'First' })).toBeDisabled();
    await expect(await canvas.findByRole('textbox', { name: 'Grouped First label' })).toBeDisabled();
    await expect(await canvas.findByRole('textbox', { name: 'Nested Second label' })).toBeDisabled();

    // Clear the trigger to re-enable
    await userEvent.clear(disableControl);
    await userEvent.type(disableControl, 'something else');

    await expect(await canvas.findByRole('textbox', { name: 'First' })).not.toBeDisabled();
    await expect(await canvas.findByRole('textbox', { name: 'Grouped First label' })).not.toBeDisabled();
    await expect(await canvas.findByRole('textbox', { name: 'Nested Second label' })).not.toBeDisabled();
  },
};

// ---------------------------------------------------------------------------
// Group Disabled With Override
// ---------------------------------------------------------------------------

export const GroupDisabledWithOverride: Story = {
  parameters: {
    docs: { description: { story: 'Group disabled with individual controls overriding to enabled.' } },
  },
  args: {
    formConfig: formConfig({
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
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('textbox', { name: 'First' })).toBeDisabled();
    await expect(await canvas.findByRole('textbox', { name: 'Grouped First' })).toBeDisabled();
    await expect(await canvas.findByRole('textbox', { name: 'Nested Second' })).toBeDisabled();
    await expect(await canvas.findByRole('textbox', { name: 'Grouped Overwritten' })).not.toBeDisabled();
    await expect(await canvas.findByRole('textbox', { name: 'Nested Overwritten' })).not.toBeDisabled();
  },
};

// ---------------------------------------------------------------------------
// Initial Disabled State
// ---------------------------------------------------------------------------

export const InitialDisabledState: Story = {
  parameters: {
    docs: { description: { story: 'Initial state matches disabled condition from default value.' } },
  },
  args: {
    formConfig: formConfig({
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
  },
  play: async ({ canvas, userEvent }) => {
    // Initially all disabled (defaultValue matches condition)
    await expect(await canvas.findByRole('textbox', { name: 'First' })).toBeDisabled();
    await expect(await canvas.findByRole('textbox', { name: 'Grouped First' })).toBeDisabled();
    await expect(await canvas.findByRole('textbox', { name: 'Nested Second' })).toBeDisabled();

    // Clear disableControl → all become enabled
    await userEvent.clear(await canvas.findByRole('textbox', { name: 'Type "disable"' }));

    await expect(await canvas.findByRole('textbox', { name: 'First' })).not.toBeDisabled();
    await expect(await canvas.findByRole('textbox', { name: 'Grouped First' })).not.toBeDisabled();
    await expect(await canvas.findByRole('textbox', { name: 'Nested Second' })).not.toBeDisabled();
  },
};

// ---------------------------------------------------------------------------
// Function Disabled
// ---------------------------------------------------------------------------

export const FunctionDisabled: Story = {
  parameters: {
    docs: { description: { story: 'Function-based disabled expression toggles disabled state reactively.' } },
  },
  args: {
    formConfig: formConfig({
      trigger: {
        type: 'text',
        label: 'Type "disable" to disable target',
        defaultValue: '',
      },
      target: {
        type: 'text',
        label: 'Target',
        disabled: (formValue: FormContext) => formValue['trigger'] === 'disable',
        defaultValue: 'I can be disabled',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const target = await canvas.findByRole('textbox', { name: 'Target' });
    await expect(target).not.toBeDisabled();

    // Type "disable" → target becomes disabled
    const trigger = await canvas.findByRole('textbox', { name: 'Type "disable" to disable target' });
    await userEvent.type(trigger, 'disable');
    await expect(target).toBeDisabled();

    // Clear → target re-enables
    await userEvent.clear(trigger);
    await userEvent.type(trigger, 'something else');
    await expect(target).not.toBeDisabled();
  },
};
