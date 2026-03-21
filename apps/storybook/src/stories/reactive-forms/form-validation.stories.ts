import type { Meta, StoryObj } from '@storybook/angular';
import { expect, waitFor } from 'storybook/test';
import { StoryFormHostComponent } from './story-form-host.component';

const meta: Meta<StoryFormHostComponent> = {
  title: 'Reactive Forms/Form Validation',
  component: StoryFormHostComponent,
};

export default meta;
type Story = StoryObj<StoryFormHostComponent>;

// ---------------------------------------------------------------------------
// SingleValidator
// ---------------------------------------------------------------------------

export const SingleValidator: Story = {
  args: {
    formConfig: {
      content: {
        first: {
          type: 'text',
          label: 'First label',
          validators: ['min-chars'],
        },
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByTestId('first-input');

    // Type a single character — too short for minLength(3)
    await userEvent.type(input, 'X');
    await userEvent.tab();

    await waitFor(async () => {
      await expect(
        canvas.getByTestId('first-validation-error-minlength'),
      ).toBeInTheDocument();
    });

    // Type enough characters to satisfy minLength(3)
    await userEvent.clear(input);
    await userEvent.type(input, 'XYZ');

    await waitFor(async () => {
      await expect(
        canvas.queryByTestId('first-validation-error-minlength'),
      ).not.toBeInTheDocument();
    });
  },
};

// ---------------------------------------------------------------------------
// MultipleValidators
// ---------------------------------------------------------------------------

export const MultipleValidators: Story = {
  args: {
    formConfig: {
      content: {
        first: {
          type: 'text',
          label: 'First label',
          validators: ['min-chars', 'letter'],
        },
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByTestId('first-input');

    // Type a single character that does not contain 'a'
    await userEvent.type(input, 'X');
    await userEvent.tab();

    await waitFor(async () => {
      await expect(
        canvas.getByTestId('first-validation-error-minlength'),
      ).toBeInTheDocument();
      await expect(
        canvas.getByTestId('first-validation-error-letter'),
      ).toBeInTheDocument();
    });

    // Satisfy minLength but not letter validator
    await userEvent.clear(input);
    await userEvent.type(input, 'XYZ');

    await waitFor(async () => {
      await expect(
        canvas.queryByTestId('first-validation-error-minlength'),
      ).not.toBeInTheDocument();
      await expect(
        canvas.getByTestId('first-validation-error-letter'),
      ).toBeInTheDocument();
    });

    // Satisfy both validators (contains 'a' and length >= 3)
    await userEvent.clear(input);
    await userEvent.type(input, 'abc');

    await waitFor(async () => {
      await expect(
        canvas.queryByTestId('first-validation-error-minlength'),
      ).not.toBeInTheDocument();
      await expect(
        canvas.queryByTestId('first-validation-error-letter'),
      ).not.toBeInTheDocument();
    });
  },
};

// ---------------------------------------------------------------------------
// CombinedValidator
// ---------------------------------------------------------------------------

export const CombinedValidator: Story = {
  args: {
    formConfig: {
      content: {
        first: {
          type: 'text',
          label: 'First label',
          validators: ['combined'],
        },
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByTestId('first-input');

    // Type a single character that does not contain 'a' — triggers minlength + letter
    await userEvent.type(input, 'X');
    await userEvent.tab();

    await waitFor(async () => {
      await expect(
        canvas.getByTestId('first-validation-error-minlength'),
      ).toBeInTheDocument();
      await expect(
        canvas.getByTestId('first-validation-error-letter'),
      ).toBeInTheDocument();
    });

    // Clear the input — triggers required (from combined) as well
    await userEvent.clear(input);

    await waitFor(async () => {
      await expect(
        canvas.getByTestId('first-validation-error-required'),
      ).toBeInTheDocument();
    });

    // Type a valid value satisfying all combined validators
    await userEvent.type(input, 'abc');

    await waitFor(async () => {
      await expect(
        canvas.queryByTestId('first-validation-error-minlength'),
      ).not.toBeInTheDocument();
      await expect(
        canvas.queryByTestId('first-validation-error-letter'),
      ).not.toBeInTheDocument();
      await expect(
        canvas.queryByTestId('first-validation-error-required'),
      ).not.toBeInTheDocument();
    });
  },
};

// ---------------------------------------------------------------------------
// AsyncValidator
// ---------------------------------------------------------------------------

export const AsyncValidator: Story = {
  args: {
    formConfig: {
      content: {
        first: {
          type: 'text',
          label: 'First label',
          validators: ['min-chars', 'letter'],
          asyncValidators: ['async'],
        },
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByTestId('first-input');

    // Type a short value without 'a' — sync errors appear
    await userEvent.type(input, 'X');
    await userEvent.tab();

    await waitFor(async () => {
      await expect(
        canvas.getByTestId('first-validation-error-minlength'),
      ).toBeInTheDocument();
      await expect(
        canvas.getByTestId('first-validation-error-letter'),
      ).toBeInTheDocument();
    });

    // Type a value that satisfies sync validators but not async ('a' present, length >= 3)
    await userEvent.clear(input);
    await userEvent.type(input, 'aSY');

    await waitFor(
      async () => {
        await expect(
          canvas.queryByTestId('first-validation-error-minlength'),
        ).not.toBeInTheDocument();
        await expect(
          canvas.queryByTestId('first-validation-error-letter'),
        ).not.toBeInTheDocument();
        await expect(
          canvas.getByTestId('first-validation-error-async'),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Type a value that satisfies all validators including async (contains 'async')
    await userEvent.clear(input);
    await userEvent.type(input, 'async');

    await waitFor(
      async () => {
        await expect(
          canvas.queryByTestId('first-validation-error-async'),
        ).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  },
};

// ---------------------------------------------------------------------------
// GroupContent
// ---------------------------------------------------------------------------

export const GroupContent: Story = {
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
    await waitFor(async () => {
      await expect(canvas.getByTestId('test-group')).toBeInTheDocument();
      await expect(canvas.getByTestId('test-group-title')).toHaveTextContent(
        'First Group',
      );

      await expect(canvas.getByTestId('test-group-first')).toBeInTheDocument();

      await expect(canvas.getByTestId('test-group-nested-group')).toBeInTheDocument();
      await expect(
        canvas.getByTestId('test-group-nested-group-title'),
      ).toHaveTextContent('Nested Group');

      await expect(
        canvas.getByTestId('test-group-nested-group-second'),
      ).toBeInTheDocument();
    });
  },
};

// ---------------------------------------------------------------------------
// GroupValidator
// ---------------------------------------------------------------------------

export const GroupValidator: Story = {
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
            second: {
              type: 'text',
              label: 'Second label',
            },
          },
          validators: ['no-duplicates', 'forbidden-letter-a'],
        },
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    const firstInput = canvas.getByTestId('test-group-first-input');
    const secondInput = canvas.getByTestId('test-group-second-input');

    // Type duplicate values in both controls
    await userEvent.type(firstInput, 'X');
    await userEvent.type(secondInput, 'X');
    await userEvent.tab();

    await waitFor(async () => {
      await expect(
        canvas.getByTestId('test-group-validation-error-duplicates'),
      ).toBeInTheDocument();
    });

    // Clear first input to remove duplicate, but type 'A' to trigger forbidden-letter-a
    await userEvent.clear(firstInput);
    await userEvent.type(firstInput, 'A');

    await waitFor(async () => {
      await expect(
        canvas.queryByTestId('test-group-validation-error-duplicates'),
      ).not.toBeInTheDocument();
      await expect(
        canvas.getByTestId('test-group-validation-error-forbiddenLetterA'),
      ).toBeInTheDocument();
    });

    // Type a value without 'a' that is not a duplicate
    await userEvent.clear(firstInput);
    await userEvent.type(firstInput, 'Y');

    await waitFor(async () => {
      await expect(
        canvas.queryByTestId('test-group-validation-error-duplicates'),
      ).not.toBeInTheDocument();
      await expect(
        canvas.queryByTestId('test-group-validation-error-forbiddenLetterA'),
      ).not.toBeInTheDocument();
    });
  },
};

// ---------------------------------------------------------------------------
// GroupAsyncValidator
// ---------------------------------------------------------------------------

export const GroupAsyncValidator: Story = {
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
            second: {
              type: 'text',
              label: 'Second label',
            },
          },
          asyncValidators: ['async-group'],
        },
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    const firstInput = canvas.getByTestId('test-group-first-input');

    // Type a value that does not contain 'sync' — async group validator fails
    await userEvent.type(firstInput, 'X');
    await userEvent.tab();

    await waitFor(
      async () => {
        await expect(
          canvas.getByTestId('test-group-validation-error-async'),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Type a value containing 'sync' — async group validator passes
    await userEvent.clear(firstInput);
    await userEvent.type(firstInput, 'sync');

    await waitFor(
      async () => {
        await expect(
          canvas.queryByTestId('test-group-validation-error-async'),
        ).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  },
};
