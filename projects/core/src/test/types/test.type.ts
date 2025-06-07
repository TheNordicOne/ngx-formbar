import { TestTextControl } from './controls.type';
import { TestGroup } from './group.type';

// Playground for testing out types
export type MyAppControls = TestTextControl | TestGroup;

export const someControls: MyAppControls[] = [
  {
    id: 'first',
    type: 'test-text-control',
    label: 'First',
    defaultValue: 'default-first',
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
        defaultValue: 'default-grouped-first',
      },
      {
        type: 'test-group',
        id: 'nested-group',
        title: 'Nested Group',
        controls: [
          {
            id: 'nested-second',
            type: 'test-text-control',
            label: 'Nested Second label',
            defaultValue: 'default-nested-second',
          },
        ],
      },
    ],
  },
];
