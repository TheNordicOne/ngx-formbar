import type { Meta, StoryObj } from '@storybook/angular';
import { StoryFormHostComponent } from './story-form-host.component';

const meta: Meta<StoryFormHostComponent> = {
  title: 'Reactive Forms/Form Basic',
  component: StoryFormHostComponent,
};

export default meta;
type Story = StoryObj<StoryFormHostComponent>;

// ---------------------------------------------------------------------------
// AllControls
// ---------------------------------------------------------------------------

export const AllControls: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'The most basic case — renders exactly one of every control type with no expressions, so every control is always visible.',
      },
    },
  },
  args: {
    formConfig: {
      content: {
        text: {
          type: 'text',
          label: 'Text',
        },
        number: {
          type: 'number',
          label: 'Number',
          min: 0,
        },
        checkbox: {
          type: 'checkbox',
          label: 'Checkbox',
        },
        radio: {
          type: 'radio',
          label: 'Radio',
          options: [
            { id: 'one', value: 'one', label: 'One' },
            { id: 'two', value: 'two', label: 'Two' },
          ],
        },
        dropdown: {
          type: 'dropdown',
          label: 'Dropdown',
          options: [
            { id: 'one', value: 'one', label: 'One' },
            { id: 'two', value: 'two', label: 'Two' },
          ],
        },
        note: {
          type: 'note',
          message: 'This is a note',
          isControl: false,
        },
        textarea: {
          type: 'textarea',
          label: 'Textarea',
        },
        date: {
          type: 'date',
          label: 'Date',
        },
        file: {
          type: 'file',
          label: 'File',
        },
        group: {
          type: 'group',
          legend: 'Group',
          controls: {
            groupText: {
              type: 'text',
              label: 'Text',
            },
            groupNumber: {
              type: 'number',
              label: 'Number',
              min: 0,
            },
            groupCheckbox: {
              type: 'checkbox',
              label: 'Checkbox',
            },
            groupRadio: {
              type: 'radio',
              label: 'Radio',
              options: [
                { id: 'one', value: 'one', label: 'One' },
                { id: 'two', value: 'two', label: 'Two' },
              ],
            },
            groupDropdown: {
              type: 'dropdown',
              label: 'Dropdown',
              options: [
                { id: 'one', value: 'one', label: 'One' },
                { id: 'two', value: 'two', label: 'Two' },
              ],
            },
            groupNote: {
              type: 'note',
              message: 'This is a note',
              isControl: false,
            },
            groupTextarea: {
              type: 'textarea',
              label: 'Textarea',
            },
            groupDate: {
              type: 'date',
              label: 'Date',
            },
            groupFile: {
              type: 'file',
              label: 'File',
            },
            subGroup: {
              type: 'group',
              legend: 'Group',
              controls: {
                subGroupText: {
                  type: 'text',
                  label: 'Text',
                },
              },
            },
          },
        },
      },
    },
  },
};
