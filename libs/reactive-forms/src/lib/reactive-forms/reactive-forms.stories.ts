import type { Meta, StoryObj } from '@storybook/angular';
import { NgxFormbarReactiveForms } from './reactive-forms';
import { expect } from 'storybook/test';

const meta: Meta<NgxFormbarReactiveForms> = {
  component: NgxFormbarReactiveForms,
  title: 'NgxFormbarReactiveForms',
};
export default meta;

type Story = StoryObj<NgxFormbarReactiveForms>;

export const Primary: Story = {
  args: {},
};

export const Heading: Story = {
  args: {},
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/reactive-forms/gi)).toBeTruthy();
  },
};
