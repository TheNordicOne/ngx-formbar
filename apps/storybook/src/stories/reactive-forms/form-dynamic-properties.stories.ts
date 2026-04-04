import type { Meta, StoryObj } from '@storybook/angular';
import { expect } from 'storybook/test';
import type { FormContext } from '@ngx-formbar/core';
import { StoryFormHostComponent } from './story-form-host.component';
import { formConfig } from './story-helpers';

const meta: Meta<StoryFormHostComponent> = {
  title: 'Reactive Forms/Dynamic Properties',
  component: StoryFormHostComponent,
};

export default meta;
type Story = StoryObj<StoryFormHostComponent>;

// ---------------------------------------------------------------------------
// Helper functions for stories
// ---------------------------------------------------------------------------

function getGreeting(name: string): string {
  return `Greeting for ${name.length > 0 ? name : 'Guest'}`;
}

// ---------------------------------------------------------------------------
// Dynamic Labels
// ---------------------------------------------------------------------------

export const DynamicLabels: Story = {
  parameters: {
    docs: { description: { story: 'Dynamic label expressions update when the source field changes.' } },
  },
  args: {
    formConfig: formConfig({
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
  },
  play: async ({ canvas, userEvent }) => {
    // Dynamic label shows evaluated expression
    await expect(await canvas.findByText('Initial Dynamic Label')).toBeInTheDocument();

    // Static label remains unchanged
    await expect(await canvas.findByText('Purely Static Label')).toBeInTheDocument();

    // Update source changes dynamic label
    const source = await canvas.findByRole('textbox', { name: 'Source' });
    await userEvent.clear(source);
    await userEvent.type(source, 'Updated');
    await expect(await canvas.findByText('Updated Dynamic Label')).toBeInTheDocument();
  },
};

// ---------------------------------------------------------------------------
// Dynamic Titles
// ---------------------------------------------------------------------------

export const DynamicTitles: Story = {
  parameters: {
    docs: { description: { story: 'Dynamic titles on groups and labels on controls update reactively.' } },
  },
  args: {
    formConfig: formConfig({
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
  },
  play: async ({ canvas, userEvent }) => {
    // Dynamic title shows evaluated expression
    await expect(await canvas.findByRole('group', { name: 'Initial Dynamic Title' })).toBeInTheDocument();

    // Nested dynamic title and label
    await expect(await canvas.findByRole('group', { name: 'Parent: Initial' })).toBeInTheDocument();
    await expect(await canvas.findByText('Child: Initial')).toBeInTheDocument();

    // Update source changes all dynamic properties
    const source = await canvas.findByRole('textbox', { name: 'Source' });
    await userEvent.clear(source);
    await userEvent.type(source, 'Updated');
    await expect(await canvas.findByRole('group', { name: 'Updated Dynamic Title' })).toBeInTheDocument();
    await expect(await canvas.findByRole('group', { name: 'Parent: Updated' })).toBeInTheDocument();
    await expect(await canvas.findByText('Child: Updated')).toBeInTheDocument();
  },
};

// ---------------------------------------------------------------------------
// Static Fallbacks
// ---------------------------------------------------------------------------

export const StaticLabelFallback: Story = {
  parameters: {
    docs: { description: { story: 'Static label renders when no dynamic label is set.' } },
  },
  args: {
    formConfig: formConfig({
      target: { type: 'text', label: 'Purely Static Label' },
    }),
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText('Purely Static Label')).toBeInTheDocument();
  },
};

export const StaticTitleFallback: Story = {
  parameters: {
    docs: { description: { story: 'Static group title renders when no dynamic title is set.' } },
  },
  args: {
    formConfig: formConfig({
      targetGroup: {
        type: 'group',
        legend: 'Purely Static Title',
        controls: {},
      },
    }),
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole('group', { name: 'Purely Static Title' })).toBeInTheDocument();
  },
};

// ---------------------------------------------------------------------------
// External Function Call
// ---------------------------------------------------------------------------

export const ExternalFunctionCall: Story = {
  parameters: {
    docs: { description: { story: 'Dynamic label uses an external helper function.' } },
  },
  args: {
    formConfig: formConfig({
      nameForLabel: { type: 'text', label: 'Name', defaultValue: 'User' },
      targetFieldLabelFunc: {
        type: 'text',
        dynamicLabel: (formValue: FormContext): string => {
          const name = (formValue['nameForLabel'] as string | undefined) ?? '';
          return getGreeting(name);
        },
        defaultValue: 'Some value',
      },
    }),
  },
  play: async ({ canvas, userEvent }) => {
    // Verify initial label
    await expect(await canvas.findByText('Greeting for User')).toBeInTheDocument();

    // Clear name, type 'Alice' → label updates
    const nameForLabel = await canvas.findByRole('textbox', { name: 'Name' });
    await userEvent.clear(nameForLabel);
    await userEvent.type(nameForLabel, 'Alice');

    await expect(await canvas.findByText('Greeting for Alice')).toBeInTheDocument();

    // Clear name → label shows Guest
    await userEvent.clear(nameForLabel);

    await expect(await canvas.findByText('Greeting for Guest')).toBeInTheDocument();
  },
};
