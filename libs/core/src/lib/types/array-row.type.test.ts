import { NgxFbArray } from './content.type';

describe('NgxFbArray rowControl type safety', () => {
  it('accepts a row whose top control omits hideStrategy', () => {
    const array: NgxFbArray = {
      type: 'array',
      rowControl: { type: 'text', label: 'Tag' },
    };
    expect(array).toBeTruthy();
  });

  it("accepts a row top with hideStrategy 'keep'", () => {
    const array: NgxFbArray = {
      type: 'array',
      rowControl: { type: 'text', hideStrategy: 'keep' },
    };
    expect(array).toBeTruthy();
  });

  it("rejects a row top with hideStrategy 'remove'", () => {
    const array: NgxFbArray = {
      type: 'array',
      rowControl: {
        type: 'text',
        // @ts-expect-error - a row top may only use hideStrategy 'keep'
        hideStrategy: 'remove',
      },
    };
    expect(array).toBeTruthy();
  });

  it("allows hideStrategy 'remove' on a control nested inside a group row", () => {
    const array: NgxFbArray = {
      type: 'array',
      rowControl: {
        type: 'group',
        controls: {
          field: { type: 'text', hideStrategy: 'remove' },
        },
      },
    };
    expect(array).toBeTruthy();
  });
});
