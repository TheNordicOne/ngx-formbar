import type { Meta, StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import type { FormContext } from '@ngx-formbar/core';
import { StoryFormHostComponent } from './story-form-host.component';
import { formConfig } from './story-helpers';

const meta: Meta<StoryFormHostComponent> = {
  title: 'Reactive Forms/Readonly Expressions',
  component: StoryFormHostComponent,
};

export default meta;
type Story = StoryObj<StoryFormHostComponent>;

// ---------------------------------------------------------------------------
// Static Readonly
// ---------------------------------------------------------------------------

export const StaticReadonly: Story = {
  parameters: {
    docs: { description: { story: 'Static readonly: true applies the readonly attribute.' } },
  },
  args: {
    formConfig: formConfig({
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
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('textbox', { name: 'First' })).toHaveAttribute('readonly');
    await expect(await canvas.findByRole('textbox', { name: 'Grouped First label' })).toHaveAttribute(
      'readonly',
    );
    await expect(await canvas.findByRole('textbox', { name: 'Nested Second label' })).toHaveAttribute(
      'readonly',
    );
  },
};

// ---------------------------------------------------------------------------
// Conditional Readonly
// ---------------------------------------------------------------------------

export const ConditionalReadonly: Story = {
  parameters: {
    docs: { description: { story: 'Conditional expression toggles readonly state reactively.' } },
  },
  args: {
    formConfig: formConfig({
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
  },
  play: async ({ canvas, userEvent }) => {
    // Initially not readonly
    await expect(await canvas.findByRole('textbox', { name: 'First' })).not.toHaveAttribute('readonly');
    await expect(await canvas.findByRole('textbox', { name: 'Grouped First label' })).not.toHaveAttribute(
      'readonly',
    );
    await expect(await canvas.findByRole('textbox', { name: 'Nested Second label' })).not.toHaveAttribute(
      'readonly',
    );

    // Type "readonly" to trigger the expression
    const readonlyControl = await canvas.findByRole('textbox', { name: 'Type "readonly" to readonly everything' });
    await userEvent.clear(readonlyControl);
    await userEvent.type(readonlyControl, 'readonly');

    await expect(await canvas.findByRole('textbox', { name: 'First' })).toHaveAttribute('readonly');
    await expect(await canvas.findByRole('textbox', { name: 'Grouped First label' })).toHaveAttribute(
      'readonly',
    );
    await expect(await canvas.findByRole('textbox', { name: 'Nested Second label' })).toHaveAttribute(
      'readonly',
    );

    // Clear to remove readonly
    await userEvent.clear(readonlyControl);
    await userEvent.type(readonlyControl, 'something else');

    await expect(await canvas.findByRole('textbox', { name: 'First' })).not.toHaveAttribute('readonly');
    await expect(await canvas.findByRole('textbox', { name: 'Grouped First label' })).not.toHaveAttribute(
      'readonly',
    );
    await expect(await canvas.findByRole('textbox', { name: 'Nested Second label' })).not.toHaveAttribute(
      'readonly',
    );
  },
};

// ---------------------------------------------------------------------------
// Group Readonly with Override
// ---------------------------------------------------------------------------

export const GroupReadonlyWithOverride: Story = {
  parameters: {
    docs: { description: { story: 'Group readonly with individual controls overriding to editable.' } },
  },
  args: {
    formConfig: formConfig({
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
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('textbox', { name: 'First' })).toHaveAttribute('readonly');
    await expect(await canvas.findByRole('textbox', { name: 'Grouped First' })).toHaveAttribute(
      'readonly',
    );
    await expect(await canvas.findByRole('textbox', { name: 'Nested Second' })).toHaveAttribute('readonly');
    await expect(await canvas.findByRole('textbox', { name: 'Grouped Overwritten' })).not.toHaveAttribute('readonly');
    await expect(await canvas.findByRole('textbox', { name: 'Nested Overwritten' })).not.toHaveAttribute('readonly');
  },
};

// ---------------------------------------------------------------------------
// Initial Readonly State
// ---------------------------------------------------------------------------

export const InitialReadonlyState: Story = {
  parameters: {
    docs: { description: { story: 'Initial state matches readonly condition from default value.' } },
  },
  args: {
    formConfig: formConfig({
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
  },
  play: async ({ canvas, userEvent }) => {
    // Initially all readonly (defaultValue matches condition)
    await expect(await canvas.findByRole('textbox', { name: 'First' })).toHaveAttribute('readonly');
    await expect(await canvas.findByRole('textbox', { name: 'Grouped First' })).toHaveAttribute(
      'readonly',
    );
    await expect(await canvas.findByRole('textbox', { name: 'Nested Second' })).toHaveAttribute('readonly');

    // Clear readonlyControl → all become not readonly
    await userEvent.clear(await canvas.findByRole('textbox', { name: 'Type "readonly"' }));

    await expect(await canvas.findByRole('textbox', { name: 'First' })).not.toHaveAttribute('readonly');
    await expect(await canvas.findByRole('textbox', { name: 'Grouped First' })).not.toHaveAttribute('readonly');
    await expect(await canvas.findByRole('textbox', { name: 'Nested Second' })).not.toHaveAttribute('readonly');
  },
};

// ---------------------------------------------------------------------------
// Function Readonly
// ---------------------------------------------------------------------------

export const FunctionReadonly: Story = {
  parameters: {
    docs: { description: { story: 'Function-based readonly expression toggles readonly state reactively.' } },
  },
  args: {
    formConfig: formConfig({
      trigger: {
        type: 'text',
        label: 'Type "readonly" to make target readonly',
        defaultValue: '',
      },
      target: {
        type: 'text',
        label: 'Target',
        readonly: (formValue: FormContext) => formValue['trigger'] === 'readonly',
        defaultValue: 'I can be readonly',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    const target = await canvas.findByRole('textbox', { name: 'Target' });
    await expect(target).not.toHaveAttribute('readonly');

    // Type "readonly" → target becomes readonly
    const trigger = await canvas.findByRole('textbox', { name: 'Type "readonly" to make target readonly' });
    await userEvent.type(trigger, 'readonly');
    await expect(target).toHaveAttribute('readonly');

    // Clear → target loses readonly
    await userEvent.clear(trigger);
    await userEvent.type(trigger, 'something else');
    await expect(target).not.toHaveAttribute('readonly');
  },
};
