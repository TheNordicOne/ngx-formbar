import { NgxFbBlock, NgxFbControl, NgxFbFormGroup } from './content.type';
import { NgxFbForm } from './form.type';

interface TestTextControl extends NgxFbControl {
  type: 'test-text-control';
  hint?: string;
  defaultValue?: string;
}

interface InfoBlock extends NgxFbBlock {
  type: 'test-block';
  message: string;
}

interface TestGroup extends NgxFbFormGroup<TestContent> {
  type: 'test-group';
}

type TestContent = TestTextControl | TestGroup | InfoBlock;

describe('NgxFbForm type safety', () => {
  it('accepts a valid form with the default generic', () => {
    const form: NgxFbForm = {
      content: {
        ctrl: { type: 'anything', label: 'x' },
        block: { type: 'b', isControl: false },
        group: { type: 'g', controls: {} },
      },
    };
    expect(form).toBeTruthy();
  });

  it('accepts a valid form with a custom content union', () => {
    const form: NgxFbForm<TestContent> = {
      content: {
        ctrl: { type: 'test-text-control', defaultValue: 'x' },
        block: { type: 'test-block', isControl: false, message: 'hi' },
        group: {
          type: 'test-group',
          controls: {
            nested: { type: 'test-text-control' },
            nestedBlock: {
              type: 'test-block',
              isControl: false,
              message: 'nested',
            },
            nestedGroup: { type: 'test-group', controls: {} },
          },
        },
      },
    };
    expect(form).toBeTruthy();
  });

  it('rejects type literals not in the content union', () => {
    const form: NgxFbForm<TestContent> = {
      content: {
        // @ts-expect-error - 'not-in-union' is not a valid TestContent type literal
        x: { type: 'not-in-union' },
      },
    };
    expect(form).toBeTruthy();
  });

  it('rejects content entries missing the type field', () => {
    const form: NgxFbForm<TestContent> = {
      content: {
        // @ts-expect-error - missing required 'type' field
        x: { label: 'no type' },
      },
    };
    expect(form).toBeTruthy();
  });

  it('rejects blocks missing the isControl discriminator', () => {
    const form: NgxFbForm<TestContent> = {
      content: {
        // @ts-expect-error - block must declare isControl: false
        x: { type: 'test-block', message: 'hi' },
      },
    };
    expect(form).toBeTruthy();
  });

  it('rejects blocks with isControl set to true', () => {
    const form: NgxFbForm<TestContent> = {
      content: {
        // @ts-expect-error - isControl must be the literal false
        x: { type: 'test-block', isControl: true, message: 'hi' },
      },
    };
    expect(form).toBeTruthy();
  });

  it('rejects blocks missing required custom properties', () => {
    const form: NgxFbForm<TestContent> = {
      content: {
        // @ts-expect-error - InfoBlock requires 'message'
        x: { type: 'test-block', isControl: false },
      },
    };
    expect(form).toBeTruthy();
  });

  it('rejects groups missing the controls property', () => {
    const form: NgxFbForm<TestContent> = {
      content: {
        // @ts-expect-error - NgxFbFormGroup requires 'controls'
        x: { type: 'test-group' },
      },
    };
    expect(form).toBeTruthy();
  });

  it('rejects wrong value types on declared custom properties', () => {
    const form: NgxFbForm<TestContent> = {
      content: {
        // @ts-expect-error - defaultValue must be a string
        x: { type: 'test-text-control', defaultValue: 42 },
      },
    };
    expect(form).toBeTruthy();
  });

  it('rejects wrong value types on inherited base properties', () => {
    const form: NgxFbForm<TestContent> = {
      content: {
        // @ts-expect-error - label must be a string
        x: { type: 'test-text-control', label: 42 },
      },
    };
    expect(form).toBeTruthy();
  });

  it('enforces the content union in nested group controls', () => {
    const form: NgxFbForm<TestContent> = {
      content: {
        g: {
          type: 'test-group',
          controls: {
            // @ts-expect-error - nested entry must extend TestContent
            nested: { type: 'not-in-union' },
          },
        },
      },
    };
    expect(form).toBeTruthy();
  });

  it('enforces the controls requirement on nested groups', () => {
    const form: NgxFbForm<TestContent> = {
      content: {
        g: {
          type: 'test-group',
          controls: {
            // @ts-expect-error - nested group is missing 'controls'
            nestedGroup: { type: 'test-group' },
          },
        },
      },
    };
    expect(form).toBeTruthy();
  });
});

describe('Expression<T> type safety', () => {
  it('accepts a string expression', () => {
    const form: NgxFbForm<TestContent> = {
      content: {
        a: {
          type: 'test-text-control',
          hidden: "formValue['flag'] === true",
        },
      },
    };
    expect(form).toBeTruthy();
  });

  it('accepts a function returning the expected type', () => {
    const form: NgxFbForm<TestContent> = {
      content: {
        a: {
          type: 'test-text-control',
          hidden: (formValue) => formValue['flag'] === true,
        },
      },
    };
    expect(form).toBeTruthy();
  });

  it('rejects a function returning the wrong type', () => {
    const form: NgxFbForm<TestContent> = {
      content: {
        // @ts-expect-error - function must return boolean, not string
        a: { type: 'test-text-control', hidden: () => 'not a boolean' },
      },
    };
    expect(form).toBeTruthy();
  });

  it('only accepts a string expression or a function', () => {
    const form: NgxFbForm<TestContent> = {
      content: {
        // @ts-expect-error - 42 is neither a string expression nor a function
        a: { type: 'test-text-control', dynamicLabel: 42 },
      },
    };
    expect(form).toBeTruthy();
  });

  it('accepts a bare value when the property is Expression<T> | T', () => {
    const form: NgxFbForm<TestContent> = {
      content: {
        a: { type: 'test-text-control', disabled: true },
      },
    };
    expect(form).toBeTruthy();
  });
});

describe('FormContext type safety', () => {
  it('requires bracket access on formValue properties', () => {
    const form: NgxFbForm<TestContent> = {
      content: {
        a: {
          type: 'test-text-control',
          // @ts-expect-error - FormContext is Record<string, unknown>, dot access is disallowed
          hidden: (formValue) => !!formValue.flag,
        },
      },
    };
    expect(form).toBeTruthy();
  });

  it('exposes formValue properties as unknown, requiring a cast or narrowing', () => {
    const form: NgxFbForm<TestContent> = {
      content: {
        a: {
          type: 'test-text-control',
          // @ts-expect-error - formValue['name'] is unknown, not assignable to string
          dynamicLabel: (formValue): string => formValue['name'],
        },
      },
    };
    expect(form).toBeTruthy();
  });
});
