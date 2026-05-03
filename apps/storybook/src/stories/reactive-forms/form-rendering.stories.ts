import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { expect } from 'storybook/test';
import { provideReactiveFormsExamples } from '@ngx-formbar/examples/reactive-forms';
import { NgxFbBaseContent } from '@ngx-formbar/core';
import { StoryFormHostComponent } from './story-form-host.component';

const meta: Meta<StoryFormHostComponent> = {
  title: 'Reactive Forms/Form Rendering',
  component: StoryFormHostComponent,
};

export default meta;
type Story = StoryObj<StoryFormHostComponent>;

// ---------------------------------------------------------------------------
// FormContent
// ---------------------------------------------------------------------------

export const FormContent: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Renders all content types with default values, including nested groups.',
      },
    },
  },
  args: {
    formConfig: {
      content: {
        first: {
          type: 'text',
          label: 'First',
          defaultValue: 'default-first',
        },
        second: {
          type: 'text',
          label: 'Second',
          defaultValue: 'default-second',
        },
        third: {
          type: 'text',
          label: 'Third',
          defaultValue: 'default-third',
        },
        fourth: {
          type: 'text',
          label: 'Fourth',
          defaultValue: 'default-fourth',
          nonNullable: true,
        },
        fifth: {
          type: 'text',
          label: 'Fifth',
          defaultValue: 'default-fifth',
          nonNullable: true,
        },
        block: {
          type: 'note',
          message: 'This is an information',
          isControl: false,
        },
        'first-group': {
          type: 'group',
          legend: 'First Group',
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
      },
    },
  },
  play: async ({ canvas }) => {
    // Top-level text controls render with default values
    await expect(
      await canvas.findByRole('textbox', { name: 'First' }),
    ).toHaveValue('default-first');
    await expect(
      await canvas.findByRole('textbox', { name: 'Second' }),
    ).toHaveValue('default-second');
    await expect(
      await canvas.findByRole('textbox', { name: 'Third' }),
    ).toHaveValue('default-third');
    await expect(
      await canvas.findByRole('textbox', { name: 'Fourth' }),
    ).toHaveValue('default-fourth');
    await expect(
      await canvas.findByRole('textbox', { name: 'Fifth' }),
    ).toHaveValue('default-fifth');

    // Note block renders its message
    await expect(
      await canvas.findByText('This is an information'),
    ).toBeInTheDocument();

    // First group with legend
    await expect(
      await canvas.findByRole('group', { name: 'First Group' }),
    ).toBeInTheDocument();
    await expect(
      await canvas.findByRole('textbox', { name: 'Grouped First label' }),
    ).toHaveValue('default-grouped-first');

    // Nested group with legend
    await expect(
      await canvas.findByRole('group', { name: 'Nested Group' }),
    ).toBeInTheDocument();
    await expect(
      await canvas.findByRole('textbox', { name: 'Nested Second label' }),
    ).toHaveValue('default-nested-second');
  },
};

// ---------------------------------------------------------------------------
// GroupContent
// ---------------------------------------------------------------------------

export const GroupContent: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Renders a group with nested groups and controls.',
      },
    },
  },
  args: {
    formConfig: {
      content: {
        'test-group': {
          type: 'group',
          legend: 'First Group',
          controls: {
            first: {
              type: 'text',
              label: 'First label',
            },
            'nested-group': {
              type: 'group',
              legend: 'Nested Group',
              controls: {
                second: {
                  type: 'text',
                  label: 'Second label',
                },
              },
            },
          },
        },
      },
    },
  },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('group', { name: 'First Group' }),
    ).toBeInTheDocument();

    await expect(
      await canvas.findByRole('textbox', { name: 'First label' }),
    ).toBeInTheDocument();

    await expect(
      await canvas.findByRole('group', { name: 'Nested Group' }),
    ).toBeInTheDocument();

    await expect(
      await canvas.findByRole('textbox', { name: 'Second label' }),
    ).toBeInTheDocument();
  },
};

// ---------------------------------------------------------------------------
// PatchAndReset
// ---------------------------------------------------------------------------

export const PatchAndReset: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Patches form values and resets, verifying nullable vs nonNullable behavior.',
      },
    },
  },
  args: {
    formConfig: {
      content: {
        first: {
          type: 'text',
          label: 'First',
          defaultValue: 'default-first',
        },
        second: {
          type: 'text',
          label: 'Second',
          defaultValue: 'default-second',
        },
        third: {
          type: 'text',
          label: 'Third',
          defaultValue: 'default-third',
        },
        fourth: {
          type: 'text',
          label: 'Fourth',
          defaultValue: 'default-fourth',
          nonNullable: true,
        },
        fifth: {
          type: 'text',
          label: 'Fifth',
          defaultValue: 'default-fifth',
          nonNullable: true,
        },
      },
    },
    patchData: {
      first: 'patched-first',
      second: 'patched-second',
      third: 'patched-third',
      fourth: 'patched-fourth',
      fifth: 'patched-fifth',
    },
  },
  play: async ({ canvas, userEvent }) => {
    // Verify default values are rendered
    await expect(
      await canvas.findByRole('textbox', { name: 'First' }),
    ).toHaveValue('default-first');
    await expect(
      await canvas.findByRole('textbox', { name: 'Second' }),
    ).toHaveValue('default-second');
    await expect(
      await canvas.findByRole('textbox', { name: 'Third' }),
    ).toHaveValue('default-third');
    await expect(
      await canvas.findByRole('textbox', { name: 'Fourth' }),
    ).toHaveValue('default-fourth');
    await expect(
      await canvas.findByRole('textbox', { name: 'Fifth' }),
    ).toHaveValue('default-fifth');

    // Patch values
    await userEvent.click(await canvas.findByRole('button', { name: 'Patch' }));

    await expect(
      await canvas.findByRole('textbox', { name: 'First' }),
    ).toHaveValue('patched-first');
    await expect(
      await canvas.findByRole('textbox', { name: 'Second' }),
    ).toHaveValue('patched-second');
    await expect(
      await canvas.findByRole('textbox', { name: 'Third' }),
    ).toHaveValue('patched-third');
    await expect(
      await canvas.findByRole('textbox', { name: 'Fourth' }),
    ).toHaveValue('patched-fourth');
    await expect(
      await canvas.findByRole('textbox', { name: 'Fifth' }),
    ).toHaveValue('patched-fifth');

    // Reset — nullable controls clear, nonNullable controls revert to defaults
    await userEvent.click(await canvas.findByRole('button', { name: 'Reset' }));

    await expect(
      await canvas.findByRole('textbox', { name: 'First' }),
    ).toHaveValue('');
    await expect(
      await canvas.findByRole('textbox', { name: 'Second' }),
    ).toHaveValue('');
    await expect(
      await canvas.findByRole('textbox', { name: 'Third' }),
    ).toHaveValue('');
    await expect(
      await canvas.findByRole('textbox', { name: 'Fourth' }),
    ).toHaveValue('default-fourth');
    await expect(
      await canvas.findByRole('textbox', { name: 'Fifth' }),
    ).toHaveValue('default-fifth');
  },
};

// ---------------------------------------------------------------------------
// ContentRegistration
// ---------------------------------------------------------------------------

export const ContentRegistration: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Verifies that registered content renders in the form.',
      },
    },
  },
  args: {
    formConfig: {
      content: {
        control: {
          type: 'text',
          label: 'Test',
        },
      },
    },
  },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('textbox', { name: 'Test' }),
    ).toBeInTheDocument();
  },
};

// ---------------------------------------------------------------------------
// DefaultTestId
// ---------------------------------------------------------------------------

export const DefaultTestId: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Verifies the default testId naming convention across nesting levels.',
      },
    },
  },
  args: {
    formConfig: {
      content: {
        first: {
          type: 'text',
          label: 'First',
        },
        block: {
          type: 'note',
          message: 'This is an information',
          isControl: false,
        },
        'first-group': {
          type: 'group',
          legend: 'First Group',
          controls: {
            first: {
              type: 'text',
              label: 'Grouped First label',
            },
            'nested-group': {
              type: 'group',
              legend: 'Nested Group',
              controls: {
                first: {
                  type: 'text',
                  label: 'Nested First label',
                },
              },
            },
          },
        },
      },
    },
  },
  play: async ({ canvas }) => {
    // Top-level control: testId = name
    await expect(await canvas.findByTestId('first-input')).toBeInTheDocument();

    // Top-level block: testId = name
    await expect(await canvas.findByTestId('block')).toBeInTheDocument();

    // Group: testId = name
    await expect(await canvas.findByTestId('first-group')).toBeInTheDocument();

    // Grouped control: testId = parentTestId-name
    await expect(
      await canvas.findByTestId('first-group-first-input'),
    ).toBeInTheDocument();

    // Nested group: testId = parentTestId-name
    await expect(
      await canvas.findByTestId('first-group-nested-group'),
    ).toBeInTheDocument();

    // Nested grouped control: testId = grandparentTestId-parentTestId-name
    await expect(
      await canvas.findByTestId('first-group-nested-group-first-input'),
    ).toBeInTheDocument();
  },
};

// ---------------------------------------------------------------------------
// CustomTestIdBuilder
// ---------------------------------------------------------------------------

export const CustomTestIdBuilder: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Verifies a custom testIdBuilderFn overrides the default naming.',
      },
    },
  },
  decorators: [
    applicationConfig({
      providers: [
        provideReactiveFormsExamples({
          globalConfig: {
            testIdBuilderFn: (
              content: NgxFbBaseContent,
              name: string,
              parentTestId?: string,
            ) => `${parentTestId ?? 'root'}-${content.type}-${name}`,
          },
        }),
      ],
    }),
  ],
  args: {
    formConfig: {
      content: {
        first: {
          type: 'text',
          label: 'First',
        },
        block: {
          type: 'note',
          message: 'This is an information',
          isControl: false,
        },
        'first-group': {
          type: 'group',
          legend: 'First Group',
          controls: {
            first: {
              type: 'text',
              label: 'Grouped First label',
            },
            'nested-group': {
              type: 'group',
              legend: 'Nested Group',
              controls: {
                first: {
                  type: 'text',
                  label: 'Nested First label',
                },
              },
            },
          },
        },
      },
    },
  },
  play: async ({ canvas }) => {
    // Top-level text: root-text-first
    await expect(
      await canvas.findByTestId('root-text-first-input'),
    ).toBeInTheDocument();

    // Top-level note block: root-note-block
    await expect(
      await canvas.findByTestId('root-note-block'),
    ).toBeInTheDocument();

    // Group: root-group-first-group
    await expect(
      await canvas.findByTestId('root-group-first-group'),
    ).toBeInTheDocument();

    // Grouped text control: root-group-first-group-text-first
    await expect(
      await canvas.findByTestId('root-group-first-group-text-first-input'),
    ).toBeInTheDocument();

    // Nested group: root-group-first-group-group-nested-group
    await expect(
      await canvas.findByTestId('root-group-first-group-group-nested-group'),
    ).toBeInTheDocument();

    // Nested grouped text control
    await expect(
      await canvas.findByTestId(
        'root-group-first-group-group-nested-group-text-first-input',
      ),
    ).toBeInTheDocument();
  },
};

// ---------------------------------------------------------------------------
// ControlProperties
// ---------------------------------------------------------------------------

export const ControlProperties: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Renders a control with label, hint, and default value.',
      },
    },
  },
  args: {
    formConfig: {
      content: {
        first: {
          type: 'text',
          label: 'First label',
          hint: 'This is a hint',
          defaultValue: 'First Default',
        },
      },
    },
  },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('textbox', { name: 'First label' }),
    ).toBeInTheDocument();
    await expect(await canvas.findByText('First label')).toBeInTheDocument();
    await expect(await canvas.findByText('This is a hint')).toBeInTheDocument();
    await expect(
      await canvas.findByRole('textbox', { name: 'First label' }),
    ).toHaveValue('First Default');
  },
};

// ---------------------------------------------------------------------------
// NoDefaultValue
// ---------------------------------------------------------------------------

export const NoDefaultValue: Story = {
  parameters: {
    docs: {
      description: { story: 'Renders a control without a default value.' },
    },
  },
  args: {
    formConfig: {
      content: {
        first: {
          type: 'text',
          label: 'First label',
          hint: 'This is a hint',
        },
      },
    },
  },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole('textbox', { name: 'First label' }),
    ).toBeInTheDocument();
    await expect(await canvas.findByText('First label')).toBeInTheDocument();
    await expect(await canvas.findByText('This is a hint')).toBeInTheDocument();
    await expect(
      await canvas.findByRole('textbox', { name: 'First label' }),
    ).toHaveValue('');
  },
};

// ---------------------------------------------------------------------------
// SubmitFormValues
// ---------------------------------------------------------------------------

export const SubmitFormValues: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Fills all fields and submits, verifying the rendered form values.',
      },
    },
  },
  args: {
    formConfig: {
      content: {
        first: {
          type: 'text',
          label: 'First',
          defaultValue: 'default-first',
        },
        second: {
          type: 'text',
          label: 'Second',
          defaultValue: 'default-second',
        },
        third: {
          type: 'text',
          label: 'Third',
          defaultValue: 'default-third',
        },
        fourth: {
          type: 'text',
          label: 'Fourth',
          defaultValue: 'default-fourth',
          nonNullable: true,
        },
        fifth: {
          type: 'text',
          label: 'Fifth',
          defaultValue: 'default-fifth',
          nonNullable: true,
        },
        block: {
          type: 'note',
          message: 'This is an information',
          isControl: false,
        },
        'first-group': {
          type: 'group',
          legend: 'First Group',
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
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    // Clear and type custom values into all controls
    const firstInput = await canvas.findByRole('textbox', { name: 'First' });
    await userEvent.clear(firstInput);
    await userEvent.type(firstInput, 'This is the first control');

    const secondInput = await canvas.findByRole('textbox', { name: 'Second' });
    await userEvent.clear(secondInput);
    await userEvent.type(secondInput, 'I entered something here');

    const thirdInput = await canvas.findByRole('textbox', { name: 'Third' });
    await userEvent.clear(thirdInput);
    await userEvent.type(thirdInput, 'Here is some value');

    const fourthInput = await canvas.findByRole('textbox', { name: 'Fourth' });
    await userEvent.clear(fourthInput);
    await userEvent.type(fourthInput, 'Go Fourth');

    const fifthInput = await canvas.findByRole('textbox', { name: 'Fifth' });
    await userEvent.clear(fifthInput);
    await userEvent.type(fifthInput, 'Something');

    const groupedFirstInput = await canvas.findByRole('textbox', {
      name: 'Grouped First label',
    });
    await userEvent.clear(groupedFirstInput);
    await userEvent.type(groupedFirstInput, 'Grouped Input');

    const nestedSecondInput = await canvas.findByRole('textbox', {
      name: 'Nested Second label',
    });
    await userEvent.clear(nestedSecondInput);
    await userEvent.type(nestedSecondInput, 'Nested Grouped Input');

    // Click submit button
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Submit' }),
    );

    // Verify rendered form values
    await expect(await canvas.findByTestId('first-value')).toHaveTextContent(
      'This is the first control',
    );
    await expect(await canvas.findByTestId('second-value')).toHaveTextContent(
      'I entered something here',
    );
    await expect(await canvas.findByTestId('third-value')).toHaveTextContent(
      'Here is some value',
    );
    await expect(await canvas.findByTestId('fourth-value')).toHaveTextContent(
      'Go Fourth',
    );
    await expect(await canvas.findByTestId('fifth-value')).toHaveTextContent(
      'Something',
    );
    await expect(
      await canvas.findByTestId('first-group.grouped-first-value'),
    ).toHaveTextContent('Grouped Input');
    await expect(
      await canvas.findByTestId('first-group.nested-group.nested-second-value'),
    ).toHaveTextContent('Nested Grouped Input');
  },
};
