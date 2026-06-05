import { signal } from '@angular/core';
import {
  NgxFbArray,
  NgxFbBlock,
  NgxFbControl,
  NgxFbFormGroup,
} from '../types/content.type';
import {
  isFormbarArray,
  isFormbarBlock,
  isFormbarControl,
  isFormbarGroup,
} from './type-guards';

const control: NgxFbControl = { type: 'text' };
const group: NgxFbFormGroup = { type: 'group', controls: { a: control } };
const array: NgxFbArray = {
  type: 'array',
  rowControl: { type: 'text' },
};
const block: NgxFbBlock = { type: 'note', isControl: false };

describe('isFormbarGroup', () => {
  it('matches nodes with a controls property', () => {
    expect(isFormbarGroup(group)).toBe(true);
  });

  it('does not match arrays, controls, or blocks', () => {
    expect(isFormbarGroup(array)).toBe(false);
    expect(isFormbarGroup(control)).toBe(false);
    expect(isFormbarGroup(block)).toBe(false);
  });

  it('unwraps signals', () => {
    expect(isFormbarGroup(signal(group))).toBe(true);
    expect(isFormbarGroup(signal(array))).toBe(false);
  });
});

describe('isFormbarArray', () => {
  it('matches nodes with a rowControl property', () => {
    expect(isFormbarArray(array)).toBe(true);
  });

  it('does not match groups, controls, or blocks', () => {
    expect(isFormbarArray(group)).toBe(false);
    expect(isFormbarArray(control)).toBe(false);
    expect(isFormbarArray(block)).toBe(false);
  });

  it('unwraps signals', () => {
    expect(isFormbarArray(signal(array))).toBe(true);
    expect(isFormbarArray(signal(group))).toBe(false);
  });
});

describe('isFormbarControl', () => {
  it('matches plain controls', () => {
    expect(isFormbarControl(control)).toBe(true);
  });

  it('does not match groups or arrays', () => {
    expect(isFormbarControl(group)).toBe(false);
    expect(isFormbarControl(array)).toBe(false);
  });
});

describe('isFormbarBlock', () => {
  it('matches nodes with isControl === false', () => {
    expect(isFormbarBlock(block)).toBe(true);
  });

  it('does not match controls, groups, or arrays', () => {
    expect(isFormbarBlock(control)).toBe(false);
    expect(isFormbarBlock(group)).toBe(false);
    expect(isFormbarBlock(array)).toBe(false);
  });
});
