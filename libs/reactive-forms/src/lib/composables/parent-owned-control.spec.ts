import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { NGXFB_PARENT_OWNED_CONTROL } from '../tokens/parent-owned-control';
import { withParentOwnedControl } from './parent-owned-control';

describe('withParentOwnedControl', () => {
  it('creates the control while a parent-owned row has no parent yet', () => {
    const created = new FormControl();

    TestBed.configureTestingModule({
      providers: [{ provide: NGXFB_PARENT_OWNED_CONTROL, useValue: true }],
    });

    const { instance, isDirectFormArrayChild } = TestBed.runInInjectionContext(
      () =>
        withParentOwnedControl({
          parent: { control: null, pathTo: (name) => name },
          controlName: signal('0'),
          createdInstance: signal(created),
          controlType: FormControl,
        }),
    );

    expect(instance()).toBe(created);
    expect(isDirectFormArrayChild).toBe(false);
  });
});
