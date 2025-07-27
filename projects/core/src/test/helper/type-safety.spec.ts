import { NgxFwForm } from '../../lib/types/form.type';
import { TestContent } from './test';

describe('Type Safety', () => {
  it('should not have any TS errors when using default type generic', () => {
    const form: NgxFwForm = {
      content: {
        first: {
          type: 'test-text-control',
          label: 'First',
          defaultValue: 'default-first',
        },
        block: {
          type: 'test-block',
          isControl: false,
          message: 'This is an information',
        },
        'first-group': {
          type: 'test-group',
          title: 'First Group',
          controls: {
            'grouped-first': {
              type: 'test-text-control',
              label: 'Grouped First label',
              controls: {},
            },
            'grouped-block': {
              type: 'test-block',
              message: 'This is an information',
              isControl: false,
            },
            'nested-group': {
              type: 'test-group',
              title: 'Nested Group',
              controls: {
                'nested-first': {
                  type: 'test-text-control',
                  label: 'Nested First label',
                  defaultValue: 'default-nested-first',
                },
                'nested-block': {
                  type: 'test-block',
                  message: 'This is an information',
                  isControl: false,
                },
              },
            },
          },
        },
      },
    };
    expect(form).toBeTruthy();
  });

  it('should not have any TS errors when using default custom generic', () => {
    const form: NgxFwForm<TestContent> = {
      content: {
        first: {
          type: 'test-text-control',
          label: 'First',
          defaultValue: 'default-first',
        },
        block: {
          type: 'test-block',
          message: 'This is an information',
          isControl: false,
        },
        'first-group': {
          type: 'test-group',
          title: 'First Group',
          controls: {
            'grouped-first': {
              type: 'test-text-control',
              label: 'Grouped First label',
            },
            'grouped-block': {
              type: 'test-block',
              message: 'This is an information',
              isControl: false,
            },
            'nested-group': {
              type: 'test-group',
              title: 'Nested Group',
              controls: {
                'nested-first': {
                  type: 'test-text-control',
                  label: 'Nested First label',
                  defaultValue: 'default-nested-first',
                },
                'nested-block': {
                  type: 'test-block',
                  message: 'This is an information',
                  isControl: false,
                },
              },
            },
          },
        },
      },
    };
    expect(form).toBeTruthy();
  });
});
