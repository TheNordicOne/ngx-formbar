import { NgxFwForm } from '../../lib/types/form.type';
import { TestContent } from './test';

describe('Type Safety', () => {
  it('should not have any TS errors when using default type generic', () => {
    const form: NgxFwForm = {
      content: [
        {
          id: 'first',
          type: 'test-text-control',
          label: 'First',
          defaultValue: 'default-first',
        },
        {
          id: 'block',
          type: 'test-block',
          message: 'This is an information',
        },
        {
          type: 'test-group',
          id: 'first-group',
          title: 'First Group',
          controls: [
            {
              id: 'grouped-first',
              type: 'test-text-control',
              label: 'Grouped First label',
              controls: [],
            },
            {
              id: 'grouped-block',
              type: 'test-block',
              message: 'This is an information',
            },
            {
              type: 'test-group',
              id: 'nested-group',
              title: 'Nested Group',
              controls: [
                {
                  id: 'nested-first',
                  type: 'test-text-control',
                  label: 'Nested First label',
                  defaultValue: 'default-nested-first',
                },
                {
                  id: 'nested-block',
                  type: 'test-block',
                  message: 'This is an information',
                },
              ],
            },
          ],
        },
      ],
    };
    expect(form).toBeTruthy();
  });

  it('should not have any TS errors when using default custom generic', () => {
    const form: NgxFwForm<TestContent> = {
      content: [
        {
          id: 'first',
          type: 'test-text-control',
          label: 'First',
          defaultValue: 'default-first',
        },
        {
          id: 'block',
          type: 'test-block',
          message: 'This is an information',
        },
        {
          type: 'test-group',
          id: 'first-group',
          title: 'First Group',
          controls: [
            {
              id: 'grouped-first',
              type: 'test-text-control',
              label: 'Grouped First label',
            },
            {
              id: 'grouped-block',
              type: 'test-block',
              message: 'This is an information',
            },
            {
              type: 'test-group',
              id: 'nested-group',
              title: 'Nested Group',
              controls: [
                {
                  id: 'nested-first',
                  type: 'test-text-control',
                  label: 'Nested First label',
                  defaultValue: 'default-nested-first',
                },
                {
                  id: 'nested-block',
                  type: 'test-block',
                  message: 'This is an information',
                },
              ],
            },
          ],
        },
      ],
    };
    expect(form).toBeTruthy();
  });
});
