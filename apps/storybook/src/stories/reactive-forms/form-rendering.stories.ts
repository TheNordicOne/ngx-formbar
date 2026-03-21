import type { Meta, StoryObj } from '@storybook/angular';
import { expect, waitFor } from 'storybook/test';
import { applicationConfig } from '@storybook/angular';
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
    docs: { description: { story: 'Renders all content types with default values, including nested groups.' } },
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
    await waitFor(async () => {
      // Top-level text controls render with default values
      await expect(canvas.getByRole('textbox', { name: 'First' })).toHaveValue('default-first');
      await expect(canvas.getByRole('textbox', { name: 'Second' })).toHaveValue('default-second');
      await expect(canvas.getByRole('textbox', { name: 'Third' })).toHaveValue('default-third');
      await expect(canvas.getByRole('textbox', { name: 'Fourth' })).toHaveValue('default-fourth');
      await expect(canvas.getByRole('textbox', { name: 'Fifth' })).toHaveValue('default-fifth');

      // Note block renders its message
      await expect(canvas.getByText('This is an information')).toBeInTheDocument();

      // First group with legend
      await expect(canvas.getByRole('group', { name: 'First Group' })).toBeInTheDocument();
      await expect(canvas.getByRole('textbox', { name: 'Grouped First label' })).toHaveValue(
        'default-grouped-first',
      );

      // Nested group with legend
      await expect(
        canvas.getByRole('group', { name: 'Nested Group' }),
      ).toBeInTheDocument();
      await expect(
        canvas.getByRole('textbox', { name: 'Nested Second label' }),
      ).toHaveValue('default-nested-second');
    });
  },
};

// ---------------------------------------------------------------------------
// PatchAndReset
// ---------------------------------------------------------------------------

export const PatchAndReset: Story = {
  parameters: {
    docs: { description: { story: 'Patches form values and resets, verifying nullable vs nonNullable behavior.' } },
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
    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'First' })).toHaveValue('default-first');
      await expect(canvas.getByRole('textbox', { name: 'Second' })).toHaveValue('default-second');
      await expect(canvas.getByRole('textbox', { name: 'Third' })).toHaveValue('default-third');
      await expect(canvas.getByRole('textbox', { name: 'Fourth' })).toHaveValue('default-fourth');
      await expect(canvas.getByRole('textbox', { name: 'Fifth' })).toHaveValue('default-fifth');
    });

    // Patch values
    await userEvent.click(canvas.getByRole('button', { name: 'Patch' }));

    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'First' })).toHaveValue('patched-first');
      await expect(canvas.getByRole('textbox', { name: 'Second' })).toHaveValue('patched-second');
      await expect(canvas.getByRole('textbox', { name: 'Third' })).toHaveValue('patched-third');
      await expect(canvas.getByRole('textbox', { name: 'Fourth' })).toHaveValue('patched-fourth');
      await expect(canvas.getByRole('textbox', { name: 'Fifth' })).toHaveValue('patched-fifth');
    });

    // Reset — nullable controls clear, nonNullable controls revert to defaults
    await userEvent.click(canvas.getByRole('button', { name: 'Reset' }));

    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'First' })).toHaveValue('');
      await expect(canvas.getByRole('textbox', { name: 'Second' })).toHaveValue('');
      await expect(canvas.getByRole('textbox', { name: 'Third' })).toHaveValue('');
      await expect(canvas.getByRole('textbox', { name: 'Fourth' })).toHaveValue('default-fourth');
      await expect(canvas.getByRole('textbox', { name: 'Fifth' })).toHaveValue('default-fifth');
    });
  },
};

// ---------------------------------------------------------------------------
// ContentRegistration
// ---------------------------------------------------------------------------

export const ContentRegistration: Story = {
  parameters: {
    docs: { description: { story: 'Verifies that registered content renders in the form.' } },
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
    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'Test' })).toBeInTheDocument();
    });
  },
};

// ---------------------------------------------------------------------------
// DefaultTestId
// ---------------------------------------------------------------------------

export const DefaultTestId: Story = {
  parameters: {
    docs: { description: { story: 'Verifies the default testId naming convention across nesting levels.' } },
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
    await waitFor(async () => {
      // Top-level control: testId = name
      await expect(canvas.getByTestId('first-input')).toBeInTheDocument();

      // Top-level block: testId = name
      await expect(canvas.getByTestId('block')).toBeInTheDocument();

      // Group: testId = name
      await expect(canvas.getByTestId('first-group')).toBeInTheDocument();

      // Grouped control: testId = parentTestId-name
      await expect(
        canvas.getByTestId('first-group-first-input'),
      ).toBeInTheDocument();

      // Nested group: testId = parentTestId-name
      await expect(
        canvas.getByTestId('first-group-nested-group'),
      ).toBeInTheDocument();

      // Nested grouped control: testId = grandparentTestId-parentTestId-name
      await expect(
        canvas.getByTestId('first-group-nested-group-first-input'),
      ).toBeInTheDocument();
    });
  },
};

// ---------------------------------------------------------------------------
// CustomTestIdBuilder
// ---------------------------------------------------------------------------

export const CustomTestIdBuilder: Story = {
  parameters: {
    docs: { description: { story: 'Verifies a custom testIdBuilderFn overrides the default naming.' } },
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
    await waitFor(async () => {
      // Top-level text: root-text-first
      await expect(
        canvas.getByTestId('root-text-first-input'),
      ).toBeInTheDocument();

      // Top-level note block: root-note-block
      await expect(canvas.getByTestId('root-note-block')).toBeInTheDocument();

      // Group: root-group-first-group
      await expect(
        canvas.getByTestId('root-group-first-group'),
      ).toBeInTheDocument();

      // Grouped text control: root-group-first-group-text-first
      await expect(
        canvas.getByTestId('root-group-first-group-text-first-input'),
      ).toBeInTheDocument();

      // Nested group: root-group-first-group-group-nested-group
      await expect(
        canvas.getByTestId('root-group-first-group-group-nested-group'),
      ).toBeInTheDocument();

      // Nested grouped text control
      await expect(
        canvas.getByTestId(
          'root-group-first-group-group-nested-group-text-first-input',
        ),
      ).toBeInTheDocument();

    });
  },
};

// ---------------------------------------------------------------------------
// ControlProperties
// ---------------------------------------------------------------------------

export const ControlProperties: Story = {
  parameters: {
    docs: { description: { story: 'Renders a control with label, hint, and default value.' } },
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
    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'First label' })).toBeInTheDocument();
      await expect(canvas.getByText('First label')).toBeInTheDocument();
      await expect(canvas.getByText('This is a hint')).toBeInTheDocument();
      await expect(canvas.getByRole('textbox', { name: 'First label' })).toHaveValue(
        'First Default',
      );
    });
  },
};

// ---------------------------------------------------------------------------
// NoDefaultValue
// ---------------------------------------------------------------------------

export const NoDefaultValue: Story = {
  parameters: {
    docs: { description: { story: 'Renders a control without a default value.' } },
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
    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'First label' })).toBeInTheDocument();
      await expect(canvas.getByText('First label')).toBeInTheDocument();
      await expect(canvas.getByText('This is a hint')).toBeInTheDocument();
      await expect(canvas.getByRole('textbox', { name: 'First label' })).toHaveValue('');
    });
  },
};

// ---------------------------------------------------------------------------
// SubmitFormValues
// ---------------------------------------------------------------------------

export const SubmitFormValues: Story = {
  parameters: {
    docs: { description: { story: 'Fills all fields and submits, verifying the rendered form values.' } },
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
    const firstInput = canvas.getByRole('textbox', { name: 'First' });
    await userEvent.clear(firstInput);
    await userEvent.type(firstInput, 'This is the first control');

    const secondInput = canvas.getByRole('textbox', { name: 'Second' });
    await userEvent.clear(secondInput);
    await userEvent.type(secondInput, 'I entered something here');

    const thirdInput = canvas.getByRole('textbox', { name: 'Third' });
    await userEvent.clear(thirdInput);
    await userEvent.type(thirdInput, 'Here is some value');

    const fourthInput = canvas.getByRole('textbox', { name: 'Fourth' });
    await userEvent.clear(fourthInput);
    await userEvent.type(fourthInput, 'Go Fourth');

    const fifthInput = canvas.getByRole('textbox', { name: 'Fifth' });
    await userEvent.clear(fifthInput);
    await userEvent.type(fifthInput, 'Something');

    const groupedFirstInput = canvas.getByRole('textbox', { name: 'Grouped First label' });
    await userEvent.clear(groupedFirstInput);
    await userEvent.type(groupedFirstInput, 'Grouped Input');

    const nestedSecondInput = canvas.getByRole('textbox', { name: 'Nested Second label' });
    await userEvent.clear(nestedSecondInput);
    await userEvent.type(nestedSecondInput, 'Nested Grouped Input');

    // Click submit button
    await userEvent.click(canvas.getByRole('button', { name: 'Submit' }));

    // Verify rendered form values
    await waitFor(async () => {
      await expect(canvas.getByTestId('first-value')).toHaveTextContent(
        'This is the first control',
      );
      await expect(canvas.getByTestId('second-value')).toHaveTextContent(
        'I entered something here',
      );
      await expect(canvas.getByTestId('third-value')).toHaveTextContent(
        'Here is some value',
      );
      await expect(canvas.getByTestId('fourth-value')).toHaveTextContent(
        'Go Fourth',
      );
      await expect(canvas.getByTestId('fifth-value')).toHaveTextContent(
        'Something',
      );
      await expect(
        canvas.getByTestId('first-group.grouped-first-value'),
      ).toHaveTextContent('Grouped Input');
      await expect(
        canvas.getByTestId('first-group.nested-group.nested-second-value'),
      ).toHaveTextContent('Nested Grouped Input');
    });
  },
};
