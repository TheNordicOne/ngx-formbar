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
    const input = canvas.getByRole('textbox', { name: 'First label' });

    // Type a single character — too short for minLength(3)
    await userEvent.type(input, 'X');
    await userEvent.tab();

    await waitFor(async () => {
      await expect(
        canvas.getByText('Minimum 3 characters required'),
      ).toBeInTheDocument();
    });

    // Type enough characters to satisfy minLength(3)
    await userEvent.clear(input);
    await userEvent.type(input, 'XYZ');

    await waitFor(async () => {
      await expect(
        canvas.queryByText('Minimum 3 characters required'),
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
    const input = canvas.getByRole('textbox', { name: 'First label' });

    // Type a single character that does not contain 'a'
    await userEvent.type(input, 'X');
    await userEvent.tab();

    await waitFor(async () => {
      await expect(
        canvas.getByText('Minimum 3 characters required'),
      ).toBeInTheDocument();
      await expect(
        canvas.getByText('Must contain the letter "a"'),
      ).toBeInTheDocument();
    });

    // Satisfy minLength but not letter validator
    await userEvent.clear(input);
    await userEvent.type(input, 'XYZ');

    await waitFor(async () => {
      await expect(
        canvas.queryByText('Minimum 3 characters required'),
      ).not.toBeInTheDocument();
      await expect(
        canvas.getByText('Must contain the letter "a"'),
      ).toBeInTheDocument();
    });

    // Satisfy both validators (contains 'a' and length >= 3)
    await userEvent.clear(input);
    await userEvent.type(input, 'abc');

    await waitFor(async () => {
      await expect(
        canvas.queryByText('Minimum 3 characters required'),
      ).not.toBeInTheDocument();
      await expect(
        canvas.queryByText('Must contain the letter "a"'),
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
    const input = canvas.getByRole('textbox', { name: 'First label' });

    // Type a single character that does not contain 'a' — triggers minlength + letter
    await userEvent.type(input, 'X');
    await userEvent.tab();

    await waitFor(async () => {
      await expect(
        canvas.getByText('Minimum 3 characters required'),
      ).toBeInTheDocument();
      await expect(
        canvas.getByText('Must contain the letter "a"'),
      ).toBeInTheDocument();
    });

    // Clear the input — triggers required (from combined) as well
    await userEvent.clear(input);

    await waitFor(async () => {
      await expect(
        canvas.getByText('Required'),
      ).toBeInTheDocument();
    });

    // Type a valid value satisfying all combined validators
    await userEvent.type(input, 'abc');

    await waitFor(async () => {
      await expect(
        canvas.queryByText('Minimum 3 characters required'),
      ).not.toBeInTheDocument();
      await expect(
        canvas.queryByText('Must contain the letter "a"'),
      ).not.toBeInTheDocument();
      await expect(
        canvas.queryByText('Required'),
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
    const input = canvas.getByRole('textbox', { name: 'First label' });

    // Type a short value without 'a' — sync errors appear
    await userEvent.type(input, 'X');
    await userEvent.tab();

    await waitFor(async () => {
      await expect(
        canvas.getByText('Minimum 3 characters required'),
      ).toBeInTheDocument();
      await expect(
        canvas.getByText('Must contain the letter "a"'),
      ).toBeInTheDocument();
    });

    // Type a value that satisfies sync validators but not async ('a' present, length >= 3)
    await userEvent.clear(input);
    await userEvent.type(input, 'aSY');

    await waitFor(
      async () => {
        await expect(
          canvas.queryByText('Minimum 3 characters required'),
        ).not.toBeInTheDocument();
        await expect(
          canvas.queryByText('Must contain the letter "a"'),
        ).not.toBeInTheDocument();
        await expect(
          canvas.getByText('Value must contain "async"'),
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
          canvas.queryByText('Value must contain "async"'),
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
      await expect(canvas.getByRole('group', { name: 'First Group' })).toBeInTheDocument();

      await expect(canvas.getByRole('textbox', { name: 'First label' })).toBeInTheDocument();

      await expect(canvas.getByRole('group', { name: 'Nested Group' })).toBeInTheDocument();

      await expect(
        canvas.getByRole('textbox', { name: 'Second label' }),
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
    const firstInput = canvas.getByRole('textbox', { name: 'First label' });
    const secondInput = canvas.getByRole('textbox', { name: 'Second label' });

    // Type duplicate values in both controls
    await userEvent.type(firstInput, 'X');
    await userEvent.type(secondInput, 'X');
    await userEvent.tab();

    await waitFor(async () => {
      await expect(
        canvas.getByText('No duplicate values allowed'),
      ).toBeInTheDocument();
    });

    // Clear first input to remove duplicate, but type 'A' to trigger forbidden-letter-a
    await userEvent.clear(firstInput);
    await userEvent.type(firstInput, 'A');

    await waitFor(async () => {
      await expect(
        canvas.queryByText('No duplicate values allowed'),
      ).not.toBeInTheDocument();
      await expect(
        canvas.getByText('The letter "A" is not allowed'),
      ).toBeInTheDocument();
    });

    // Type a value without 'a' that is not a duplicate
    await userEvent.clear(firstInput);
    await userEvent.type(firstInput, 'Y');

    await waitFor(async () => {
      await expect(
        canvas.queryByText('No duplicate values allowed'),
      ).not.toBeInTheDocument();
      await expect(
        canvas.queryByText('The letter "A" is not allowed'),
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
    const firstInput = canvas.getByRole('textbox', { name: 'First label' });

    // Type a value that does not contain 'sync' — async group validator fails
    await userEvent.type(firstInput, 'X');
    await userEvent.tab();

    await waitFor(
      async () => {
        await expect(
          canvas.getByText('At least one value must contain "sync"'),
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
          canvas.queryByText('At least one value must contain "sync"'),
        ).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  },
};
