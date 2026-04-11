import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { expect } from 'storybook/test';
import { provideReactiveFormsExamples } from '@ngx-formbar/examples/reactive-forms';
import { StoryFormHostComponent } from './story-form-host.component';
import { NgxFbForm } from '@ngx-formbar/core';

const meta: Meta<StoryFormHostComponent> = {
  title: 'Reactive Forms/Update Strategy',
  component: StoryFormHostComponent,
};

export default meta;
type Story = StoryObj<StoryFormHostComponent>;

function getFormValue(): Record<string, unknown> {
  return StoryFormHostComponent.lastInstance!.form.getRawValue();
}

// -- DefaultChangeStrategy --

export const DefaultChangeStrategy: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Default Angular behavior — form model updates on every keystroke.',
      },
    },
  },
  args: {
    formConfig: {
      content: {
        control: {
          type: 'text',
          label: 'Default Strategy',
          defaultValue: '',
        },
      },
    } satisfies NgxFbForm,
  },
  play: async ({ canvas, userEvent }) => {
    const input = await canvas.findByRole('textbox', {
      name: 'Default Strategy',
    });
    await userEvent.clear(input);
    await userEvent.type(input, 'new-text');

    await expect(getFormValue()['control']).toBe('new-text');
  },
};

// -- GlobalBlurStrategy --

export const GlobalBlurStrategy: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Global blur strategy — form model updates only on blur.',
      },
    },
  },
  decorators: [
    applicationConfig({
      providers: [provideReactiveFormsExamples({ updateOn: 'blur' })],
    }),
  ],
  args: {
    formConfig: {
      content: {
        control: {
          type: 'text',
          label: 'Control',
        },
      },
    } satisfies NgxFbForm,
  },
  play: async ({ canvas, userEvent }) => {
    const input = await canvas.findByRole('textbox', { name: 'Control' });
    await userEvent.clear(input);
    await userEvent.type(input, 'new-text');

    // Form model has not committed the typed value yet
    await expect(getFormValue()['control']).not.toBe('new-text');

    // Blur commits the value
    await userEvent.tab();
    await expect(getFormValue()['control']).toBe('new-text');
  },
};

// -- GlobalSubmitStrategy --

export const GlobalSubmitStrategy: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Global submit strategy — form model updates only on submit.',
      },
    },
  },
  decorators: [
    applicationConfig({
      providers: [provideReactiveFormsExamples({ updateOn: 'submit' })],
    }),
  ],
  args: {
    formConfig: {
      content: {
        control: {
          type: 'text',
          label: 'Control',
        },
      },
    } satisfies NgxFbForm,
  },
  play: async ({ canvas, userEvent }) => {
    const input = await canvas.findByRole('textbox', { name: 'Control' });
    await userEvent.clear(input);
    await userEvent.type(input, 'submit-text');

    // Blur should not commit the value either
    await userEvent.tab();
    await expect(getFormValue()['control']).not.toBe('submit-text');

    // Submit commits the value
    const submitButton = await canvas.findByRole('button', { name: 'Submit' });
    await userEvent.click(submitButton);
    await expect(getFormValue()['control']).toBe('submit-text');
  },
};

// -- ControlOverride --

export const ControlOverride: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A control overrides the global submit strategy with change.',
      },
    },
  },
  decorators: [
    applicationConfig({
      providers: [provideReactiveFormsExamples({ updateOn: 'submit' })],
    }),
  ],
  args: {
    formConfig: {
      content: {
        'default-control': {
          type: 'text',
          label: 'Default Control',
        },
        'override-control': {
          type: 'text',
          label: 'Override Control',
          updateOn: 'change',
        },
      },
    } satisfies NgxFbForm,
  },
  play: async ({ canvas, userEvent }) => {
    // The override control uses 'change' — updates immediately
    const overrideInput = await canvas.findByRole('textbox', {
      name: 'Override Control',
    });
    await userEvent.clear(overrideInput);
    await userEvent.type(overrideInput, 'override-text');
    await expect(getFormValue()['override-control']).toBe('override-text');

    // The default control uses the global 'submit' strategy
    const defaultInput = await canvas.findByRole('textbox', {
      name: 'Default Control',
    });
    await userEvent.clear(defaultInput);
    await userEvent.type(defaultInput, 'default-text');
    await userEvent.tab();

    // Not committed yet — still needs submit
    await expect(getFormValue()['default-control']).not.toBe('default-text');

    // Submit commits the value
    const submitButton = await canvas.findByRole('button', { name: 'Submit' });
    await userEvent.click(submitButton);
    await expect(getFormValue()['default-control']).toBe('default-text');
  },
};

// -- NestedGroupInheritance --

export const NestedGroupInheritance: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Nested groups inherit and override the parent updateOn strategy.',
      },
    },
  },
  args: {
    formConfig: {
      content: {
        'root-group': {
          type: 'group',
          updateOn: 'submit',
          controls: {
            'child-group': {
              type: 'group',
              controls: {
                'grandchild-control': {
                  type: 'text',
                  label: 'Grandchild Control (inherits submit)',
                },
              },
            },
            'override-group': {
              type: 'group',
              updateOn: 'blur',
              controls: {
                'grandchild-override-control': {
                  type: 'text',
                  label: 'Grandchild Override Control (inherits blur)',
                },
              },
            },
          },
        },
      },
    } satisfies NgxFbForm,
  },
  play: async ({ canvas, userEvent }) => {
    const formValue = () =>
      getFormValue() as {
        'root-group': Record<string, Record<string, string>>;
      };

    // Grandchild inheriting 'submit' through nested groups
    const grandchildInput = await canvas.findByRole('textbox', {
      name: 'Grandchild Control (inherits submit)',
    });
    await userEvent.clear(grandchildInput);
    await userEvent.type(grandchildInput, 'grandchild-text');
    await userEvent.tab();

    await expect(
      formValue()['root-group']['child-group']['grandchild-control'],
    ).not.toBe('grandchild-text');

    await userEvent.click(
      await canvas.findByRole('button', { name: 'Submit' }),
    );
    await expect(
      formValue()['root-group']['child-group']['grandchild-control'],
    ).toBe('grandchild-text');

    // Grandchild inheriting 'blur' from overridden parent group
    const overrideInput = await canvas.findByRole('textbox', {
      name: 'Grandchild Override Control (inherits blur)',
    });
    await userEvent.clear(overrideInput);
    await userEvent.type(overrideInput, 'override-text');

    await expect(
      formValue()['root-group']['override-group'][
        'grandchild-override-control'
      ],
    ).not.toBe('override-text');

    await userEvent.tab();
    await expect(
      formValue()['root-group']['override-group'][
        'grandchild-override-control'
      ],
    ).toBe('override-text');
  },
};

// -- ExplicitPerControlStrategies --

export const ExplicitPerControlStrategies: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Each control explicitly sets its own updateOn strategy.',
      },
    },
  },
  args: {
    formConfig: {
      content: {
        'change-control': {
          type: 'text',
          label: 'Change Control',
          updateOn: 'change',
        },
        'blur-control': {
          type: 'text',
          label: 'Blur Control',
          updateOn: 'blur',
        },
        'submit-control': {
          type: 'text',
          label: 'Submit Control',
          updateOn: 'submit',
        },
      },
    } satisfies NgxFbForm,
  },
  play: async ({ canvas, userEvent }) => {
    // Change strategy — updates immediately
    const changeInput = await canvas.findByRole('textbox', {
      name: 'Change Control',
    });
    await userEvent.clear(changeInput);
    await userEvent.type(changeInput, 'change-text');
    await expect(getFormValue()['change-control']).toBe('change-text');

    // Blur strategy — updates only on blur
    const blurInput = await canvas.findByRole('textbox', {
      name: 'Blur Control',
    });
    await userEvent.clear(blurInput);
    await userEvent.type(blurInput, 'blur-text');
    await expect(getFormValue()['blur-control']).not.toBe('blur-text');
    await userEvent.tab();
    await expect(getFormValue()['blur-control']).toBe('blur-text');

    // Submit strategy — updates only on submit
    const submitInput = await canvas.findByRole('textbox', {
      name: 'Submit Control',
    });
    await userEvent.clear(submitInput);
    await userEvent.type(submitInput, 'submit-text');
    await userEvent.tab();
    await expect(getFormValue()['submit-control']).not.toBe('submit-text');
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Submit' }),
    );
    await expect(getFormValue()['submit-control']).toBe('submit-text');
  },
};

// -- GlobalDefaultWithNestedGroups --

export const GlobalDefaultWithNestedGroups: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Global blur default with a nested group overriding to change.',
      },
    },
  },
  decorators: [
    applicationConfig({
      providers: [provideReactiveFormsExamples({ updateOn: 'blur' })],
    }),
  ],
  args: {
    formConfig: {
      content: {
        'root-group': {
          type: 'group',
          controls: {
            'child-control': {
              type: 'text',
              label: 'Child Control (inherits blur)',
            },
            'child-group': {
              type: 'group',
              updateOn: 'change',
              controls: {
                'grandchild-control': {
                  type: 'text',
                  label: 'Grandchild Control (inherits change)',
                },
              },
            },
          },
        },
      },
    } satisfies NgxFbForm,
  },
  play: async ({ canvas, userEvent }) => {
    const formValue = () =>
      getFormValue() as { 'root-group': Record<string, unknown> };

    // child-control inherits global default (blur)
    const childInput = await canvas.findByRole('textbox', {
      name: 'Child Control (inherits blur)',
    });
    await userEvent.clear(childInput);
    await userEvent.type(childInput, 'child-text');
    await expect(formValue()['root-group']['child-control']).not.toBe(
      'child-text',
    );
    await userEvent.tab();
    await expect(formValue()['root-group']['child-control']).toBe('child-text');

    // grandchild-control inherits change from child-group override
    const grandchildInput = await canvas.findByRole('textbox', {
      name: 'Grandchild Control (inherits change)',
    });
    await userEvent.clear(grandchildInput);
    await userEvent.type(grandchildInput, 'grandchild-text');
    await expect(
      (formValue()['root-group']['child-group'] as Record<string, unknown>)[
        'grandchild-control'
      ],
    ).toBe('grandchild-text');
  },
};
