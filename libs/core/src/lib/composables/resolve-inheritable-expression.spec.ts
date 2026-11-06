import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ExpressionService } from '../services/expression';
import { resolveInheritableExpression } from './resolve-inheritable-expression';

describe('resolveInheritableExpression', () => {
  function resolve(option: string | boolean | undefined, parent: boolean) {
    return resolveInheritableExpression(
      signal(option),
      signal({ nothing: null }),
      TestBed.inject(ExpressionService),
      signal(parent),
    )();
  }

  it('treats an expression that yields nothing as false', () => {
    expect(resolve('nothing', true)).toBe(false);
  });

  it('inherits only without an option', () => {
    expect(resolve(undefined, true)).toBe(true);
    expect(resolve(false, true)).toBe(false);
  });
});
