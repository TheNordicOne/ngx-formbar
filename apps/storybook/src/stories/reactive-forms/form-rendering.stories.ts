import type { Meta, StoryObj } from '@storybook/angular';
import { expect, userEvent, waitFor } from 'storybook/test';
import { applicationConfig } from '@storybook/angular';
import { provideReactiveFormsExamples } from '@ngx-formbar/examples/reactive-forms';
import { NgxFbBaseContent } from '@ngx-formbar/core';
import { StoryFormHostComponent } from './story-form-host.component';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function clearAndType(canvas: any, testId: string, value: string) {
  const input = canvas.getByTestId(testId);
  await userEvent.clear(input);
  await userEvent.type(input, value);
}

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
      await expect(canvas.getByTestId('first-input')).toHaveValue('default-first');
      await expect(canvas.getByTestId('second-input')).toHaveValue('default-second');
      await expect(canvas.getByTestId('third-input')).toHaveValue('default-third');
      await expect(canvas.getByTestId('fourth-input')).toHaveValue('default-fourth');
      await expect(canvas.getByTestId('fifth-input')).toHaveValue('default-fifth');

      // Note block renders its message
      await expect(canvas.getByTestId('block')).toHaveTextContent(
        'This is an information',
      );

      // First group with legend
      await expect(canvas.getByTestId('first-group-title')).toHaveTextContent(
        'First Group',
      );
      await expect(canvas.getByTestId('first-group-grouped-first-input')).toHaveValue(
        'default-grouped-first',
      );

      // Nested group with legend
      await expect(
        canvas.getByTestId('first-group-nested-group-title'),
      ).toHaveTextContent('Nested Group');
      await expect(
        canvas.getByTestId(
          'first-group-nested-group-nested-second-input',
        ),
      ).toHaveValue('default-nested-second');
    });
  },
};

// ---------------------------------------------------------------------------
// PatchAndReset
// ---------------------------------------------------------------------------

export const PatchAndReset: Story = {
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
      await expect(canvas.getByTestId('first-input')).toHaveValue('default-first');
      await expect(canvas.getByTestId('second-input')).toHaveValue('default-second');
      await expect(canvas.getByTestId('third-input')).toHaveValue('default-third');
      await expect(canvas.getByTestId('fourth-input')).toHaveValue('default-fourth');
      await expect(canvas.getByTestId('fifth-input')).toHaveValue('default-fifth');
    });

    // Patch values
    await userEvent.click(canvas.getByTestId('patch'));

    await waitFor(async () => {
      await expect(canvas.getByTestId('first-input')).toHaveValue('patched-first');
      await expect(canvas.getByTestId('second-input')).toHaveValue('patched-second');
      await expect(canvas.getByTestId('third-input')).toHaveValue('patched-third');
      await expect(canvas.getByTestId('fourth-input')).toHaveValue('patched-fourth');
      await expect(canvas.getByTestId('fifth-input')).toHaveValue('patched-fifth');
    });

    // Reset — nullable controls clear, nonNullable controls revert to defaults
    await userEvent.click(canvas.getByTestId('reset'));

    await waitFor(async () => {
      await expect(canvas.getByTestId('first-input')).toHaveValue('');
      await expect(canvas.getByTestId('second-input')).toHaveValue('');
      await expect(canvas.getByTestId('third-input')).toHaveValue('');
      await expect(canvas.getByTestId('fourth-input')).toHaveValue('default-fourth');
      await expect(canvas.getByTestId('fifth-input')).toHaveValue('default-fifth');
    });
  },
};

// ---------------------------------------------------------------------------
// ContentRegistration
// ---------------------------------------------------------------------------

export const ContentRegistration: Story = {
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
      await expect(canvas.getByTestId('control')).toBeInTheDocument();
    });
  },
};

// ---------------------------------------------------------------------------
// DefaultTestId
// ---------------------------------------------------------------------------

export const DefaultTestId: Story = {
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
      await expect(canvas.getByTestId('first')).toBeInTheDocument();
      await expect(canvas.getByTestId('first-label')).toHaveTextContent(
        'First label',
      );
      await expect(canvas.getByTestId('first-hint')).toHaveTextContent(
        'This is a hint',
      );
      await expect(canvas.getByTestId('first-input')).toHaveValue(
        'First Default',
      );
    });
  },
};

// ---------------------------------------------------------------------------
// NoDefaultValue
// ---------------------------------------------------------------------------

export const NoDefaultValue: Story = {
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
      await expect(canvas.getByTestId('first')).toBeInTheDocument();
      await expect(canvas.getByTestId('first-label')).toHaveTextContent(
        'First label',
      );
      await expect(canvas.getByTestId('first-hint')).toHaveTextContent(
        'This is a hint',
      );
      await expect(canvas.getByTestId('first-input')).toHaveValue('');
    });
  },
};

// ---------------------------------------------------------------------------
// SubmitFormValues
// ---------------------------------------------------------------------------

export const SubmitFormValues: Story = {
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
    // Clear and type custom values into all controls
    await clearAndType(canvas, 'first-input', 'This is the first control');
    await clearAndType(canvas, 'second-input', 'I entered something here');
    await clearAndType(canvas, 'third-input', 'Here is some value');
    await clearAndType(canvas, 'fourth-input', 'Go Fourth');
    await clearAndType(canvas, 'fifth-input', 'Something');
    await clearAndType(
      canvas,
      'first-group-grouped-first-input',
      'Grouped Input',
    );
    await clearAndType(
      canvas,
      'first-group-nested-group-nested-second-input',
      'Nested Grouped Input',
    );

    // Click submit button
    await userEvent.click(canvas.getByTestId('submit'));

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
